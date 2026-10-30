# Portfolio 5: Replication and Failover Architecture
## LedgerSpring Digital Bank (LSDB) | Mubarak Tijani (ID: 301915100)

---

## 1. Executive Overview

Core banking systems demand high availability without compromising financial consistency. For LedgerSpring Digital Bank (LSDB), the database topology separates transactional write workloads from analytical read workloads while preserving the immutable double-entry ledger invariants established in Portfolio 1 and Portfolio 3.

This document details the replication architecture, synchronization trade-offs, stale-read risks, failover mechanisms, and backup boundaries governing LSDB's distributed database deployment.

---

## 2. Node Roles and Topology

```
                  ┌─────────────────────────────────────────┐
                  │          Core Banking Client            │
                  └────────────────────┬────────────────────┘
                                       │
                        [Connection Router / PgBouncer]
                         /                           \
       (Writes & Spendable Balances)         (Read-Only Statements & Reports)
                       /                               \
                      ▼                                 ▼
      ┌───────────────────────────────┐ ┌───────────────────────────────┐
      │   PostgreSQL Primary Node     │ │  PostgreSQL Read Replica      │
      │   Role: Read/Write (CP)       │ │  Role: Read-Only (AP)         │
      │   - Enforces ACID constraints │ │  - Serves historical queries  │
      │   - Emits WAL stream          │ │  - Replays incoming WAL       │
      │   - Single source of truth    │ │  - Read-only transaction mode │
      └──────────────┬────────────────┘ └───────────────▲───────────────┘
                     │                                  │
                     └────── Physical Streaming ────────┘
                             Replication (WAL)
```

| Topology Component | Database Engine | Operating Mode | Workload Profile | Consistency Guarantee |
|---|---|---|---|---|
| **Primary Node** | PostgreSQL 16 (Writer) | `read-write` | Transfers, deposits, withdrawals, reversals, balance lock checks (`FOR UPDATE`) | Immediate Strong Consistency (ACID) |
| **Read Replica Node** | PostgreSQL 16 (Standby) | `read-only` (`hot_standby = on`) | Historical account statements, end-of-month financial reports, audit log queries | Eventual Consistency (bounded by replication lag) |
| **Event Projection Store** | MongoDB 7.0 Cluster | `read-write` | Multi-channel device telemetry, fraud velocity tracking, customer activity feed | Eventual Consistency (via Transactional Outbox) |

---

## 3. Synchronous vs. Asynchronous Replication Analysis

PostgreSQL supports both synchronous and asynchronous physical streaming replication via Write-Ahead Log (WAL) records. In a banking architecture, selecting the replication mode represents a classic CAP/PACELC trade-off between write availability, latency, and recovery durability.

### 3.1 Synchronous Replication (`synchronous_commit = on / remote_apply`)

In synchronous replication, a transaction commit on the Primary node does not return success to the calling client until one or more standby replicas confirm that the WAL records have been received and flushed to standby disk (or applied into standby memory).

* **Advantages:**
  * **Zero Data Loss (RPO = 0):** If the Primary node experiences catastrophic hardware failure, the synchronous standby is guaranteed to contain every committed financial transaction.
  * **Safe Failover:** Promoting the standby guarantees that no committed balance or ledger entry is lost.
* **Banking Trade-offs and Disadvantages:**
  * **Elevated Transaction Latency:** Every user transfer must wait for a network round-trip time (RTT) between data centres before acknowledging commit. In cross-zone or cross-region environments, latency increases from < 3 ms to 25–60 ms.
  * **Reduced Write Availability:** If the standby node crashes, reboots for patching, or experiences a network partition, the Primary node cannot obtain the required synchronous acknowledgment. Consequently, **all incoming customer transfers and deposits block indefinitely or abort**, violating banking availability standards.

### 3.2 Asynchronous Replication (`synchronous_commit = local`)

In asynchronous replication, the Primary node commits the transaction locally to its own WAL and disk, returns success to the client immediately, and streams the WAL records to standby replicas in the background.

* **Advantages:**
  * **Minimal Transaction Latency:** Commit speed depends entirely on local NVMe disk flush performance (~1–3 ms).
  * **High Write Availability:** The Primary continues processing deposits and transfers uninterrupted even if replicas are offline or unreachable.
* **Banking Trade-offs and Disadvantages:**
  * **Replication Lag:** Replicas lag behind the Primary by an interval determined by network bandwidth and standby replay rate (`replay_lag`).
  * **Potential Data Loss Window during Failover:** If the Primary suffers sudden catastrophic hardware destruction before unstreamed WAL records leave its network card, the most recent seconds of transactions may be lost upon standby promotion.

### 3.3 LSDB Architectural Decision

LSDB adopts a **hybrid semi-synchronous topology** for production deployments:
1. **Primary Data Centre (AZ-1):** PostgreSQL Primary.
2. **Local Standby (AZ-2, same region, < 1 ms latency):** Configured as a synchronous standby (`synchronous_commit = remote_write`). Guarantees zero committed transaction loss with negligible latency overhead.
3. **Disaster Recovery Standby (Region 2):** Configured as an asynchronous standby to avoid cross-region network latency penalties on local Nigerian payments.
4. **Local Evaluation Lab:** Configured with asynchronous streaming replication to demonstrate replication lag monitoring and connection routing.

---

## 4. The Stale-Read Risk and Spendable Balance Isolation

In an enterprise banking architecture utilizing read replicas, **stale reads represent the single most dangerous failure mode**.

### 4.1 The Double-Spend Attack Scenario

Consider what occurs if an application routes balance inquiries to an asynchronous read replica:

```
[Customer Alice: Initial Balance = 100,000 NGN]

Time t0: Alice transfers 90,000 NGN via Mobile App to Bob.
         -> Route: PRIMARY NODE (port 5432).
         -> Primary updates: Alice balance becomes 10,000 NGN.
         -> Primary writes 2 ledger entries and COMMITS.

Time t1: Network burst causes 800 ms replication lag between Primary and Replica.

Time t2 (t0 + 200 ms): Alice immediately initiates a second transfer of 80,000 NGN.
         -> Flawed App Router queries READ REPLICA for spendable balance!
         -> Read Replica has NOT yet replayed the t0 WAL segment.
         -> Replica returns: Alice available_balance = 100,000 NGN (STALE READ!).
         -> Application authorizes the 80,000 NGN transfer based on stale read!
         -> Primary receives mutation: 10,000 NGN - 80,000 NGN = -70,000 NGN!
         -> RESULT: Unauthorised overdraft or transfer abort, causing financial discrepancy!
```

### 4.2 Invariant Enforcement: Authoritative Routing Policy

To eliminate this vulnerability, LSDB enforces strict connection routing rules at the application gateway level:

1. **Spendable Balances MUST Route to Primary:**
   Any query evaluating whether an account has sufficient funds to transact, any pre-transfer authorization check, and any mutation must execute on the **Primary database node** using row-level locking (`SELECT available_balance FROM accounts WHERE account_id = $1 FOR UPDATE`).
2. **Replicas are Strictly Read-Only for Historical Projections:**
   Read replicas may only serve:
   * Historical account statement generation (e.g. "Download March 2026 PDF statement").
   * Regulatory reporting and anti-money laundering (AML) batch scans.
   * Internal auditing dashboards.
3. **Replication Lag Guardrails:**
   Before executing a statement query on a replica, the application router evaluates:
   ```sql
   SELECT EXTRACT(EPOCH FROM (clock_timestamp() - pg_last_xact_replay_timestamp())) AS lag_seconds;
   ```
   If `lag_seconds > 5.0`, the router automatically fails back to reading from the Primary node or displays a "Synchronising..." banner to the customer.

---

## 5. Failover, Promotion, and Client Reconnection

When the Primary database node experiences an unrecoverable failure (OS crash, power loss, kernel panic), the standby replica must be promoted to assume writer responsibilities.

### 5.1 Failover Lifecycle

```
[Normal State]
Client Traffic ──► [PgBouncer / Virtual IP] ──► [Primary (Writer)]
                                                      │ (WAL Stream)
                                                      ▼
                                                [Replica (Standby)]

[Failure Event]
Primary Crashes! 
1. Healthcheck probe fails (3 consecutive 2-second timeouts).
2. Consensus engine (Patroni / Raft quorum) confirms node isolation.
3. Fencing (STONITH): Old primary is isolated to prevent split-brain writes.
4. Promotion: Standby executes `pg_promote()` and exits recovery mode.
5. Virtual IP / DNS / Connection Pooler redirects write port 5432 to New Primary.
6. Client retries inflight requests using idempotency keys.
```

### 5.2 Split-Brain Prevention

A split-brain scenario occurs when a network partition separates Primary and Standby, leading both nodes to believe they are the authoritative writer. If clients write transactions to both nodes independently, the financial ledgers diverge irreversibly.

LSDB prevents split-brain using three defensive layers:
1. **Quorum-Based Leadership:** Node promotion requires a majority vote from an odd-numbered consensus cluster (e.g., 3-node etcd cluster). A partitioned node unable to reach quorum voluntarily demotes itself to read-only.
2. **Fencing (Node Isolation):** Automated fencing disables the virtual network interface of the failing node before promoting the standby.
3. **Client Pooler Reconnection:** Connection poolers (PgBouncer) reject write queries directed to nodes that report `pg_is_in_recovery() = true`.

### 5.3 Idempotency during Inflight Failover

If a customer submits a 50,000 NGN transfer and the Primary crashes during packet return, the mobile client encounters a TCP `ECONNRESET` or timeout. The user does not know whether their transfer committed or aborted.

* Because LSDB mandates client-generated `idempotency_key` headers (e.g. `idem_mobile_9921_001`), the client safely retries the exact same payload against the newly promoted Primary.
* The new Primary inspects its `idempotency_keys` table:
  * If the transaction committed before failover: it returns the stored `transaction_id` and confirmation without re-executing any ledger entries.
  * If the transaction did not commit: it executes the transfer cleanly from scratch.

---

## 6. Why Replication is NOT a Backup

A critical operational principle in database administration is that **replication does not replace backup and recovery procedures**.

| Threat Scenario | Replication Behavior | Backup & PITR Behavior |
|---|---|---|
| **Accidental `DROP TABLE`** | The drop command executes instantly on the Primary and replicates to all standbys within milliseconds. All replicas lose the table immediately. | Point-in-Time Recovery (PITR) replays WAL logs up to `1 second before the DROP TABLE`, restoring all data intact. |
| **Rogue / Corrupting UPDATE** | `UPDATE accounts SET available_balance = 0` replicates to every standby node instantly. | Restores a base backup taken prior to the event and recovers uncorrupted records. |
| **Data Corruption / Malicious Ransomware** | Storage-level block corruption or encrypted tables replicate directly to physical standby replicas. | Immutable, write-once-read-many (WORM) offsite object storage backups remain protected and uncorrupted. |
| **Site Catastrophe** | Loss of an entire availability zone destroys both primary and synchronous standby. | Geographically replicated cold backups in an independent cloud region enable bare-metal rebuild. |

Replication provides **high availability and zero-downtime failover**. Backups and Write-Ahead Log archiving provide **data durability and disaster recovery**. Both are strictly required.

---

## 7. Implementation Status Classification

In accordance with course guidelines, the distributed components are classified as follows:

| Component | Status | Demonstration Method |
|---|---|---|
| **Authoritative Relational Core** | **Implemented** | PostgreSQL 16 on local workstation (`ledgerspring`). |
| **Deterministic Locking & Invariants** | **Implemented** | Row-level locking (`SELECT ... FOR UPDATE`), idempotency engine, balanced ledger. |
| **Read Routing & Stale-Read Detection** | **Locally Simulated** | Executable script [`Tijani_Mubarak_301915100_P5_ReadRoutingSimulator.js`](./scripts/Tijani_Mubarak_301915100_P5_ReadRoutingSimulator.js) proving Primary write routing and lag detection. |
| **Containerized Multi-Node Topology** | **Locally Simulated** | Multi-container Docker Compose file ([`docker-compose.yml`](./docker/docker-compose.yml)) with Primary, Replica, and MongoDB. |
| **Disaster Recovery & Restore Drill** | **Locally Simulated** | Executable script [`Tijani_Mubarak_301915100_P5_BackupRestoreDrill.sh`](./scripts/Tijani_Mubarak_301915100_P5_BackupRestoreDrill.sh) performing full backup, table wipe simulation, restore, and 100% ledger audit verification. |
| **Multi-Region Cross-Continent Cloud** | **Architectural Proposal** | High-level reference architecture documenting CAP/PACELC trade-offs and CBN regulatory compliance. |

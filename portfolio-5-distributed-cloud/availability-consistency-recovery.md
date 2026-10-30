# Portfolio 5: Availability, Consistency, and Recovery Architecture
## LedgerSpring Digital Bank (LSDB) | Mubarak Tijani (ID: 301915100)

---

## 1. Executive Summary

A financial core banking database cannot treat availability, consistency, and disaster recovery as theoretical concepts. Every failure scenario must be governed by deterministic trade-offs, measurable recovery objectives, automated point-in-time recovery mechanisms, and continuous telemetry alerting.

This document formalizes LedgerSpring Digital Bank's (LSDB) consistency decisions under the CAP/PACELC theorems, defines its target Recovery Point Objective (RPO) and Recovery Time Objective (RTO), details its Write-Ahead Log (WAL) archiving and Point-in-Time Recovery (PITR) strategy, and establishes critical operational alerting thresholds.

---

## 2. CAP and PACELC Engineering Decisions

Rather than presenting textbook definitions, LSDB applies explicit trade-offs based on operational subsystem boundaries:

```
                  ┌──────────────────────────────────────────────┐
                  │   LSDB Polyglot Architectural Separation     │
                  └──────────────────────┬───────────────────────┘
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   ▼                                           ▼
   ┌───────────────────────────────┐           ┌───────────────────────────────┐
   │ PostgreSQL Core Banking (CP)  │           │  MongoDB Event Streams (AP)   │
   │  - System of Record           │           │  - Audit & Telemetry          │
   │  - Accounts & Ledgers         │           │  - Customer Activity Feeds    │
   │  - Strict Immediate Invariant │           │  - Fraud Pattern Analytics    │
   │  - Money cannot be created/   │           │  - Eventual projection        │
   │    lost during partitions.    │           │    acceptable for read search.│
   └───────────────────────────────┘           └───────────────────────────────┘
```

### 2.1 Subsystem 1: Authoritative Core Banking (PostgreSQL - CP Engine)
* **Under Partition (P):** LSDB trades **Availability (A) for Consistency (C)**.
  * If a network partition isolates the Primary database node from consensus or storage, the primary halts write processing and rejects incoming transfer requests rather than risking split-brain balance divergence or uncoordinated double-spending.
* **Under Normal Operation (E):** LSDB trades **Latency (L) for Consistency (C)**.
  * Every balance mutation enforces synchronous row locks (`SELECT ... FOR UPDATE`) and flushes WAL to disk before returning confirmation, incurring a 2–4 ms latency cost to ensure immediate ledger consistency.

### 2.2 Subsystem 2: Event Telemetry & Projections (MongoDB - AP Engine)
* **Under Partition (P):** LSDB trades **Consistency (C) for Availability (A)**.
  * Customer mobile feeds, login telemetry, and fraud risk scores continue serving reads from available replica set members (`readPreference: "secondaryPreferred"`).
* **Under Normal Operation (E):** LSDB trades **Consistency (C) for Latency (L)**.
  * Writes to the event projection store accept eventual consistency. A customer's recent transfer may take up to 200 ms to appear in their mobile activity timeline, but the core balance in PostgreSQL is already safely debited.

---

## 3. Disaster Recovery Objectives (Design Targets)

> **Important Coursework Distinction:** The RPO and RTO figures below represent **engineered architectural design targets** based on backup frequency and automated failover topologies, not verified third-party commercial guarantees.

| Metric | Target Specification | Architectural Mechanism | Business Impact if Breached |
|---|---|---|---|
| **Recovery Point Objective (RPO)** | **< 1 minute** | Continuous Write-Ahead Log (WAL) segment archiving to encrypted cloud object storage (S3 / GCS) every 60 seconds (or 16 MB boundary). Synchronous standby provides **RPO = 0** for local node crashes. | Loss of unarchived financial postings requiring manual statement reconciliation with the central NIP switch. |
| **Recovery Time Objective (RTO)** | **< 15 minutes** | Automated standby node promotion via healthcheck consensus (< 30 seconds). Full disaster recovery restoration from base backup + WAL replay (< 15 minutes for 100 GB database). | Temporary downtime of customer mobile and web transfer initiation during catastrophic primary site destruction. |

---

## 4. Backup, Archival, and Point-in-Time Recovery (PITR) Strategy

Replication protects against hardware failures, but only **Point-in-Time Recovery (PITR)** protects against human error, software defects, and catastrophic corruption.

### 4.1 Backup Hierarchy

```
[Continuous / Live Engine]
  │
  ├─► (Every 60s / 16MB) ──► Continuous WAL Archiving (`archive_command`) ──► Cloud Object Storage
  │
  ├─► (Nightly at 02:00 UTC) ──► Physical Base Backup (`pg_basebackup`) ──► Encrypted Cold Storage
  │
  └─► (Weekly at Sunday 03:00 UTC) ──► Logical Schema Dump (`pg_dump`) ──► Regulatory Vault Storage
```

1. **Continuous WAL Archiving:**
   PostgreSQL continuously ships completed 16 MB WAL segments to secure offsite object storage:
   ```text
   archive_command = 'test ! -f /mnt/wal_archive/%f && cp %p /mnt/wal_archive/%f'
   ```
2. **Nightly Physical Base Backups:**
   A full, non-blocking binary snapshot of the database cluster using `pg_basebackup -Ft -z -P` executed against the read replica node to eliminate I/O load on the Primary.
3. **Weekly Logical Backups:**
   `pg_dump` logical exports capturing table definitions, constraints, and audit logs stored in write-once-read-many (WORM) storage for 7-year regulatory compliance.

### 4.2 Point-in-Time Recovery (PITR) Execution Drill

If an erroneous administrative command or rogue script corrupts the database (e.g. `UPDATE accounts SET available_balance = 0;` executed at `2026-10-26 14:15:22 UTC`):

```
                                Corrupting Command
                                (14:15:22 UTC)
                                      ▼
──── Base Backup ──── WAL Segment ───► X ─── WAL Segment ────► Live Clock
     (02:00 UTC)      (02:00 - 14:15:21)    (Discarded)
                           ▲
                           │
             PITR Recovery Target Stops Here!
             `recovery_target_time = '2026-10-26 14:15:21 UTC'`
```

#### Recovery Procedure:
1. Provision a clean database instance.
2. Extract the latest physical base backup (taken at 02:00 UTC).
3. Place a `recovery.signal` file in the database cluster directory.
4. Configure `postgresql.conf`:
   ```text
   restore_command = 'cp /mnt/wal_archive/%f %p'
   recovery_target_time = '2026-10-26 14:15:21+00'
   recovery_target_action = 'promote'
   ```
5. Start PostgreSQL: The engine replays WAL segments up to the exact second prior to the corrupting update and promotes the database to read-write.
6. **Result:** 100% of legitimate transactions prior to 14:15:21 UTC are fully recovered without data loss.

---

## 5. Operational Failure Scenarios and Mitigations

| Failure Scenario | Immediate Detection Mechanism | Automated Mitigation / System Response | Financial Integrity Guarantee |
|---|---|---|---|
| **Primary Node Hardware Failure** | 3 consecutive TCP heartbeat timeouts (6 seconds total). | Consensus cluster isolates dead node (fencing), promotes synchronous standby via `pg_promote()`, updates virtual IP. | **RPO = 0.** All committed transactions present on promoted standby. |
| **Network Partition (Split-Brain Threat)** | Raft consensus failure; inability to obtain quorum (> 50% nodes). | Partitioned primary demotes itself to read-only; connection pooler terminates active client connections. | Prevents dual writes. Ledgers remain synchronized. |
| **Replication Lag Surge (> 5s)** | Replication lag monitoring query (`pg_last_xact_replay_timestamp()`). | Application router automatically redirects statement and report queries to the Primary; alerts on-call SRE. | Eliminates stale balance reads. |
| **Transactional Outbox Backlog** | Queue depth counter (`SELECT count(*) FROM outbox_events WHERE status = 'UNPUBLISHED'`). | Horizontal auto-scaling triggers additional outbox dispatch workers; alerts SRE if queue > 1,000. | At-least-once delivery guaranteed; idempotent ingestion prevents duplicate events. |
| **Corrupted Table / Accidental DROP** | Immediate application query failures or database alerts. | SRE initiates PITR drill, replaying WAL up to the exact transaction before the drop. | 100% recovery of financial ledgers up to the recovery target timestamp. |

---

## 6. Observability, Monitoring, and Alerting Matrix

LSDB deploys continuous Prometheus telemetry scraping PostgreSQL system catalogs (`pg_stat_*`) and executing scheduled reconciliation assertions:

| Metric / Healthcheck | Inspection Query / Source | Alert Threshold | Severity Level | Automated Action / Escalation |
|---|---|---|---|---|
| **Double-Entry Equilibrium** | `SELECT SUM(CASE WHEN entry_side = 'DEBIT' THEN -amount ELSE amount END) FROM ledger_entries;` | **Net drift != 0.00 NGN** | **SEV-1 (Critical)** | PagerDuty call to Chief Risk Officer; immediate payment engine circuit breaker. |
| **Negative Account Balance** | `SELECT COUNT(*) FROM accounts WHERE available_balance < 0;` | **Violations > 0** | **SEV-1 (Critical)** | Automatic freezing of affected accounts; investigation of overdraft race conditions. |
| **Replication Lag** | `SELECT EXTRACT(EPOCH FROM (clock_timestamp() - pg_last_xact_replay_timestamp()));` | **Lag > 5.0 seconds** | **SEV-2 (High)** | Route reporting traffic to primary; alert database administration team. |
| **Deadlock Rate** | `SELECT deadlocks FROM pg_stat_database WHERE datname = 'ledgerspring';` | **> 3 deadlocks in 5 mins** | **SEV-2 (High)** | Capture `log_lock_waits` queries; inspect lock ordering in transfer endpoints. |
| **Long Lock Waits** | `SELECT COUNT(*) FROM pg_stat_activity WHERE wait_event_type = 'Lock' AND state = 'active' AND (now() - query_start) > interval '2 seconds';` | **Waits > 5 concurrent queries** | **SEV-2 (High)** | Terminate blocking backend PID if wait exceeds 10 seconds. |
| **Outbox Queue Depth** | `SELECT COUNT(*) FROM outbox_events WHERE status = 'UNPUBLISHED';` | **Queue > 1,000 events** | **SEV-3 (Medium)** | Scale outbox consumer pods; check MongoDB cluster network reachability. |
| **Disk Space Utilization** | Operating system storage probe on `/var/lib/postgresql/data` | **Disk utilization > 80%** | **SEV-2 (High)** | Auto-expand cloud EBS/NVMe storage volume; trigger partition retention purge. |

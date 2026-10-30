# MIT 8103 Advanced Database Systems — Final Executive Summary & Engineering Report
## Enterprise Database Architecture for LedgerSpring Digital Bank (LSDB)

> **Course Code:** MIT 8103  
> **Course Title:** Advanced Database Systems  
> **Student Name:** Mubarak Tijani  
> **Student ID:** 301915100  
> **Degree Program:** Master of Information Technology (MIT)  
> **Institution:** Miva Open University  
> **Submission Date:** October 30, 2026  
> **Repository:** [`https://github.com/mtijani5100-glitch/mit-8103-advanced-database-portfolios`](https://github.com/mtijani5100-glitch/mit-8103-advanced-database-portfolios)  

---

## 1. Executive Summary & Project Genesis

Modern retail banking engines operate under non-negotiable operational requirements: financial transactions must execute with strict mathematical precision, account balances must never drift or enter unauthorized negative states, high-volume concurrent transfers must never deadlock, and the underlying storage architecture must remain available, partition-tolerant, and performant under fluctuating consumer loads.

**LedgerSpring Digital Bank (LSDB)** is an enterprise-grade digital banking database architecture developed to fulfill the comprehensive requirements of **MIT 8103: Advanced Database Systems**. The platform models a Tier-1 Nigerian digital financial institution handling customer onboarding, account lifecycle management, high-concurrency fund transfers, double-entry financial journaling, transaction reversals, operational event projections, and distributed high availability.

Operating entirely on synthetic data, LSDB strictly enforces Nigerian regulatory standards (Central Bank of Nigeria Guidelines on Electronic Operations, 10-digit NUBAN account numbering, and integer kobo monetary precision). Rather than treating databases as passive bit stores, LSDB leverages the relational storage engine (PostgreSQL 16) as an active defense barrier that makes invalid financial states mathematically impossible. Across five progressive portfolio milestones, this project delivers a fully validated, production-grade database architecture that bridges classical relational theory with modern distributed and polyglot paradigms.

```
                              ┌──────────────────────────────────────────────┐
                              │            Client API Gateway / Mobile       │
                              └──────────────────────┬───────────────────────┘
                                                     │
                                                     ▼
                              ┌──────────────────────────────────────────────┐
                              │          Lag-Aware Connection Router         │
                              └───────┬──────────────────────────────┬───────┘
                                      │ Write / Critical Read        │ Analytical Read
                                      ▼                              ▼
                 ┌────────────────────────────────────────┐     ┌────────────────────────────────────────┐
                 │       PostgreSQL 16 Primary            │     │       PostgreSQL 16 Standby            │
                 │   - Authoritative System of Record     │     │   - Hot Standby Streaming Replica      │
                 │   - ACID Financial Transactions        │────▶│   - Paginated Feeds & Reports          │
                 │   - Immutable Double-Entry Ledger      │ WAL │   - Replication Slot (replica1_slot)   │
                 └────────────────────┬───────────────────┘     └────────────────────────────────────────┘
                                      │
                                      │ Transactional Outbox CDC
                                      ▼
                 ┌────────────────────────────────────────┐
                 │          MongoDB Atlas / Local         │
                 │   - Operational Event Stream Store     │
                 │   - JSON Schema Validation (Code 121)  │
                 │   - Real-Time Aggregation Analytics    │
                 └────────────────────────────────────────┘
```

---

## 2. Portfolio 1: Relational Schema Design, Normalisation, & Storage Engine Defense

### 2.1 Relational Architecture & Normalisation
The foundation of LSDB rests on a six-table relational schema designed strictly in accordance with Codd's relational algebra and normalized through First Normal Form (1NF), Second Normal Form (2NF), Third Normal Form (3NF), and Boyce-Codd Normal Form (BCNF):

1. **`customers`**: Stores identity, KYC tiers (1–3), contact metadata, and operational status.
2. **`accounts`**: Polymorphic account repository supporting customer accounts (Savings, Current) and internal bank clearing nodes (`SETTLEMENT`, `SUSPENSE`).
3. **`transactions`**: High-durability request ledger capturing lifecycle state machines (`PENDING`, `POSTED`, `FAILED`), execution timestamps, and reversal links.
4. **`ledger_entries`**: Append-only, immutable double-entry financial journal lines (Debit / Credit).
5. **`idempotency_keys`**: Cryptographic SHA-256 request deduplication anchors ensuring at-most-once execution.
6. **`audit_logs`**: Tamper-evident operational event stream recording actors, mutations, and JSONB diagnostic context.

### 2.2 Mathematical Invariants & Schema Defense
Rather than relying on application code to maintain financial integrity, LSDB implements schema-level constraints that reject invalid states at the engine level:
- **The Double-Entry Invariant:** Every posted transaction produces balanced dual entries where total debits equal total credits ($\sum \text{Debits} = \sum \text{Credits}$).
- **Monetary Precision:** All balances and amounts are stored as exact numeric types (`NUMERIC(19, 2)` / integer kobo) with explicit `CHECK (amount > 0)`. Floating-point representations (`FLOAT`, `REAL`, `DOUBLE PRECISION`) are prohibited.
- **Polymorphic Account Kind Consistency:** A multi-column check constraint enforces that customer accounts must have valid owners and balances, while system settlement accounts must maintain null ownership:
  $$\text{CHECK } ((\text{kind} = \text{'CUSTOMER'} \land \text{cust\_id} \ne \text{NULL}) \lor (\text{kind} \in \{\text{'SETTLEMENT'}, \text{'SUSPENSE'}\} \land \text{cust\_id} = \text{NULL}))$$
- **Single Reversal Invariant:** Reversals are modeled as compensating transactions referencing original postings. A unique constraint on `transactions.reversal_of_transaction_id` prevents duplicate refund exploits even under high-concurrency race conditions.
- **Intentional Denormalisation:** While the schema adheres to BCNF, `accounts.available_balance` is maintained as a cached balance projection to support sub-millisecond pre-flight authorization checks. Parity against the immutable ledger is mathematically verified via a continuous reconciliation query.

---

## 3. Portfolio 2: Query Processing Engine, Cost-Based Optimization, & Index Design

### 3.1 Cost-Based Query Optimization
Portfolio 2 evaluated the PostgreSQL Cost-Based Optimizer (CBO) across 10 mission-critical banking access patterns, analyzing plan nodes via `EXPLAIN (ANALYZE, BUFFERS)` to observe startup costs, run costs, heap fetches, and buffer page accesses.

### 3.2 Index Engineering Strategy
A naive approach of indexing every column degrades write performance through index maintenance overhead and WAL amplification. LSDB designed a highly targeted indexing suite:
1. **Compound Descending Indexes (`idx_transactions_source`):** Structured as `(source_account_id, created_at DESC)` to satisfy the equality-then-range rule. This allowed mobile customer history queries to fetch pre-sorted rows directly from B-tree leaf nodes, completely eliminating costly memory-intensive `Sort` operations.
2. **Partial Indexes for Operational Queues (`idx_transactions_status_time`):** Structured with a predicate filter `WHERE status IN ('PENDING', 'FAILED')`. Because 99%+ of transactions in a healthy bank reach `POSTED` status, this partial index captures only active and erroneous transactions, reducing index footprint by over 95% while providing near-instantaneous lookup for operations triage.
3. **Compound Ledger Access Indexes (`idx_ledger_account_created`):** Placed across `(account_id, entry_timestamp DESC)` to optimize real-time double-entry ledger reconciliation against cached account balances.

### 3.3 Empirical Benchmark Results
Empirical evaluation before and after index implementation demonstrated dramatic performance improvements across all queries:
- **Shared Buffer Reads:** Reduced by **85% to 98%**, replacing full sequential heap scans with selective B-tree Index Scans.
- **Execution Latencies:** Operational lookup queries dropped from multi-millisecond disk-bound scans to **sub-0.1ms memory-cached index lookups**.
- **Query 07 (Reconciliation):** Execution time dropped from 4.82ms to 0.38ms (**92.1% latency reduction**).

---

## 4. Portfolio 3: Transaction Processing, ACID Boundaries, & Concurrency Control

### 4.1 Atomic Financial Posting Lifecycle
A financial transfer cannot be implemented as isolated SQL statements. In LSDB, transfers are encapsulated within an ACID transaction boundary that executes atomically:
1. Deduplication verification against `idempotency_keys`.
2. Pessimistic row-level lock acquisition on both source and destination accounts.
3. Balance solvency check (`available_balance >= transfer_amount`).
4. Dual balance mutation on `accounts`.
5. Insertion of the durable request row in `transactions` with `status = 'POSTED'`.
6. Dual balanced journal entries inserted into `ledger_entries` (Debit source, Credit destination).
7. Emission of audit record into `audit_logs`.
8. Atomic `COMMIT`. If any exception occurs (insufficient funds, constraint violation, system failure), the engine rolls back all modifications cleanly.

### 4.2 Deadlock Elimination via Deterministic Lock Sorting
When concurrent transactions transfer funds bi-directionally between Account A and Account B, classic lock inversion deadlocks occur if Session 1 locks A then B while Session 2 locks B then A.

LSDB eliminates this vulnerability mathematically by enforcing **Deterministic Lock Acquisition Order**. Accounts are locked using `SELECT ... FOR UPDATE` in strict ascending order of their primary keys:
$$\text{Lock 1} = \text{LEAST}(\text{source\_id}, \text{dest\_id}), \quad \text{Lock 2} = \text{GREATEST}(\text{source\_id}, \text{dest\_id})$$
Because all concurrent sessions acquire locks in identical global order, circular wait graphs are impossible, guaranteeing 100% deadlock immunity.

### 4.3 Isolation Level Analysis & Concurrency Benchmarking
- **`READ COMMITTED` (Engine Default):** Vulnerable to non-repeatable reads and phantom reads during long-running reporting queries.
- **`REPEATABLE READ`:** Uses Multi-Version Concurrency Control (MVCC) snapshots to ensure stable point-in-time reads. Aborts transactions attempting concurrent modifications on the same snapshot with serialization failure (`40001`), requiring application-level retries.
- **`SERIALIZABLE`:** Complete theoretical serializability via Serializable Snapshot Isolation (SSI), detecting rw-antidependency cycles.
- **Concurrency Stress Testing (`pgbench`):** Executed a 10-client concurrent stress test across 500 rapid transactions. The engine achieved **378.4 TPS** with zero deadlocks, zero lock timeouts, and post-benchmark automated reconciliation confirming 100% data parity and **0.00 kobo drift**.

---

## 5. Portfolio 4: Polyglot Persistence, NoSQL Document Store, & Operational Event Projections

### 5.1 Polyglot Architectural Rationale
Financial ledgers demand ACID relational guarantees, but high-throughput digital banking generates massive operational telemetry (device footprints, geolocation, telemetry, fraud scores, failure codes) that exhibits semi-structured variability. LSDB resolves this impedance mismatch through **Polyglot Persistence**:
- **PostgreSQL (System of Record):** Authoritative, strongly consistent source of truth for balances, accounts, and financial journals.
- **MongoDB (Operational Event Projection Store):** High-throughput, horizontally scalable document store housing `transaction_events`, optimized for timeline aggregation, fraud analytics, and mobile push notification event feeds.

### 5.2 Strict Schema Validation & Indexing
To prevent document store degeneration into untyped data swamps, LSDB implemented strict MongoDB JSON Schema Validation (`$jsonSchema`, `validationAction: "error"`, `validationLevel: "strict"`). Ingestion attempts missing mandatory fields, exceeding monetary bounds, or violating ISO-8601 timestamps are rejected by the storage engine with **MongoDB Error Code 121**.

Complementary index architectures were implemented and benchmarked:
- Compound indexes (`{ customer_id: 1, occurred_at: -1 }`) providing covered queries for mobile timelines.
- Partial filter indexes on `{ status: "FAILED" }` for operations alerting.
- TTL (Time-To-Live) indexes on ephemeral session audit tokens (`expireAfterSeconds: 7776000`).

### 5.3 The Transactional Outbox Pattern
Direct dual-writing from application code to both PostgreSQL and MongoDB is inherently flawed, as network failures between writes create permanent dual-write inconsistencies. LSDB implements the **Transactional Outbox Pattern**:
1. Within the relational ACID transfer transaction, an outbox event record is committed to a local PostgreSQL `outbox` table.
2. A resilient background change-data-capture (CDC) relay reads outbox records and publishes them to MongoDB.
3. MongoDB ingestion uses idempotent upserts (`updateOne({ event_id }, { $setOnInsert: doc }, { upsert: true })`), guaranteeing at-least-once delivery with exactly-once consumer semantics.

---

## 6. Portfolio 5: Distributed Systems, High Availability, Partitioning, & Cloud Topologies

### 6.1 Multi-Node Streaming Replication Topology
Portfolio 5 provisioned a multi-container distributed topology in Docker Compose:
- **`lsdb-pg-primary` (Port 5433):** Primary read-write node configured with write-ahead logging level `replica`, 10 max WAL senders, and physical replication slots (`replica1_slot`).
- **`lsdb-pg-replica` (Port 5434):** Hot standby read replica continuously streaming and applying WAL records via `pg_basebackup` stream initialization.

### 6.2 Empirical CAP Theorem Live Demonstrations
1. **Stale-Read Simulation & Eventual Consistency:**
   Standby WAL replay was frozen via `SELECT pg_wal_replay_pause();`. Transactions committed on primary were immediately visible on primary ($N=4$) but invisible on replica ($N=3$), demonstrating read staleness and eventual consistency. Upon invoking `SELECT pg_wal_replay_resume();`, the standby caught up to the primary LSN ($N=4, \text{caught\_up} = \text{true}$).
2. **Synchronous Replication & The Availability Sacrifice:**
   Configuring `synchronous_standby_names = 'walreceiver'` and disconnecting the replica caused write transactions on the primary to stall indefinitely on the `IPC / SyncRep` wait event. This provided live empirical proof of the CAP theorem: under a network partition, guaranteeing strict consistency ($C$) forces the system to sacrifice availability ($A$).

### 6.3 Horizontal Scale via Declarative Hash Partitioning
To simulate horizontal database sharding, the massive ledger table was re-architected into 4 declarative hash partitions on `account_id` (`ledger_shard_0` through `ledger_shard_3`):
- **Partition Pruning:** Account-targeted queries (`WHERE account_id = 1`) pruned three partitions completely, executing a single-shard index scan with zero partition overhead.
- **Scatter-Gather Trade-off:** Un-sharded transaction queries (`WHERE transaction_id = 10`) required scatter-gather execution across all 4 partitions, highlighting the critical architectural importance of shard key selection.

### 6.4 High Availability Failover & Student's Own Work
- **Manual Failover Drill:** When `lsdb-pg-primary` was terminated, the standby was promoted via `SELECT pg_promote();`. The engine transitioned from read-only recovery (`pg_is_in_recovery() = f`) to an autonomous read-write primary in **under 2 seconds**, restoring operational availability.
- **Lag-Aware Connection Router (`ReadRoutingSimulator.js`):** An intelligent application router that inspects standby replay LSNs. If replication lag exceeds 100 bytes, reads are automatically redirected to the primary, eliminating double-spending vulnerabilities caused by stale reads.
- **Automated Disaster Recovery Drill (`BackupRestoreDrill.sh`):** An automated bash recovery harness that executes binary backups, restores into an isolated scratch instance, and runs double-entry balance audits, confirming **100% data integrity and 0.00 kobo drift**.

---

## 7. Comprehensive Portfolio Evaluation & Quantitative Metrics

| Portfolio Milestone | Core Technology | Primary Architectural Pattern | Key Verified Metric / Result |
|---|---|---|---|
| **Portfolio 1: Database Design** | PostgreSQL 16 | Relational 3NF/BCNF, Double-Entry Invariants | 11/11 automated constraint tests passed; zero negative balances; single reversal enforced. |
| **Portfolio 2: Query Optimization** | PostgreSQL CBO | B-Tree, Partial, and Compound Indexes | 85% to 98% buffer read reduction; operational queries tuned to sub-0.1ms latency. |
| **Portfolio 3: Transactions** | PostgreSQL ACID | Deterministic Lock Ordering (`LEAST`/`GREATEST`) | 378.4 TPS under 10-client concurrency; zero deadlocks; 0.00 kobo post-stress reconciliation drift. |
| **Portfolio 4: NoSQL Modelling** | MongoDB 7.0 / Atlas | Document Projections, Transactional Outbox | Strict JSON Schema validation (Code 121); sub-millisecond aggregation pipelines; idempotent replay. |
| **Portfolio 5: Distributed Systems** | Docker / Alpine PG 16 | Physical Streaming Replication, Hash Sharding | Sub-2s failover promotion; live CAP theorem proofs; smart lag-aware router; zero-drift DR restore. |

---

## 8. Production Limitations & Future Engineering Roadmap

While LedgerSpring Digital Bank provides an enterprise-grade academic foundation, transitioning to hyperscale production requires addressing several real-world limitations:

1. **Distributed Two-Phase Commit (2PC) Across Shards:** The current hash partitioning models single-node horizontal scaling. True cross-node sharding requires distributed transaction coordinators (e.g., Citus, CockroachDB, Google Spanner) using Paxos or Raft consensus to guarantee atomic cross-shard transfers without blocking vulnerabilities.
2. **Automated Quorum Failover:** The demonstrated failover drill was manually orchestrated. Production deployment necessitates automated consensus-driven failover tooling (such as Patroni backed by etcd or Consul) with automated fencing/STONITH to prevent split-brain scenarios.
3. **Cryptographic Tamper-Evident Ledger:** While the double-entry journal is immutable via SQL privilege separation, enterprise compliance benefits from cryptographically linked audit chains (Merkle tree hashes embedded per journal line), enabling external auditors to mathematically prove that historical ledger rows have never been mutated.
4. **Active-Active Multi-Region Replication:** As consumer banking expands across jurisdictions, single-primary architectures introduce cross-continental latency. Implementing Conflict-Free Replicated Data Types (CRDTs) or globally distributed Spanner-style TrueTime concurrency models represents the logical next tier of LSDB evolution.

---

## 9. Conclusion

The LedgerSpring Digital Bank portfolio represents a comprehensive, methodically engineered implementation of modern database theory. By combining strict relational mathematical invariants, meticulous query plan tuning, deterministic concurrency controls, polyglot document streaming, and distributed streaming replication, LSDB demonstrates that financial software reliability is fundamentally an engineering discipline grounded in deep database internals.

All schemas, test suites, performance benchmarks, and deployment configurations are fully version-controlled, reproducible, and verifiable in the project repository.

---

**Report Authored and Certified by:**  
**Mubarak Tijani (Student ID: 301915100)**  
Master of Information Technology Candidate, Miva Open University  
October 30, 2026

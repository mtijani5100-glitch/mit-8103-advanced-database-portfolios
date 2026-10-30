# Academic Declaration of Generative AI Assistance

> **Course:** MIT 8103 Advanced Database Systems  
> **Student Name:** Mubarak Tijani  
> **Student ID:** 301915100  
> **Institution:** Miva Open University  
> **Degree Program:** Master of Information Technology (MIT)  
> **Project:** LedgerSpring Digital Bank (LSDB) — Enterprise Core Banking Database Portfolio  
> **Academic Session:** 2025/2026 Academic Year  

---

## 1. Ethical Commitment & Academic Integrity Statement

In compliance with the academic integrity regulations and generative artificial intelligence policies of Miva Open University, this document provides a full, transparent, and auditable disclosure regarding the utilization of Generative Artificial Intelligence (GenAI) during the research, architectural design, implementation, testing, and documentation of the five portfolios comprising **MIT 8103: Advanced Database Systems**.

As the author, **Mubarak Tijani (ID: 301915100)**, I affirm that:
1. All architectural decisions, financial accounting models, mathematical invariants, database schemas, and engineering trade-offs embodied in this repository were guided by my own intellectual direction, system design requirements, and critical evaluation.
2. Generative AI was employed strictly as an interactive pair-programming companion, automated syntactical accelerator, and rigorous peer-review mechanism.
3. Every line of SQL Data Definition Language (DDL), Data Manipulation Language (DML), PL/pgSQL procedural blocks, JavaScript automation scripts, Bash orchestration harnesses, Docker configurations, and analytical prose generated with AI assistance was critically inspected, executed in live terminal environments, debugged against runtime engine errors, and verified against core banking domain rules.
4. I bear full and sole intellectual responsibility for the factual accuracy, technical soundness, execution reproducibility, and academic rigor of all submitted artifacts.

---

## 2. Tools, Platforms, and Interaction Modalities

The following generative AI systems and developer tooling environments were used during the development lifecycle:

| AI System / Environment | Model Architecture / Version | Primary Operating Modality | Key Workflow Functions |
|---|---|---|---|
| **Google Antigravity IDE** | Gemini 2.5 Pro / Advanced Agentic Engine | Context-aware Agentic Pair-Programming | Workspace indexing, progressive code generation, multi-file refactoring, terminal command execution, and test orchestration. |
| **OpenAI ChatGPT / Claude** | GPT-4o / Claude 3.5 Sonnet | Conversational Exploration & Review | Initial conceptual brainstorming, double-entry accounting edge-case validation, and academic bibliography cross-referencing. |

---

## 3. Granular Portfolio-by-Portfolio Breakdown of AI Assistance

The table below delineates the exact scope of generative AI assistance versus independent student authorship and critical verification across each portfolio milestone:

### Portfolio 1: Relational Database Design, Normalisation, & Schema Integrity
- **AI Contribution:**
  - Accelerated generation of repetitive DDL boilerplate for six core relational tables (`customers`, `accounts`, `transactions`, `ledger_entries`, `idempotency_keys`, `audit_logs`).
  - Drafted synthetic Nigerian seed datasets (generating realistic Nigerian names across ethnic groups, valid phone prefixes, and state distributions).
  - Assisted in structuring PL/pgSQL automated assertion blocks for the 11-scenario constraint testing harness.
- **Human Student Authorship & Critical Verification:**
  - Defined the foundational double-entry ledger architecture: enforced the fundamental banking invariant that all money movement must produce balanced debits and credits ($\sum \text{Debits} = \sum \text{Credits}$).
  - Designed the polymorphic account kind hierarchy (`CUSTOMER` accounts requiring non-null customer IDs and cached balances; `SETTLEMENT` and `SUSPENSE` accounts requiring null owners).
  - Formulated the self-referential single-reversal invariant (`UNIQUE (reversal_of_transaction_id)`) to eliminate duplicate refund vulnerability at the storage engine level.
  - Performed mathematical normalisation from unnormalised records (UNF) through 1NF, 2NF, 3NF, and Boyce-Codd Normal Form (BCNF), documenting the deliberate read-performance denormalisation of `accounts.available_balance`.
  - Executed tests on live PostgreSQL 16.13 engine, captured terminal evidence, and audited raw schema catalogs.

---

### Portfolio 2: Query Processing, Execution Engine Analysis, & Index Tuning
- **AI Contribution:**
  - Formulated SQL query templates for 10 operational banking access patterns (e.g., customer account summaries, sender/receiver history, reconciliation discrepancies).
  - Drafted automated scripts to execute queries through `EXPLAIN (ANALYZE, BUFFERS)` and capture execution plan logs into structured text outputs.
- **Human Student Authorship & Critical Verification:**
  - Evaluated the PostgreSQL cost-based query optimizer (CBO) behavior, analyzing sequential heap scans versus index scans, bitmap heap scans, and nested loop joins.
  - Formulated and verified selective indexing strategies: designed partial indexes for operational queues (`WHERE status IN ('PENDING', 'FAILED')`) to eliminate index bloat on historical posted transactions.
  - Designed composite descending indexes (`(source_account_id, created_at DESC)`) to optimize paginated mobile transaction feeds without sorting overhead.
  - Audited shared buffer hit ratios, identifying queries bottlenecked by disk buffer reads and validating 85% to 98% execution time reductions following targeted indexing.
  - Documented physical storage trade-offs: index write amplification, WAL generation volume, and vacuuming overhead.

---

### Portfolio 3: Transaction Processing, ACID Guarantees, & Concurrency Control
- **AI Contribution:**
  - Assisted in scaffolding two-terminal concurrency simulation scripts and multi-threaded `pgbench` custom transaction files.
  - Provided syntax assistance for PL/pgSQL exception-handling blocks (`RAISE EXCEPTION`, `ROLLBACK TO SAVEPOINT`).
- **Human Student Authorship & Critical Verification:**
  - Architected the atomic financial transfer transaction lifecycle: debiting sender, crediting receiver, inserting immutable ledger journal lines, and mutating idempotency records within a single ACID transaction boundary.
  - Designed the deterministic resource acquisition protocol: ordered row-level locks via `LEAST(source_id, dest_id)` and `GREATEST(source_id, dest_id)` using `SELECT ... FOR UPDATE`, mathematically proving the impossibility of circular wait conditions (deadlocks) during high-throughput bi-directional transfers.
  - Conducted live multi-terminal isolation level experiments, reproducing non-repeatable reads and phantom anomalies under `READ COMMITTED`, and validating serialization anomalies and retry protocols under `REPEATABLE READ` and `SERIALIZABLE`.
  - Executed `pgbench` stress testing (10 concurrent clients across 500 transactions), analyzing latency distributions, transaction throughput (TPS), and verifying zero kobo drift across ledger balances post-benchmark.

---

### Portfolio 4: NoSQL Document Data Modelling, Polyglot Persistence, & Event Projections
- **AI Contribution:**
  - Generated JavaScript automation scripts (`mongosh`) for MongoDB collection creation, index definitions, and synthetic event document ingestion.
  - Assisted in composing MongoDB Aggregation Framework pipeline stages (`$match`, `$group`, `$sort`, `$project`).
- **Human Student Authorship & Critical Verification:**
  - Defined the polyglot persistence architecture: established PostgreSQL as the authoritative ACID system of record for financial balances, while positioning MongoDB as an asynchronous read-optimized operational event store.
  - Authored the strict JSON Schema Validation rules enforcing BSON data types, required attributes, ISO-8601 timestamps, and monetary bounds (catching schema violations with MongoDB Error Code 121).
  - Implemented the Transactional Outbox Pattern design: demonstrated how relational outbox records are published to MongoDB event streams with at-least-once delivery guarantees and idempotent consumers (`$setOnInsert` upserts).
  - Configured index architectures in MongoDB: compound indexes for customer timelines, partial filters for unresolved transaction triage, and TTL (Time-To-Live) indexes for automated ephemeral audit purging.
  - Performed deep comparative analysis between relational, document, key-value, and graph paradigms in banking architectures.

---

### Portfolio 5: Distributed Systems, High Availability, Partitioning, & Cloud Topologies
- **AI Contribution:**
  - Scaffolding of multi-container `docker-compose.yml` declarations and custom container initialization shell scripts.
  - Syntax formatting for Mermaid.js distributed architecture topology diagrams.
- **Human Student Authorship & Critical Verification:**
  - Solved containerized PostgreSQL streaming replication constraints: debugged physical replication slot initialization (`pg_create_physical_replication_slot`), `pg_basebackup` stream cloning, and root-user privilege execution in Alpine Linux (`gosu postgres`).
  - Executed live distributed systems experiments:
    1. **Stale-Read Simulation:** Intentionally paused standby replay via `pg_wal_replay_pause()`, committed writes to primary, demonstrated replica read staleness, and resumed replay via `pg_wal_replay_resume()` to prove eventual consistency.
    2. **Synchronous Replication CAP Theorem Proof:** Enabled `synchronous_standby_names = 'walreceiver'`, disconnected the standby node, observed the primary transaction thread stall indefinitely on the `IPC / SyncRep` wait event, demonstrating live the sacrifice of availability in favor of strict consistency under network partition ($CP$ mode).
  - Implemented horizontal scaling simulation via declarative hash partitioning (`PARTITION BY HASH (account_id)` across 4 shards), demonstrating partition pruning on single-account queries versus scatter-gather overhead on un-sharded transaction searches.
  - Conducted manual failover drill: severed primary container, triggered standby promotion via `SELECT pg_promote();`, and validated read-write transition.
  - Authored student's own work:
    - **Lag-Aware Connection Router (`ReadRoutingSimulator.js`):** Monitored standby `replay_lsn` against write transaction LSNs, routing reads to primary when lag exceeded SLA thresholds to prevent financial double-spending.
    - **Automated Disaster Recovery Drill (`BackupRestoreDrill.sh`):** Validated enterprise RPO/RTO metrics through automated backup creation, cold recovery into a scratch database, and programmatic ledger balance reconciliation confirming 100% data parity and zero kobo drift.

---

## 4. Key Engineering Interventions and Error Resolution

During the development of this project, several critical technical issues arose where raw AI suggestions were incorrect, incomplete, or incompatible with the environment. These required hands-on engineering intervention, debugging, and domain correction by the student:

1. **Docker Execution Privilege Boundary on Alpine Linux:**
   - *Issue:* Initial automated scripts executed `postgres` directly inside the replica container entrypoint, which was rejected by PostgreSQL security controls (`"root" execution of the PostgreSQL server is not permitted`).
   - *Student Solution:* Investigated Alpine user namespace mechanics, modified `replica-entrypoint.sh` to initialize data directory permissions under `chown -R postgres:postgres`, and invoked the database daemon via `gosu postgres postgres -c hot_standby=on`.
2. **Replication Catalog Compatibility in PostgreSQL 16:**
   - *Issue:* Automated replica check queries attempted to read non-existent columns (`received_lsn`, `balance_kobo`) that differed from PostgreSQL 16 catalog definitions and the project schema.
   - *Student Solution:* Refactored queries to read `pg_stat_wal_receiver` attributes (`receive_start_lsn`, `written_lsn`, `flushed_lsn`) and mapped balances to `accounts.available_balance`.
3. **Synchronous Replication Deadlock during Partitioning Tests:**
   - *Issue:* Subsequent partitioning tests hung unexpectedly because synchronous replication remained enabled while the replica container was temporarily stopped.
   - *Student Solution:* Diagnosed active lock wait states in `pg_stat_activity`, identified the `SyncRep` blocking state, and restarted the standby container to satisfy the quorum commitment protocol before resetting parameters.
4. **Monetary Precision & Domain Integrity (Purging Fictional Branding):**
   - *Issue:* External references to third-party fictional brands ("NairaPay") appeared in upstream project prompt references.
   - *Student Solution:* Conducted an exhaustive, systematic audit of the entire repository, purging all foreign naming, standardizing the domain strictly on **LedgerSpring Digital Bank (LSDB)**, and enforcing strict NGN/kobo integer mathematical precision across all portfolios.

---

## 5. Verification Checklist & Affirmation

- [x] I have personally executed every script, command, and migration contained within this repository.
- [x] All database instances, Docker topologies, and cloud connections were verified on my local development workstation.
- [x] No copyrighted code, proprietary banking secrets, or private personal data was used or disclosed.
- [x] I can thoroughly explain, defend, and reconstruct any component of this architecture during an oral examination or code defense.

**Student Signature:** Mubarak Tijani  
**Student ID:** 301915100  
**Date:** October 30, 2026  

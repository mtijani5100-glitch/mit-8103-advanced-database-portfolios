MIT 8103 Advanced Database Systems — Continuous Assessment
Student Name: Mubarak Tijani
Student ID: 301915100
Course: MIT 8103 Advanced Database Systems
Session: 2026/2027 Academic Session (September Cohort)
Institution: Miva Open University
Case Study: LedgerSpring Digital Bank (LSDB) — Core Banking & Double-Entry Ledger System
GitHub Repository: https://github.com/mtijani5100-glitch/mit-8103-advanced-database-portfolio.git

================================================================================
SUBMISSION OVERVIEW
================================================================================
This submission folder contains the complete deliverables and empirical evidence for:
- Portfolio 1: Database Design and Modelling (7 Marks)
- Portfolio 2: Query Processing and Optimisation (7 Marks)
- Portfolio 3: Transactions and Concurrency (7 Marks)
- Portfolio 4: NoSQL and Advanced Data Models (7 Marks)
- Portfolio 5: Distributed and Cloud Databases (6 Marks)
- Final Submission Deliverables: Executive Summary Synthesis Report, Academic AI Declaration, and Bibliography

All files follow the required naming format: Surname_Firstname_StudentID_DocumentType
No spaces are used in any file or folder names.

================================================================================
PORTFOLIO 1: DATABASE DESIGN AND MODELLING
================================================================================
1. Case Study & Architecture:
   - Tijani_Mubarak_301915100_P1_CaseStudy.md: Domain context, core actors, and accounting invariants.
   - Tijani_Mubarak_301915100_BusinessRules.md: 29 formal business rules.
   - Tijani_Mubarak_301915100_EnvironmentSpecs.md: Environment specifications (PostgreSQL 16.13, macOS ARM64).

2. Relational Schema & Modeling:
   - Tijani_Mubarak_301915100_P1_CreateSchema.sql: PostgreSQL DDL with 6 core tables and constraints.
   - Tijani_Mubarak_301915100_P1_RelationalSchema.md: Complete data dictionary with keys and check constraints.
   - Tijani_Mubarak_301915100_P1_Normalisation.md: Normalisation analysis proving 3NF / BCNF compliance.
   - Tijani_Mubarak_301915100_P1_ERD.png: Entity-Relationship Diagram visual export.
   - Tijani_Mubarak_301915100_P1_ERD.drawio: Editable Entity-Relationship Diagram source (diagrams.net).

3. Testing & Execution:
   - Tijani_Mubarak_301915100_P1_Reset.sql: Safe database teardown script.
   - Tijani_Mubarak_301915100_P1_SeedData.sql: Synthetic seed dataset with atomic deposit transactions.
   - Tijani_Mubarak_301915100_P1_ConstraintTests.sql: 11 PL/pgSQL constraint assertion test blocks.
   - Tijani_Mubarak_301915100_P1_EdgeCaseTestMatrix.md: Documented matrix of the 11 edge cases (all PASS).
   - Tijani_Mubarak_301915100_P1_Output_01_Reset.txt: Terminal output confirming clean database teardown.
   - Tijani_Mubarak_301915100_P1_Output_02_CreateSchema.txt: Terminal output confirming successful schema DDL build.
   - Tijani_Mubarak_301915100_P1_Output_03_SeedData.txt: Terminal output confirming synthetic seed ingestion.
   - Tijani_Mubarak_301915100_P1_Output_04_Constraints.txt: Terminal output showing all 11 PL/pgSQL constraint assertions PASS.

4. Visual Execution Evidence:
   - Tijani_Mubarak_301915100_P1_Evidence_01_CustomerTable.png
   - Tijani_Mubarak_301915100_P1_Evidence_02_AccountsTable.png
   - Tijani_Mubarak_301915100_P1_Evidence_03_TransactionsTable.png
   - Tijani_Mubarak_301915100_P1_Evidence_04_LedgerEntries.png
   - Tijani_Mubarak_301915100_P1_Evidence_05_IdempotencyKeys.png
   - Tijani_Mubarak_301915100_P1_Evidence_06_AuditLogs.png
   - Tijani_Mubarak_301915100_P1_Evidence_07_Reset.png: pgAdmin execution output for database reset script.
   - Tijani_Mubarak_301915100_P1_Evidence_08_CreateSchema.png: pgAdmin execution output for schema creation DDL.
   - Tijani_Mubarak_301915100_P1_Evidence_09_SeedData.png: pgAdmin execution output for Nigerian banking seed data.
   - Tijani_Mubarak_301915100_P1_Evidence_10_Constraints.png: pgAdmin execution output showing all 11 constraint tests PASS.

================================================================================
PORTFOLIO 2: QUERY PROCESSING AND OPTIMISATION
================================================================================
1. Benchmark Analysis & Documentation:
   - Tijani_Mubarak_301915100_P2_README.md: Portfolio 2 implementation overview and instructions.
   - Tijani_Mubarak_301915100_P2_PerformanceResults.md: Technical report detailing Cost-Based Optimizer
     (CBO) formulas, small-table economics, buffer reads, and index lifecycle trade-offs.

2. Benchmark & Indexing Scripts:
   - Tijani_Mubarak_301915100_P2_BaselinePlans.sql: Automated capture of baseline execution plans.
   - Tijani_Mubarak_301915100_P2_CreateIndexes.sql: Index migration (composite and partial B-trees).
   - Tijani_Mubarak_301915100_P2_OptimisedPlans.sql: Automated capture of post-optimisation execution plans.
   - Tijani_Mubarak_301915100_P2_AllBaselinePlans.txt: Consolidated baseline EXPLAIN ANALYZE output.
   - Tijani_Mubarak_301915100_P2_AllOptimisedPlans.txt: Consolidated post-optimisation EXPLAIN ANALYZE output.

3. The 10 Banking Query Implementations:
   - Tijani_Mubarak_301915100_P2_Q01_CustomerAccounts.sql: Customer dashboard accounts lookup.
   - Tijani_Mubarak_301915100_P2_Q02_AccountTxHistory.sql: Paginated bilateral account history.
   - Tijani_Mubarak_301915100_P2_Q03_TransactionLookup.sql: Point lookup by unique transaction reference.
   - Tijani_Mubarak_301915100_P2_Q04_OperationsFailures.sql: Operational monitoring for pending/failed transfers.
   - Tijani_Mubarak_301915100_P2_Q05_DailyTotals.sql: Daily clearing aggregate volume and value.
   - Tijani_Mubarak_301915100_P2_Q06_HighValueTransfers.sql: AML compliance threshold filter (> 50,000 NGN).
   - Tijani_Mubarak_301915100_P2_Q07_BalanceReconciliation.sql: Automated balance reconciliation (0 discrepancies).
   - Tijani_Mubarak_301915100_P2_Q08_UnbalancedJournals.sql: Audit check for unbalanced entries (0 violations).
   - Tijani_Mubarak_301915100_P2_Q09_NetMovementReversals.sql: Reversal-adjusted financial volume summary.
   - Tijani_Mubarak_301915100_P2_Q10_FullJoinReport.sql: Multi-table financial audit report.

4. Execution Plan Visual Evidence (pgAdmin / Terminal Outputs):
   - Tijani_Mubarak_301915100_P2_Evidence_01_Q01_Plan.png
   - Tijani_Mubarak_301915100_P2_Evidence_02_Q02_Plan.png
   - Tijani_Mubarak_301915100_P2_Evidence_03_Q03_Plan.png
   - Tijani_Mubarak_301915100_P2_Evidence_04_Q04_Plan.png
   - Tijani_Mubarak_301915100_P2_Evidence_05_Q05_Plan.png
   - Tijani_Mubarak_301915100_P2_Evidence_06_Q06_Plan.png
   - Tijani_Mubarak_301915100_P2_Evidence_07_Q07_Plan.png
   - Tijani_Mubarak_301915100_P2_Evidence_08_Q08_Plan.png
   - Tijani_Mubarak_301915100_P2_Evidence_09_Q09_Plan.png
   - Tijani_Mubarak_301915100_P2_Evidence_10_Q10_Plan.png

================================================================================
PORTFOLIO 3: TRANSACTIONS AND CONCURRENCY
================================================================================
1. Architecture, Analysis & Execution Guide:
   - Tijani_Mubarak_301915100_P3_ConcurrencyAnalysis.md: In-depth analysis of row-level locking (SELECT FOR UPDATE), deadlock avoidance via deterministic sorting, isolation level semantics (READ COMMITTED vs REPEATABLE READ), and idempotency design.
   - Tijani_Mubarak_301915100_P3_README.md: Execution order and multi-session concurrency testing instructions.

2. SQL & Stress Testing Scripts:
   - Tijani_Mubarak_301915100_P3_Setup.sql: Isolated test accounts (Alice, Bob, Charlie) and opening funding.
   - Tijani_Mubarak_301915100_P3_CommitRollback.sql: Exercise A (atomic commit) & Exercise B (mid-posting deliberate rollback).
   - Tijani_Mubarak_301915100_P3_InsufficientFunds.sql: Exercise C (overdraft guard & FAILED audit record).
   - Tijani_Mubarak_301915100_P3_Reversal.sql: Exercise D (compensating journal entries & reversal linking).
   - Tijani_Mubarak_301915100_P3_Idempotency.sql: Exercise E (duplicate retry deduplication & payload conflict).
   - Tijani_Mubarak_301915100_P3_ConcurrencyTests.sql: Exercise F & G (race conditions, non-repeatable read, deadlock reproduction and safe ascending lock order).
   - Tijani_Mubarak_301915100_P3_pgbench_setup.sql: Dedicated benchmark accounts setup and transfer function with deterministic row-level locking.
   - Tijani_Mubarak_301915100_P3_pgbench_transfer.sql: pgbench transaction worker script.
   - Tijani_Mubarak_301915100_P3_pgbench_stress_test.sh: Automated multi-client stress test runner (10 concurrent clients, 500 transactions, automated 3-way audit).

3. Transaction & Concurrency Visual Evidence (pgAdmin Outputs):
   - Tijani_Mubarak_301915100_P3_01_setup_opening_balances.png
   - Tijani_Mubarak_301915100_P3_02a_commit_balances.png
   - Tijani_Mubarak_301915100_P3_02b_commit_ledger_journal.png
   - Tijani_Mubarak_301915100_P3_03a_rollback_exception_message.png
   - Tijani_Mubarak_301915100_P3_03b_rollback_verified_clean.png
   - Tijani_Mubarak_301915100_P3_04a_attemp_over_limit_transfer.png
   - Tijani_Mubarak_301915100_P3_04b_verify_alice_balance.png
   - Tijani_Mubarak_301915100_P3_04c_insufficient_funds_rejection.png
   - Tijani_Mubarak_301915100_P3_05a_precheck_balance_and_original_transfer.png
   - Tijani_Mubarak_301915100_P3_05b_execute_reversal.png
   - Tijani_Mubarak_301915100_P3_05c_verify_restored_balance.png
   - Tijani_Mubarak_301915100_P3_05d_reversal_transaction_link.png
   - Tijani_Mubarak_301915100_P3_05e_reversal_ledger_entries.png
   - Tijani_Mubarak_301915100_P3_06a_initial_transfer_submission_with_idempotency_key.png
   - Tijani_Mubarak_301915100_P3_06b_simulated_client_retry.png
   - Tijani_Mubarak_301915100_P3_06c_conflicts_test_same_idempotency_key.png
   - Tijani_Mubarak_301915100_P3_06d_idempotency_retry_and_conflic.png
   - Tijani_Mubarak_301915100_P3_07a_begin_transaction_read_initial_balance.png
   - Tijani_Mubarak_301915100_P3_07b_commit_a_concurrent_update.png
   - Tijani_Mubarak_301915100_P3_07c_isolation_non_repeatable_read.png
   - Tijani_Mubarak_301915100_P3_08a_lock_row_then_post_transfer.png
   - Tijani_Mubarak_301915100_P3_08b_attempt_to_debit_while_locked.png
   - Tijani_Mubarak_301915100_P3_08c_concurrency_race_no_overdraft.png
   - Tijani_Mubarak_301915100_P3_09a_reproduce_intentional_lock.png
   - Tijani_Mubarak_301915100_P3_09b_deadlock_detection_error.png
   - Tijani_Mubarak_301915100_P3_09c_safe_deterministic_lock_ordering.png
   - Tijani_Mubarak_301915100_P3_09e_safe_deterministic_lock_ordering_2.png
   - Tijani_Mubarak_301915100_P3_10_audit_reconciliation_zero_drift.png
   - Tijani_Mubarak_301915100_P3_11_pgbench_stress_test.png: Automated pgbench stress test output with 10 concurrent clients, 500 txns, 0 failures, ~2,800 TPS, and 3-way reconciliation audit passed.

================================================================================
PORTFOLIO 4: NOSQL AND ADVANCED DATA MODELS
================================================================================
1. Architecture, Schema Design & Consistency Analysis:
   - Tijani_Mubarak_301915100_P4_NoSQLModelDesign.md: JSON Schema validator specifications, embedding vs referencing analysis, anti-pattern avoidance (no unbounded customer event arrays), and index design.
   - Tijani_Mubarak_301915100_P4_SQLvsNoSQLRationale.md: Comparative matrix, authoritative balance vs event projections, CAP/PACELC theorem evaluation, and Transactional Outbox Pattern design.
   - Tijani_Mubarak_301915100_P4_README.md: Execution guide and screenshot runbook for mongosh and Node.js test runners.

2. Seed Dataset, Rubric Scripts & Log Outputs:
   - Tijani_Mubarak_301915100_P4_Events_Seed.json: 20 synthetic Nigerian fintech transaction events with polymorphic metadata.
   - Tijani_Mubarak_301915100_P4_01_SchemaValidation.js: MongoDB schema validation for 3 collections (kyc_profiles, audit_events, login_sessions) with deliberate code 121 rejection.
   - Tijani_Mubarak_301915100_P4_02_SeedData.js: Document ingestion script seeding 5,000 KYC profiles and 25,000 audit events.
   - Tijani_Mubarak_301915100_P4_03_CrudAndAggregation.js: CRUD operations ($elemMatch, $set/$push, delete) and 4 aggregations including $lookup and $size.
   - Tijani_Mubarak_301915100_P4_04_IndexesExplain.js: Index tuning, before/after explain() measurements, unique index code 11000 proof, TTL index, and partial index.
   - Tijani_Mubarak_301915100_P4_Output_03_CrudAndAggregation.txt: Execution log output of CRUD operations and 4 aggregation pipelines.
   - Tijani_Mubarak_301915100_P4_Output_04_IndexesExplain.txt: Execution log output of before/after explain() performance metrics and constraint proofs.
   - Tijani_Mubarak_301915100_P4_01_SetupCollection.js: MongoDB collection creation with $jsonSchema validation and 5 strategic indexes.
   - Tijani_Mubarak_301915100_P4_02_SeedEvents.js: Document ingestion script with BSON types.
   - Tijani_Mubarak_301915100_P4_03_QueriesAndAggregations.js: Queries (Q1-Q3) and Aggregation Pipelines (Agg1-Agg3) for customer feeds, lifecycle lookups, failure distribution, channel turnover, and fraud detection.
   - Tijani_Mubarak_301915100_P4_04_OutboxPattern.js: Transactional outbox idempotent upsert consumer simulation.
   - Tijani_Mubarak_301915100_P4_RunLab.js: Standalone zero-dependency Node.js execution engine.

3. Visual Execution Evidence:
   - Tijani_Mubarak_301915100_P4_01_schema_validation.png: Proof of 3 collections initialized and deliberate bad insert rejected with code 121.
   - Tijani_Mubarak_301915100_P4_02_seed_verification.png: Terminal verification showing 5,000 KYC profiles and 25,000 audit events ingested.
   - Tijani_Mubarak_301915100_P4_03_crud_output.png: Execution of CREATE, READ ($elemMatch), UPDATE ($set/$push), and DELETE operations.
   - Tijani_Mubarak_301915100_P4_08_compass_indexes.png: MongoDB Compass GUI showing compound indexes and idx_partial_high_risk_fraud partial index.
   - Tijani_Mubarak_301915100_P4_01_Schema_and_Indexes.png: Schema validator and index creation output.
   - Tijani_Mubarak_301915100_P4_02_Seed_Documents_Ingested.png: Ingestion confirmation for 20 event documents.
   - Tijani_Mubarak_301915100_P4_03_Query_Customer_Activity.png: Paginated customer activity feed using idx_customer_timeline.
   - Tijani_Mubarak_301915100_P4_04_Query_Lifecycle_Lookup.png: Point lookup by transaction_ref showing full lifecycle progression.
   - Tijani_Mubarak_301915100_P4_05_Query_Failed_Diagnostics.png: Diagnostic filter for failed transfers displaying error codes.
   - Tijani_Mubarak_301915100_P4_06_Agg_Failure_Distribution.png: Aggregation pipeline grouping failed volume by reason and channel (also available as _06c_).
   - Tijani_Mubarak_301915100_P4_07_Agg_Channel_Turnover.png: Multi-channel volume, total turnover, and average latency breakdown (stages _07a_, _07b_, _07c_).
   - Tijani_Mubarak_301915100_P4_08_Agg_Fraud_Security.png: Fraud detection flagging risk scores >= 0.70 and impossible travel anomaly.
   - Tijani_Mubarak_301915100_P4_09_Outbox_Idempotent_Replay.png: Outbox pattern duplicate delivery rejection proof.

================================================================================
PORTFOLIO 5: DISTRIBUTED AND CLOUD DATABASE EXERCISE
================================================================================
1. Architecture, Scaling & Reliability Documents:
   - Tijani_Mubarak_301915100_P5_Architecture.mmd: End-to-end cloud reference architecture diagram (client channels -> API gateway & router -> PostgreSQL primary & read replica -> outbox CDC -> MongoDB cluster).
   - Tijani_Mubarak_301915100_P5_ReplicationAndFailover.md: Primary vs standby roles, synchronous vs asynchronous replication trade-offs, stale-read hazards on spendable balances, and split-brain fencing.
   - Tijani_Mubarak_301915100_P5_ShardingPartitioning.md: Single-node table partitioning vs horizontal multi-node sharding, cross-shard 2PC challenges, and architectural justification for retaining a single primary.
   - Tijani_Mubarak_301915100_P5_AvailabilityConsistencyRecovery.md: CAP/PACELC decisions, design-target RPO (< 1 min) and RTO (< 15 min), continuous WAL archiving, Point-in-Time Recovery (PITR), and telemetry alerting thresholds.
   - Tijani_Mubarak_301915100_P5_README.md: Execution runbook and screenshot evidence guidelines.

2. Topology, SQL & Simulation Scripts:
   - Tijani_Mubarak_301915100_P5_DockerCompose.yml: Multi-node Docker Compose topology orchestrating PostgreSQL 16 Primary (port 5433) and Streaming Read Replica (port 5434).
   - Tijani_Mubarak_301915100_P5_PrimaryInitReplication.sh: Primary initialization configuring replicator role and physical replication slot replica1_slot.
   - Tijani_Mubarak_301915100_P5_ReplicaEntrypoint.sh: Standby entrypoint executing automated pg_basebackup and launching streaming recovery.
   - Tijani_Mubarak_301915100_P5_01_PrimaryChecks.sql: Primary node replication health and slot status verification script.
   - Tijani_Mubarak_301915100_P5_02_ReplicaChecks.sql: Standby replica health check and read-only enforcement test script.
   - Tijani_Mubarak_301915100_P5_03_Partitioning.sql: Declarative hash-partitioned ledger table with 4 physical shards and EXPLAIN partition pruning verification.
   - Tijani_Mubarak_301915100_P5_04_AtlasCloudCheck.js: MongoDB Atlas 3-node replica set verification script testing w: majority write concern and secondaryPreferred read preference.
   - Tijani_Mubarak_301915100_P5_ReadRoutingSimulator.js: Node.js lag-aware connection router simulator demonstrating Primary mutation routing and stale-read overdraft mitigation.
   - Tijani_Mubarak_301915100_P5_BackupRestoreDrill.sh: Automated backup, disaster recovery target provisioning, restoration, and 100% reconciliation audit proof.

3. Execution Outputs:
   - Tijani_Mubarak_301915100_P5_Output_01_PrimaryChecks.txt: Execution log of primary recovery status and active replication slot.
   - Tijani_Mubarak_301915100_P5_Output_02_ReplicaChecks.txt: Execution log of replica streaming status and read-only write rejection error.
   - Tijani_Mubarak_301915100_P5_Output_03_Partitioning.txt: Execution log of hash partitioning row counts, partition pruning, and scatter-gather query plans.
   - Tijani_Mubarak_301915100_P5_Output_04_AtlasCloudCheck.txt: Execution log of cloud replica set write concern and read preference tests.

4. Visual Execution Evidence:
   - Tijani_Mubarak_301915100_P5_01_docker_ps.png: Docker ps showing lsdb-pg-primary (healthy, port 5433) and lsdb-pg-replica (port 5434).
   - Tijani_Mubarak_301915100_P5_02_row_counts.png: Verification of identical ledger row counts (892) across primary and standby replica.
   - Tijani_Mubarak_301915100_P5_03_primary_checks.png: Primary health check showing is_replica = f and active physical slot replica1_slot.
   - Tijani_Mubarak_301915100_P5_04_replica_checks.png: Standby health check showing is_replica = t and read-only write block (ERROR 25006).
   - Tijani_Mubarak_301915100_P5_05_stale_read.png: Live replication lag proof showing primary count = 4, replica count = 3, and caught_up = f.
   - Tijani_Mubarak_301915100_P5_06_caught_up.png: Replica catch-up proof after resuming WAL replay showing caught_up = t.
   - Tijani_Mubarak_301915100_P5_07_sync_hang.png: Synchronous replication hang proof when standby replica is stopped (CAP availability trade-off).
   - Tijani_Mubarak_301915100_P5_08_sync_warning.png: PostgreSQL cancellation warning proving transaction committed locally but un-replicated.
   - Tijani_Mubarak_301915100_P5_09_partitioning.png: 4-shard hash partitioning showing partition pruning on account_id vs scatter-gather on transaction_id.
   - Tijani_Mubarak_301915100_P5_10_failover.png: Manual failover drill promoting replica via pg_promote(), sequence jump, and accepting writes.
   - Tijani_Mubarak_301915100_P5_11_own_work.png: Student's own work showing lag-aware router overdraft prevention and 100% DR restore reconciliation.

================================================================================
FINAL SUBMISSION DELIVERABLES & ACADEMIC DECLARATIONS
================================================================================
1. Executive Synthesis Report:
   - Tijani_Mubarak_301915100_Final_Report.md: Comprehensive 2-3 page executive summary and engineering synthesis for LMS submission covering all 5 portfolios.

2. Academic Integrity & Bibliography:
   - Tijani_Mubarak_301915100_AI_Use_Declaration.md: Transparent, auditable declaration of Generative AI assistance and independent verification.
   - Tijani_Mubarak_301915100_References.md: Comprehensive academic bibliography, regulatory citations, and industry engineering standards.


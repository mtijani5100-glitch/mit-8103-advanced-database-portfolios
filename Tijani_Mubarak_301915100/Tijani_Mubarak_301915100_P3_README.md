# Portfolio 3: Transactions and Concurrency

**LedgerSpring Digital Bank (LSDB)**
Student: Mubarak Tijani | ID: 301915100

---

## Overview

This portfolio demonstrates correct ACID transaction behaviour under
success, failure, retry, and concurrent requests using the LSDB PostgreSQL
schema defined in Portfolio 1.

All scripts run in pgAdmin 4 or any PostgreSQL client (no psql meta-commands).
Scripts must be executed in the order below against the database that already
contains the Portfolio 1 schema and seed data.

---

## Prerequisites

1. Portfolio 1 schema applied (`Tijani_Mubarak_301915100_P1_CreateSchema.sql`)
2. Portfolio 1 seed data loaded (`Tijani_Mubarak_301915100_P1_SeedData.sql`)
3. PostgreSQL 14+ (tested on PostgreSQL 15)

---

## Execution Order

| Step | File | Purpose |
|---:|---|---|
| 1 | `sql/Tijani_Mubarak_301915100_P3_Setup.sql` | Create and fund P3 demo accounts |
| 2 | `sql/Tijani_Mubarak_301915100_P3_CommitRollback.sql` | Exercise A (commit) and B (rollback) |
| 3 | `sql/Tijani_Mubarak_301915100_P3_InsufficientFunds.sql` | Exercise C (insufficient funds) |
| 4 | `sql/Tijani_Mubarak_301915100_P3_Reversal.sql` | Exercise D (reversal) |
| 5 | `sql/Tijani_Mubarak_301915100_P3_Idempotency.sql` | Exercise E (idempotency) |
| 6 | `sql/Tijani_Mubarak_301915100_P3_ConcurrencyTests.sql` | Exercises F and G (concurrency + deadlock) |
| 7 | `scripts/Tijani_Mubarak_301915100_P3_pgbench_stress_test.sh` | Exercise H (Automated pgbench stress test: 10 clients, 500 txns, 3-way audit) |

---

## Exercises Covered

| Label | Rubric item |
|---|---|
| A | Successful commit: transfer with balanced ledger and cached balance update |
| B | Deliberate rollback: partial posting error; all effects undone |
| C | Insufficient funds: no debit, FAILED record written, balance unchanged |
| D | Reversal: opposite ledger entries, original record preserved |
| E | Idempotency: duplicate request returns original result; payload change rejected |
| F | Concurrency race: SELECT FOR UPDATE prevents overdraft across two sessions |
| G | Deadlock reproduction and safe deterministic lock-order fix |
| H | Automated stress testing: pgbench 10 concurrent clients, 500 txns, 2,748 TPS, 3-way reconciliation audit |

---

## Two-Session Tests (F and G)

Exercises F and G require two pgAdmin query tabs open simultaneously.

**Exercise F:**
1. Open Tab 1 and Tab 2 pointing at the same database.
2. In Tab 1: run the SESSION A block (stops before COMMIT).
3. In Tab 2: run the SESSION B block (it will block waiting for the lock).
4. In Tab 1: execute COMMIT.
5. Tab 2 unblocks, re-reads the balance, and records either POSTED or FAILED.
6. Run the verification SELECT to confirm no overdraft.

**Exercise G (deadlock):**
1. Run the SESSION A deadlock block in Tab 1 (stops after locking Alice).
2. Run the SESSION B deadlock block in Tab 2 (stops after locking Charlie).
3. PostgreSQL detects the cycle after `deadlock_timeout` (default 1 s) and aborts one session.
4. Observe the `ERROR: deadlock detected` message.
5. Run the safe versions of both sessions (ascending lock order) to confirm no error.

---

## Evidence to Capture

Take pgAdmin screenshots of the following result sets and save them to `evidence/`:

| Screenshot filename | Query/step |
|---|---|
| `01_setup_opening_balances.png` | Step 1, Section 4 verification SELECT |
| `02a_commit_before.png` | Exercise A, Step A1 (balances before) |
| `02b_commit_ledger.png` | Exercise A, Step A4 (balanced ledger) |
| `02c_commit_after.png` | Exercise A, Step A3 (balances after) |
| `03a_rollback_partial.png` | Exercise B — the ROLLBACK error message |
| `03b_rollback_verified.png` | Exercise B, Step B3 (zero rows in transactions) |
| `04a_insuf_funds_balance.png` | Exercise C, Step C3 (balance unchanged) |
| `04b_insuf_funds_failed_tx.png` | Exercise C, Step C4 (FAILED record) |
| `04c_insuf_no_ledger.png` | Exercise C, Step C5 (zero ledger lines) |
| `05a_reversal_before.png` | Exercise D, Step D1 |
| `05b_reversal_after_balances.png` | Exercise D, Step D3 |
| `05c_reversal_ledger_all.png` | Exercise D, Step D5 (four entries) |
| `05d_reversal_double_rejected.png` | Exercise D, Step D6 (REV-03 notice) |
| `06a_idem_first_post.png` | Exercise E, Step E1 (first submission notice) |
| `06b_idem_retry_notice.png` | Exercise E, Step E2 (retry notice) |
| `06c_idem_conflict.png` | Exercise E, Step E4 (TX-07 conflict notice) |
| `07a_race_session_a.png` | Exercise F — Session A posting |
| `07b_race_session_b.png` | Exercise F — Session B outcome |
| `07c_race_no_overdraft.png` | Exercise F — final balance verification |
| `08a_deadlock_error.png` | Exercise G — deadlock error message |
| `08b_safe_lock_order.png` | Exercise G — safe version, no error |
| `09_reconciliation.png` | Part 4 reconciliation (drift = 0) |

---

## Analysis Document

See [`concurrency-analysis.md`](./concurrency-analysis.md) for:
- Lock strategy and SELECT FOR UPDATE rationale
- Isolation level comparison (READ COMMITTED vs REPEATABLE READ)
- Deadlock reproduction and deterministic lock-order fix
- Overdraft prevention and lost-update analysis
- Rollback correctness and idempotency design

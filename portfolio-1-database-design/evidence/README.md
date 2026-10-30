# Portfolio 1: Database Design and Modelling
## LedgerSpring Digital Bank (LSDB)

**MIT 8103 Advanced Database Systems**

---

## Quick Start

```bash
# 1. Create the database
createdb lsdb_dev

# 2. Build the schema (all six tables + indexes)
psql -d lsdb_dev -f sql/Tijani_Mubarak_301915100_P1_CreateSchema.sql

# 3. Load synthetic seed data
psql -d lsdb_dev -f sql/Tijani_Mubarak_301915100_P1_SeedData.sql

# 4. Run constraint tests (all should PASS)
psql -d lsdb_dev -f sql/Tijani_Mubarak_301915100_P1_ConstraintTests.sql
```

---

## Portfolio Evidence

| File | Purpose |
|---|---|
| [`sql/Tijani_Mubarak_301915100_P1_CreateSchema.sql`](sql/Tijani_Mubarak_301915100_P1_CreateSchema.sql) | DDL for all six core tables, constraints, and indexes |
| [`sql/Tijani_Mubarak_301915100_P1_SeedData.sql`](sql/Tijani_Mubarak_301915100_P1_SeedData.sql) | Synthetic Nigerian banking data: 12 customers, 18 accounts, deposits, transfers, and ledger entries |
| [`sql/Tijani_Mubarak_301915100_P1_ConstraintTests.sql`](sql/Tijani_Mubarak_301915100_P1_ConstraintTests.sql) | 11 named tests demonstrating database rule enforcement |
| [`relational-schema.md`](relational-schema.md) | Full data dictionary with column types, keys, and FK map |
| [`normalisation.md`](normalisation.md) | 1NF → BCNF analysis tied to the actual schema |
| [`../case-study.md`](../case-study.md) | Detailed case study description for LedgerSpring Digital Bank |
| [`edge-case-test-matrix.md`](edge-case-test-matrix.md) | Comprehensive 11-scenario edge-case and constraint verification matrix |
| [`../diagrams/Tijani_Mubarak_301915100_ERD_v2.png`](../diagrams/Tijani_Mubarak_301915100_ERD_v2.png) | Rendered visual ER diagram export (PNG) |
| [`../diagrams/Tijani_Mubarak_301915100_ERD_v2.drawio`](../diagrams/Tijani_Mubarak_301915100_ERD_v2.drawio) | Editable ERD source model (diagrams.net / draw.io) |
| [`../docs/business-rules.md`](../../docs/business-rules.md) | 29 numbered core banking business rules |
| [`evidence/`](./) | 10 verified terminal screenshots showing clean reset, schema creation, seed ingestion, and constraint passes |

---

## Entities

| Table | Purpose |
|---|---|
| `customers` | Customer identity and status |
| `accounts` | Customer and system clearing/suspense accounts |
| `transactions` | Money-movement request records |
| `ledger_entries` | Double-entry journal lines (immutable) |
| `idempotency_keys` | Retry-safe deduplication guard |
| `audit_logs` | Append-only operational audit trail |

---

## Key Design Decisions

1. **System accounts are nullable-owner `accounts` rows**, distinguished by
   `account_kind = 'SETTLEMENT'`. This allows deposits and withdrawals to
   post balanced ledger entries without a separate "clearing" table.

2. **`available_balance` is a cached projection**, deliberately denormalised
   for read performance. It is always updated atomically with ledger entries
   in the same `BEGIN`/`COMMIT` block. A reconciliation query verifies it.

3. **One full reversal per original transaction** is enforced by a `UNIQUE`
   constraint on `transactions.reversal_of_transaction_id`, preventing
   concurrent double-reversal races.

4. **`ledger_entries` is immutable**: no `UPDATE` or `DELETE` is permitted
   for the application role. Corrections are made by a compensating reversal
   transaction.

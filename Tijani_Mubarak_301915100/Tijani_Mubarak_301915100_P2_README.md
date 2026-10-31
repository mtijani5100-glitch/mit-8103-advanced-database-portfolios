# Portfolio 2: Query Processing and Optimisation

**Course:** MIT 8103 Advanced Database Systems  
**Weight:** 7 Marks  
**Author:** Mubarak Tijani (`mtijani5100-glitch`)  
**Institution:** Miva Open University  
**Case Study:** LedgerSpring Digital Bank (LSDB) — Core Banking & Double-Entry Ledger System  
**Database Engine:** PostgreSQL 16.13 (Homebrew) on Apple Silicon macOS  

---

## 1. Overview & Objective

This portfolio satisfies the requirements of **Portfolio 2 (Query Processing and Optimisation)** for MIT 8103. The primary objective is to demonstrate relational query planning, execution analysis, cost-based optimizer (CBO) decision-making, and targeted indexing strategies using real financial data access patterns.

### Core Objectives
1. Implement **10 core banking query families** covering operational lookups, financial ledger aggregations, reconciliation, and audit reporting.
2. Capture full `EXPLAIN (ANALYZE, BUFFERS)` execution plans before and after adding optimisation indexes.
3. Formulate targeted index migrations (composite and partial B-trees) informed by plan analysis.
4. Provide a technically rigorous, mathematically honest evaluation of query performance, buffer activity, and PostgreSQL cost models.

---

## 2. Directory Structure

```
portfolio-2-query-optimisation/
├── README.md                          # This portfolio guide and documentation
├── performance-results.md             # Detailed benchmark metrics, plan comparisons, and CBO analysis
├── queries/                           # 10 production-grade SQL query implementations
│   ├── 01_customer_accounts.sql       # Q01: Customer account lookup
│   ├── 02_account_tx_history.sql      # Q02: Paginated account transaction history
│   ├── 03_transaction_lookup.sql      # Q03: Transaction lookup by unique reference
│   ├── 04_operations_failures.sql     # Q04: Operations monitoring for pending/failed tx
│   ├── 05_daily_totals.sql            # Q05: Daily transaction totals by type and status
│   ├── 06_high_value_transfers.sql    # Q06: High-value transfers AML threshold filter
│   ├── 07_balance_reconciliation.sql  # Q07: Balance reconciliation (cached vs ledger-derived)
│   ├── 08_unbalanced_journals.sql     # Q08: Unbalanced or missing journal audit check
│   ├── 09_net_movement_reversals.sql  # Q09: Net movement adjusted for reversal transactions
│   └── 10_full_join_report.sql        # Q10: Fanout-safe reporting across customers, accounts, tx, ledger
├── sql/                               # Executable orchestration scripts
│   ├── 01_baseline_plans.sql          # Captures baseline EXPLAIN ANALYZE for all 10 queries
│   ├── 02_create_indexes.sql          # Applies 3 targeted optimisation indexes + ANALYZE
│   └── 03_optimised_plans.sql         # Captures post-optimisation EXPLAIN ANALYZE for all 10 queries
├── plans/                             # Raw PostgreSQL execution plan outputs
│   ├── baseline/                      # Baseline execution plans (before new indexes)
│   │   ├── all_baseline_plans.txt     # Consolidated baseline output
│   │   ├── q01.txt ... q10.txt        # Individual baseline query plans
│   └── optimised/                     # Optimised execution plans (after new indexes)
│       ├── all_optimised_plans.txt    # Consolidated post-optimisation output
│       └── q01.txt ... q10.txt        # Individual post-optimisation query plans
└── evidence/                          # Graphical Explain Plan & execution screenshots
```

---

## 3. The 10 Banking Query Families

| Query ID | File | Business / Banking Use Case | Plan Characteristics |
|---|---|---|---|
| **Q01** | `01_customer_accounts.sql` | Retail onboarding & dashboard: fetch all accounts for a customer | Foreign key join (`customers` $\to$ `accounts`) |
| **Q02** | `02_account_tx_history.sql` | Mobile app statement: paginated bilateral ledger history | Bi-directional filter (`source` OR `destination`), `ORDER BY created_at DESC LIMIT 10` |
| **Q03** | `03_transaction_lookup.sql` | Payment support / receipt generation by transaction reference | Multi-table LEFT JOIN (source/dest accounts & customers, reversal linkage) |
| **Q04** | `04_operations_failures.sql` | Fraud & operations monitoring: pending or failed transactions | Selective operational filter (`status IN ('PENDING','FAILED','SUBMITTED')`) |
| **Q05** | `05_daily_totals.sql` | Daily clearing & treasury report: aggregate volume and value | `GROUP BY transaction_type, status` with `COUNT` and `SUM` |
| **Q06** | `06_high_value_transfers.sql` | AML/CFT compliance: transactions exceeding reporting threshold | Filter on `amount >= 50,000` and `status = 'POSTED'` |
| **Q07** | `07_balance_reconciliation.sql` | Automated End-of-Day integrity check: cached vs ledger balance | Aggregated double-entry debit/credit sum vs `accounts.available_balance` |
| **Q08** | `08_unbalanced_journals.sql` | Core accounting invariant audit: detect unbalanced transactions | `HAVING SUM(debit) <> SUM(credit)` or `COUNT(entries) = 0` |
| **Q09** | `09_net_movement_reversals.sql` | Financial movement reporting: net flow without double-counting reversals | Anti-join / exclusion filter on `reversal_of_transaction_id` |
| **Q10** | `10_full_join_report.sql` | Multi-dimensional audit report without Cartesian product fan-out | Aggregated join structure preserving exact transaction amounts |

---

## 4. Execution & Reproduction Guide

To run and verify the entire Portfolio 2 suite against PostgreSQL:

### Prerequisites
1. Ensure PostgreSQL is active and the `ledgerspring` database exists with Portfolio 1 schema and seed data loaded:
   ```bash
   psql -d ledgerspring -f portfolio-1-database-design/sql/01_create_schema.sql
   psql -d ledgerspring -f portfolio-1-database-design/sql/02_seed_data.sql
   ```

### Step 1: Capture Baseline Plans
Capture raw EXPLAIN ANALYZE plans prior to creating the new indexes:
```bash
psql -d ledgerspring -f portfolio-2-query-optimisation/sql/01_baseline_plans.sql > portfolio-2-query-optimisation/plans/baseline/all_baseline_plans.txt
```

### Step 2: Apply Targeted Optimisation Indexes
Execute the index migration script:
```bash
psql -d ledgerspring -f portfolio-2-query-optimisation/sql/02_create_indexes.sql
```
*Creates `idx_tx_type_amount` (partial composite), `idx_ledger_account_side` (composite), and `idx_tx_dest_account` (partial).*

### Step 3: Capture Optimised Plans
Capture post-indexing EXPLAIN ANALYZE plans:
```bash
psql -d ledgerspring -f portfolio-2-query-optimisation/sql/03_optimised_plans.sql > portfolio-2-query-optimisation/plans/optimised/all_optimised_plans.txt
```

### Step 4: Run Individual Queries
Any individual query can be directly executed using `psql`:
```bash
psql -d ledgerspring -f portfolio-2-query-optimisation/queries/07_balance_reconciliation.sql
```

---

## 5. Key Findings & Optimizer Insights

1. **Rationality of Sequential Scans on Small Datasets:**
   On seed data (15 transactions, 28 ledger entries), each table occupies a single 8KB disk page. The PostgreSQL Cost-Based Optimizer (CBO) correctly calculates that reading 1 contiguous page via `Seq Scan` (cost $\approx 1.2$) is cheaper than traversing a B-tree index and performing random page fetches (cost $\approx 8.2$).
2. **Index Validation via Planner Penalization:**
   Setting `SET enable_seqscan = off` proves that the created indexes immediately activate with matching index conditions (`Index Cond: (transaction_type = 'TRANSFER' AND amount > 50000)`), confirming they are structurally correct for production-scale tables.
3. **Double-Entry Financial Integrity:**
   Both Q07 (Balance Reconciliation) and Q08 (Unbalanced Journals) return **0 discrepancy rows**, proving that every transaction in the database adheres to double-entry accounting rules ($\sum \text{Debits} = \sum \text{Credits}$).
4. **Cartesian Product Prevention:**
   Query Q10 demonstrates how to structure multi-table financial reports to prevent the common relational reporting pitfall where joining transactions to ledger entries inflates account-level balances.

For full mathematical cost models, buffer statistics, and index lifecycle trade-offs, refer to [performance-results.md](./performance-results.md).

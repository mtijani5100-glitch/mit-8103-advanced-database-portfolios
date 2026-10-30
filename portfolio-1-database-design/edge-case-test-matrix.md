# LedgerSpring Digital Bank (LSDB) — Edge-Case Test Matrix

> **Course:** MIT 8103 Advanced Database Systems  
> **Component:** Portfolio 1 — Database Design and Integrity Enforcement  
> **Test Script Reference:** [`portfolio-1-database-design/sql/Tijani_Mubarak_301915100_P1_ConstraintTests.sql`](file:///Users/tijanimubarak/Developer/mit-8103-advanced-database-portfolio/portfolio-1-database-design/sql/Tijani_Mubarak_301915100_P1_ConstraintTests.sql)  
> **Schema Reference:** [`portfolio-1-database-design/sql/Tijani_Mubarak_301915100_P1_CreateSchema.sql`](file:///Users/tijanimubarak/Developer/mit-8103-advanced-database-portfolio/portfolio-1-database-design/sql/Tijani_Mubarak_301915100_P1_CreateSchema.sql)


---

## 1. Executable Constraint Test Cases (Portfolio 1)

All 11 test cases below are implemented as automated PL/pgSQL assertion blocks in `03_constraint_tests.sql`. Each test attempts an invalid state, catches the exact database error, and asserts that the PostgreSQL storage engine rejects the operation at the schema level.

| Test # | Playbook ID | Domain | Scenario Tested | Constraint / Mechanism | Expected Error / Exception | Status |
|:---:|:---:|---|---|---|---|:---:|
| **01** | `ACC-01` | Account | Attempt to insert an account with an existing account number (`1000000001`) | `UNIQUE (account_number)` on `accounts` | `unique_violation` (`23505`) | **PASS** |
| **02** | `ACC-02` | Account | Attempt to assign account to non-existent `customer_id` (`999999`) | `FOREIGN KEY (customer_id) REFERENCES customers` | `foreign_key_violation` (`23503`) | **PASS** |
| **03** | `ACC-09` | Account | Customer account created with `NULL` `customer_id` | `CHECK (chk_account_kind_consistency)` | `check_violation` (`23514`) | **PASS** |
| **04** | `ACC-09` | Account | System `SETTLEMENT` account created with a non-null `customer_id` | `CHECK (chk_account_kind_consistency)` | `check_violation` (`23514`) | **PASS** |
| **05** | `AMT-01` | Transaction | Transaction initiated with `amount = 0` | `CHECK (amount > 0)` on `transactions` | `check_violation` (`23514`) | **PASS** |
| **06** | `AMT-07` | Transaction | Transfer initiated where `source_account_id = destination_account_id` | `CHECK (source_account_id <> destination_account_id)` | `check_violation` (`23514`) | **PASS** |
| **07** | `TX-05` | Transaction | Attempt to insert duplicate `transaction_ref` (`TXN-2026-TRF-001`) | `UNIQUE (transaction_ref)` on `transactions` | `unique_violation` (`23505`) | **PASS** |
| **08** | `REV-03` | Reversal | Attempt second full reversal of an already-reversed transaction | `UNIQUE (reversal_of_transaction_id)` on `transactions` | `unique_violation` (`23505`) | **PASS** |
| **09** | `AMT-02` | Ledger | Attempt to record ledger entry with `amount = 0` | `CHECK (amount > 0)` on `ledger_entries` | `check_violation` (`23514`) | **PASS** |
| **10** | `TX-06` | Idempotency | Attempt duplicate `(scope, idem_key)` with distinct payload hash | `UNIQUE (scope, idem_key)` on `idempotency_keys` | `unique_violation` (`23505`) | **PASS** |
| **11** | `REV-01` | Reversal | Valid reversal transaction row accepted then safely rolled back | Schema allows valid self-referential FK link and rollback keeps state pristine | `__ROLLBACK__` caught; state unchanged | **PASS** |

---

## 2. Detailed Technical Breakdown of Each Test Case

### Test 1 (`ACC-01`): Duplicate Account Number
- **Business Rule:** Every account in the banking platform must possess an unambiguous, globally unique 10-digit NUBAN/account number.
- **Triggered SQL:**
  ```sql
  INSERT INTO accounts (customer_id, account_number, account_kind, account_type, currency, available_balance, status)
  VALUES (v_cid, '1000000001', 'CUSTOMER', 'SAVINGS', 'NGN', 0, 'ACTIVE');
  ```
- **Result:** Trapped `23505 unique_violation`. Database rejected duplicate account number.

### Test 2 (`ACC-02`): Orphan Customer Reference
- **Business Rule:** An account cannot be opened without referencing an existing, legally registered customer profile.
- **Triggered SQL:**
  ```sql
  INSERT INTO accounts (customer_id, account_number, account_kind, account_type, currency, available_balance, status)
  VALUES (999999, '9999999999', 'CUSTOMER', 'SAVINGS', 'NGN', 0, 'ACTIVE');
  ```
- **Result:** Trapped `23503 foreign_key_violation`. Referential integrity preserved.

### Test 3 & 4 (`ACC-09`): Account Kind Polymorphic Consistency
- **Business Rule:**
  - `CUSTOMER` accounts **must** have a non-null `customer_id`, non-null `account_type`, and non-null `available_balance`.
  - `SETTLEMENT` / `SUSPENSE` accounts **must** have a null `customer_id`, null `account_type`, and null `available_balance`.
- **Constraint Definition:**
  ```sql
  CONSTRAINT chk_account_kind_consistency CHECK (
      (account_kind = 'CUSTOMER'   AND customer_id IS NOT NULL AND account_type IS NOT NULL AND available_balance IS NOT NULL) OR
      (account_kind IN ('SETTLEMENT', 'SUSPENSE') AND customer_id IS NULL AND account_type IS NULL AND available_balance IS NULL)
  )
  ```
- **Result:** Both violations (Customer with NULL owner, and System account with customer owner) were rejected with `23514 check_violation`.

### Test 5 (`AMT-01`): Zero-Amount Transaction
- **Business Rule:** Financial requests with zero value cannot be entered into the banking pipeline.
- **Triggered SQL:**
  ```sql
  INSERT INTO transactions (transaction_ref, transaction_type, status, amount, currency, source_account_id, destination_account_id, initiated_by)
  VALUES ('TXN-FAIL-ZERO', 'TRANSFER', 'PENDING', 0, 'NGN', v_src, v_dst, 'test');
  ```
- **Result:** Trapped `23514 check_violation`.

### Test 6 (`AMT-07`): Self-Transfer Invariant
- **Business Rule:** Customers cannot transfer funds to the exact same account.
- **Constraint Definition:** `CONSTRAINT chk_transfer_distinct_accounts CHECK (source_account_id <> destination_account_id)`
- **Result:** Trapped `23514 check_violation`.

### Test 7 (`TX-05`): Duplicate Transaction Reference
- **Business Rule:** Transaction references generated by the core banking orchestrator are unique idempotency anchors.
- **Result:** Trapped `23505 unique_violation` when attempting to reuse `'TXN-2026-TRF-001'`.

### Test 8 (`REV-03`): Double Reversal Prevention at Schema Level
- **Business Rule:** A posted financial transaction may be reversed at most once. Double-crediting or duplicate reversal cascades must be prevented even under race conditions.
- **Constraint Definition:** `UNIQUE (reversal_of_transaction_id)`
- **Result:** Attempting to create a second reversal row pointing to `'TXN-2026-TRF-001'` trapped `23505 unique_violation`.

### Test 9 (`LED-03` / `AMT-02`): Zero or Negative Ledger Entry
- **Business Rule:** Double-entry journal lines must represent positive magnitudes; debit/credit side dictates direction.
- **Constraint Definition:** `CHECK (amount > 0)` on `ledger_entries`.
- **Result:** Trapped `23514 check_violation`.

### Test 10 (`TX-06`): Idempotency Collision Guard
- **Business Rule:** A repeated request within the same scope with a conflicting hash must be rejected.
- **Constraint Definition:** `UNIQUE (scope, idem_key)` on `idempotency_keys`.
- **Result:** Trapped `23505 unique_violation`.

### Test 11 (`REV-01`): Valid Compensating Transaction Lifecycle & Rollback
- **Business Rule:** A valid reversal transaction must link cleanly to its original transaction, then safely roll back without polluting the persistent seed dataset.
- **Result:** Row accepted and returned `transaction_id`; controlled exception triggered safe rollback, leaving database seed balances intact.

---

## 3. Playbook Requirements Traceability (Portfolios 1 to 5)

| Playbook Area | Cases Described | Status in Portfolio 1 | Target Lifecycle |
|---|---|---|---|
| **Customer & Account (`ACC-01` to `ACC-10`)** | Duplicate NUBAN, orphan FK, null owner, account state | **Implemented & Tested** (`ACC-01, 02, 09`) | Completed in Portfolio 1 |
| **Amount & Currency (`AMT-01` to `AMT-10`)** | Zero amount, self-transfer, numeric precision | **Implemented & Tested** (`AMT-01, 07`) | Completed in Portfolio 1 |
| **Transaction & Posting (`TX-01` to `TX-15`)** | Atomic commit/rollback, duplicate reference, idempotency | **Constraint guards in place** (`TX-05, 06`) | Multi-step concurrency tested in Portfolio 3 |
| **Reversals (`REV-01` to `REV-08`)** | Full reversal link, double-reversal rejection | **Implemented & Tested** (`REV-01, 03`) | Extended concurrency testing in Portfolio 3 |
| **Ledger & Reconciliation (`LED-01` to `LED-10`)** | Balanced debits/credits, cached vs ledger parity | **SQL reconciliation query in seed script** | Advanced query analysis in Portfolio 2 |
| **Concurrency & Operations (`CONC-01` to `CONC-06`)** | Row locking (`SELECT ... FOR UPDATE`), deadlocks | **Schema prepared with deterministic ordering** | Dedicated 2-session lab in Portfolio 3 |

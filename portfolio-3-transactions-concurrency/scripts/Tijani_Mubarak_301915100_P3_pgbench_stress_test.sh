#!/usr/bin/env bash
# High-concurrency pgbench stress test runner
# Mubarak Tijani (ID: 301915100)

set -e

DB_NAME="${PGDATABASE:-ledgerspring}"
PGBENCH_BIN="$(which pgbench || echo '/opt/homebrew/bin/pgbench')"
PSQL_BIN="$(which psql || echo '/opt/homebrew/bin/psql')"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_DIR="${SCRIPT_DIR}/../sql"

echo "Initializing pgbench test accounts and transfer function..."
"${PSQL_BIN}" -d "${DB_NAME}" -f "${SQL_DIR}/Tijani_Mubarak_301915100_P3_pgbench_setup.sql" > /dev/null

echo "Pre-test balances for P3-BENCH accounts:"
"${PSQL_BIN}" -d "${DB_NAME}" -c "
SELECT 
    COUNT(*) AS accounts,
    SUM(available_balance) AS total_balance,
    MIN(available_balance) AS min_balance,
    MAX(available_balance) AS max_balance
FROM accounts 
WHERE account_number LIKE 'P3-BENCH-%';
"

echo "Running pgbench (10 clients, 2 threads, 50 txns/client)..."
"${PGBENCH_BIN}" -d "${DB_NAME}" \
    -f "${SQL_DIR}/Tijani_Mubarak_301915100_P3_pgbench_transfer.sql" \
    -c 10 \
    -j 2 \
    -t 50

echo "Post-stress verification:"
"${PSQL_BIN}" -d "${DB_NAME}" -c "
-- Total funds must remain constant
SELECT 
    COUNT(*) AS accounts,
    SUM(available_balance) AS total_balance,
    MIN(available_balance) AS min_balance,
    MAX(available_balance) AS max_balance
FROM accounts 
WHERE account_number LIKE 'P3-BENCH-%';

-- Check for negative balances
SELECT COUNT(*) AS overdraft_count 
FROM accounts 
WHERE account_number LIKE 'P3-BENCH-%' AND available_balance < 0;

-- Ledger balance check (debits must match credits)
SELECT 
    COUNT(*) AS ledger_lines,
    SUM(CASE WHEN le.entry_side = 'DEBIT' THEN le.amount ELSE 0 END) AS total_debits,
    SUM(CASE WHEN le.entry_side = 'CREDIT' THEN le.amount ELSE 0 END) AS total_credits,
    SUM(CASE WHEN le.entry_side = 'DEBIT' THEN -le.amount ELSE le.amount END) AS net_drift
FROM ledger_entries le
JOIN transactions t ON le.transaction_id = t.transaction_id
WHERE t.initiated_by = 'pgbench';
"

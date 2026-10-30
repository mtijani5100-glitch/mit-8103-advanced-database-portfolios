-- MIT 8103 Portfolio 5: Replica Health & Read-Only Enforcement
-- Student: Mubarak Tijani (ID: 301915100)
-- Target: PostgreSQL Standby Replica Node (port 5434)

\echo '================================================================================'
\echo 'STANDBY REPLICA HEALTH CHECK & READ-ONLY ENFORCEMENT'
\echo '================================================================================'

\echo '--- Check 1: Standby Recovery Status (Expect is_replica = t) ---'
SELECT pg_is_in_recovery() AS is_replica;

\echo '--- Check 2: WAL Receiver Status (Expect status = streaming) ---'
SELECT 
    status,
    receive_start_lsn,
    written_lsn,
    flushed_lsn,
    last_msg_send_time,
    last_msg_receipt_time,
    latest_end_lsn,
    slot_name
FROM pg_stat_wal_receiver;

\echo '--- Check 3: Read Verification on Standby (Eventual Consistency Read) ---'
SELECT count(*) AS total_accounts FROM accounts;
SELECT count(*) AS total_ledger_entries FROM ledger_entries;

\echo '--- Check 4: Read-Only Enforcement (Intentional Write Rejection) ---'
\echo 'Expected: ERROR: cannot execute UPDATE in a read-only transaction'
UPDATE accounts SET available_balance = available_balance + 100 WHERE account_id = 1;

\echo '================================================================================'
\echo 'REPLICA HEALTH CHECK COMPLETE'
\echo '================================================================================'

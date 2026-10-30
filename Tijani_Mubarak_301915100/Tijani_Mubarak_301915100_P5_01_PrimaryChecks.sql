-- MIT 8103 Portfolio 5: Primary Health & Replication Checks
-- Student: Mubarak Tijani (ID: 301915100)
-- Target: PostgreSQL Primary Node (port 5433)

\echo '================================================================================'
\echo 'PRIMARY NODE REPLICATION HEALTH CHECK'
\echo '================================================================================'

\echo '--- Check 1: Primary Recovery Status (Expect is_replica = f) ---'
SELECT pg_is_in_recovery() AS is_replica;

\echo '--- Check 2: Active Streaming Replication Connections ---'
SELECT 
    application_name,
    client_addr,
    state,
    sync_state,
    sync_priority,
    sent_lsn,
    write_lsn,
    flush_lsn,
    replay_lsn,
    pg_wal_lsn_diff(sent_lsn, replay_lsn) AS replay_lag_bytes
FROM pg_stat_replication;

\echo '--- Check 3: Replication Slots Status (Expect active = t for replica1_slot) ---'
SELECT 
    slot_name,
    plugin,
    slot_type,
    active,
    wal_status
FROM pg_replication_slots;

\echo '--- Check 4: Primary Write Readiness & Table Counts ---'
SELECT count(*) AS total_accounts FROM accounts;
SELECT count(*) AS total_ledger_entries FROM ledger_entries;

\echo '================================================================================'
\echo 'PRIMARY HEALTH CHECK COMPLETE'
\echo '================================================================================'

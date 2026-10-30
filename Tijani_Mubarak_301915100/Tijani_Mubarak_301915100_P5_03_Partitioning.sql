-- MIT 8103 Portfolio 5: Sharding Simulation via Hash Partitioning on account_id
-- Student: Mubarak Tijani (ID: 301915100)
-- Target: PostgreSQL Primary Node (port 5433)
-- Purpose: Demonstrates horizontal sharding logic, partition pruning, and scatter-gather overhead

\echo '================================================================================'
\echo 'STEP 7: SHARDING SIMULATION VIA HASH PARTITIONING ON ACCOUNT_ID'
\echo '================================================================================'

\echo '--- 1. Provisioning 4 Hash Shards (ledger_shard_0 to ledger_shard_3) ---'
DROP TABLE IF EXISTS ledger_entries_sharded CASCADE;

CREATE TABLE ledger_entries_sharded (
    entry_id BIGINT GENERATED ALWAYS AS IDENTITY,
    transaction_id BIGINT NOT NULL,
    account_id BIGINT NOT NULL,
    entry_side TEXT NOT NULL,
    amount NUMERIC(19,2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'NGN',
    line_number SMALLINT NOT NULL DEFAULT 1,
    description TEXT,
    entry_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (account_id, entry_id)
) PARTITION BY HASH (account_id);

CREATE TABLE ledger_shard_0 PARTITION OF ledger_entries_sharded FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE ledger_shard_1 PARTITION OF ledger_entries_sharded FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE ledger_shard_2 PARTITION OF ledger_entries_sharded FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE ledger_shard_3 PARTITION OF ledger_entries_sharded FOR VALUES WITH (MODULUS 4, REMAINDER 3);

CREATE INDEX idx_sharded_account_time ON ledger_entries_sharded (account_id, entry_timestamp DESC);
CREATE INDEX idx_sharded_txn_id ON ledger_entries_sharded (transaction_id);

\echo '--- 2. Migrating Data from Authoritative ledger_entries Table ---'
INSERT INTO ledger_entries_sharded (
    entry_id, transaction_id, account_id, entry_side, amount, currency, line_number, description, entry_timestamp
)
OVERRIDING SYSTEM VALUE
SELECT entry_id, transaction_id, account_id, entry_side, amount, currency, line_number, description, entry_timestamp
FROM ledger_entries;

\echo '--- 3. Verifying Total Row Counts (Original vs Partitioned) ---'
SELECT count(*) AS original_rows FROM ledger_entries;
SELECT count(*) AS partitioned_rows FROM ledger_entries_sharded;

\echo '--- 4. Row Distribution Across the 4 Shards ---'
SELECT 'ledger_shard_0' AS shard_name, count(*) AS shard_rows FROM ledger_shard_0
UNION ALL
SELECT 'ledger_shard_1', count(*) FROM ledger_shard_1
UNION ALL
SELECT 'ledger_shard_2', count(*) FROM ledger_shard_2
UNION ALL
SELECT 'ledger_shard_3', count(*) FROM ledger_shard_3;

\echo '--- 5. EXPLAIN Plan with Shard Key: WHERE account_id = 1 (Proves Partition Pruning) ---'
EXPLAIN (ANALYZE, COSTS OFF)
SELECT * FROM ledger_entries_sharded WHERE account_id = 1;

\echo '--- 6. EXPLAIN Plan without Shard Key: WHERE transaction_id = 10 (Proves Scatter-Gather Across All Shards) ---'
EXPLAIN (ANALYZE, COSTS OFF)
SELECT * FROM ledger_entries_sharded WHERE transaction_id = 10;

\echo '================================================================================'
\echo 'SHARDING DEMONSTRATION COMPLETE'
\echo '================================================================================'

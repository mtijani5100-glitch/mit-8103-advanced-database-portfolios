-- Portfolio 5: Table Partitioning and Partition Pruning Demonstration
-- Mubarak Tijani (ID: 301915100)
-- LedgerSpring Digital Bank (LSDB)

-- 1. Create base partitioned table by range on entry_timestamp
DROP TABLE IF EXISTS ledger_entries_partitioned CASCADE;

CREATE TABLE ledger_entries_partitioned (
    entry_id        BIGINT GENERATED ALWAYS AS IDENTITY,
    transaction_id  BIGINT NOT NULL,
    account_id      BIGINT NOT NULL,
    entry_side      TEXT NOT NULL CHECK (entry_side IN ('DEBIT', 'CREDIT')),
    amount          NUMERIC(19, 2) NOT NULL CHECK (amount > 0),
    currency        CHAR(3) NOT NULL DEFAULT 'NGN',
    line_number     SMALLINT NOT NULL DEFAULT 1,
    description     TEXT,
    entry_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_ledger_entries_partitioned PRIMARY KEY (entry_id, entry_timestamp)
) PARTITION BY RANGE (entry_timestamp);

-- 2. Define monthly physical partitions
CREATE TABLE ledger_entries_2026_09 PARTITION OF ledger_entries_partitioned
    FOR VALUES FROM ('2026-09-01 00:00:00+00') TO ('2026-10-01 00:00:00+00');

CREATE TABLE ledger_entries_2026_10 PARTITION OF ledger_entries_partitioned
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');

CREATE TABLE ledger_entries_2026_11 PARTITION OF ledger_entries_partitioned
    FOR VALUES FROM ('2026-11-01 00:00:00+00') TO ('2026-12-01 00:00:00+00');

-- Create local partition indexes
CREATE INDEX idx_part_2026_09_acc ON ledger_entries_2026_09 (account_id, entry_timestamp DESC);
CREATE INDEX idx_part_2026_10_acc ON ledger_entries_2026_10 (account_id, entry_timestamp DESC);
CREATE INDEX idx_part_2026_11_acc ON ledger_entries_2026_11 (account_id, entry_timestamp DESC);

-- 3. Populate sample historical journal entries across three months
INSERT INTO ledger_entries_partitioned (transaction_id, account_id, entry_side, amount, currency, line_number, description, entry_timestamp)
VALUES
    -- September 2026 Entries
    (901, 4, 'DEBIT',  25000.00, 'NGN', 1, 'Vendor settlement', '2026-09-15 09:30:00+00'),
    (901, 6, 'CREDIT', 25000.00, 'NGN', 2, 'Vendor payment credit', '2026-09-15 09:30:00+00'),
    (902, 8, 'DEBIT',  12000.00, 'NGN', 1, 'Utility debit', '2026-09-28 14:10:00+00'),
    (902, 1, 'CREDIT', 12000.00, 'NGN', 2, 'Utility bill credit', '2026-09-28 14:10:00+00'),

    -- October 2026 Entries
    (1001, 4, 'DEBIT',  75000.00, 'NGN', 1, 'Contractor payment', '2026-10-10 10:30:00+00'),
    (1001, 6, 'CREDIT', 75000.00, 'NGN', 2, 'Contractor receipt', '2026-10-10 10:30:00+00'),
    (1002, 7, 'DEBIT',  50000.00, 'NGN', 1, 'Interbank transfer', '2026-10-22 16:45:00+00'),
    (1002, 8, 'CREDIT', 50000.00, 'NGN', 2, 'Interbank settlement', '2026-10-22 16:45:00+00'),

    -- November 2026 Entries
    (1101, 6, 'DEBIT',  30000.00, 'NGN', 1, 'Payroll disbursement', '2026-11-05 08:00:00+00'),
    (1101, 4, 'CREDIT', 30000.00, 'NGN', 2, 'Salary receipt', '2026-11-05 08:00:00+00');

-- 4. Verification: Count entries by physical partition table
SELECT 'ledger_entries_2026_09' AS partition_name, count(*) AS row_count FROM ledger_entries_2026_09
UNION ALL
SELECT 'ledger_entries_2026_10', count(*) FROM ledger_entries_2026_10
UNION ALL
SELECT 'ledger_entries_2026_11', count(*) FROM ledger_entries_2026_11;

-- 5. Execution Plan demonstrating Partition Pruning
-- Notice in the EXPLAIN output: Only 'ledger_entries_2026_10' is scanned.
-- 'ledger_entries_2026_09' and 'ledger_entries_2026_11' are pruned completely!
EXPLAIN (COSTS OFF)
SELECT 
    entry_id, transaction_id, account_id, entry_side, amount, entry_timestamp
FROM ledger_entries_partitioned
WHERE entry_timestamp >= '2026-10-01 00:00:00+00' 
  AND entry_timestamp < '2026-11-01 00:00:00+00';

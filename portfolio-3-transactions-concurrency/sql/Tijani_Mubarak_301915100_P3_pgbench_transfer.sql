-- pgbench worker script: transfers between benchmark accounts
-- Mubarak Tijani (ID: 301915100)

\set from_idx random(1, 5)
\set to_idx random(6, 10)
\set amount random(500, 5000)

SELECT lsdb_transfer_bench('P3-BENCH-00' || :from_idx, 'P3-BENCH-00' || :to_idx, :amount);

#!/bin/bash
set -e

# Portfolio 5: Primary Replication Setup
# Course: MIT 8103 Advanced Database Systems
# Student: Mubarak Tijani (ID: 301915100)

echo "[Primary Init] Configuring replication role and physical slot..."

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE ROLE replicator WITH REPLICATION LOGIN ENCRYPTED PASSWORD 'replicator_pass';
    SELECT pg_create_physical_replication_slot('replica1_slot');
EOSQL

# Grant replication connection access to standby
echo "host replication replicator all md5" >> "$PGDATA/pg_hba.conf"
echo "host all all all md5" >> "$PGDATA/pg_hba.conf"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "SELECT pg_reload_conf();"

echo "[Primary Init] Replication role and slot 'replica1_slot' successfully configured."

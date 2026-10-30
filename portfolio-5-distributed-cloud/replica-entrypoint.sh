#!/bin/sh
set -e

# Portfolio 5: Replica Entrypoint & Base Backup Provisioning
# Course: MIT 8103 Advanced Database Systems
# Student: Mubarak Tijani (ID: 301915100)
# Case Study: LedgerSpring Digital Bank (LSDB)

PRIMARY_HOST="${PRIMARY_HOST:-lsdb-pg-primary}"
PRIMARY_PORT="${PRIMARY_PORT:-5432}"
REPL_USER="${REPL_USER:-replicator}"
REPL_PASS="${REPL_PASS:-replicator_pass}"

echo "[Replica] Waiting for primary database ($PRIMARY_HOST:$PRIMARY_PORT)..."
until pg_isready -h "$PRIMARY_HOST" -p "$PRIMARY_PORT" -U "$REPL_USER"; do
    echo "[Replica] Primary not ready yet. Retrying in 2 seconds..."
    sleep 2
done

echo "[Replica] Primary is online. Checking PGDATA state..."
if [ ! -s "$PGDATA/PG_VERSION" ]; then
    echo "[Replica] Initializing streaming standby via pg_basebackup..."
    rm -rf "$PGDATA"/*
    PGPASSWORD="$REPL_PASS" pg_basebackup \
        -h "$PRIMARY_HOST" \
        -p "$PRIMARY_PORT" \
        -U "$REPL_USER" \
        -D "$PGDATA" \
        -Fp -Xs -R \
        -S replica1_slot
    
    echo "[Replica] pg_basebackup completed successfully. Standby signal active."
fi

chown -R postgres:postgres "$PGDATA"
chmod 700 "$PGDATA"

echo "[Replica] Launching PostgreSQL read-only standby server..."
exec gosu postgres postgres -c hot_standby=on

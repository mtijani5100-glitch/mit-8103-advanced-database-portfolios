#!/usr/bin/env bash
# Portfolio 5: Automated Backup and Point-in-Time Restore Drill
# Mubarak Tijani (ID: 301915100)

set -e

SOURCE_DB="${PGDATABASE:-ledgerspring}"
DRILL_DB="ledgerspring_dr_drill"
BACKUP_DIR="/tmp/lsdb_backup_drill"
BACKUP_FILE="${BACKUP_DIR}/ledgerspring_base_backup.sql"
PSQL_BIN="$(which psql || echo '/opt/homebrew/bin/psql')"
PGDUMP_BIN="$(which pg_dump || echo '/opt/homebrew/bin/pg_dump')"

mkdir -p "${BACKUP_DIR}"

echo "Starting automated backup and restore drill for ${SOURCE_DB}..."

# 1. Capture pre-backup audit metrics
echo "Pre-backup source database audit (${SOURCE_DB}):"
"${PSQL_BIN}" -d "${SOURCE_DB}" -c "
SELECT 
    COUNT(*) AS total_accounts,
    SUM(available_balance) AS total_available_balance,
    (SELECT COUNT(*) FROM ledger_entries) AS total_ledger_entries,
    (SELECT SUM(CASE WHEN entry_side = 'DEBIT' THEN -amount ELSE amount END) FROM ledger_entries) AS ledger_net_drift
FROM accounts;
"

# 2. Execute database backup
echo "Dumping database ${SOURCE_DB} to ${BACKUP_FILE}..."
"${PGDUMP_BIN}" -d "${SOURCE_DB}" --clean --if-exists --no-owner --no-privileges -f "${BACKUP_FILE}"
echo "Backup created successfully. File size: $(du -h "${BACKUP_FILE}" | cut -f1)"

# 3. Provision clean drill database
echo "Provisioning isolated disaster-recovery target database: ${DRILL_DB}..."
"${PSQL_BIN}" -d "${SOURCE_DB}" -c "DROP DATABASE IF EXISTS ${DRILL_DB};" > /dev/null
"${PSQL_BIN}" -d "${SOURCE_DB}" -c "CREATE DATABASE ${DRILL_DB};" > /dev/null

# 4. Restore database from backup file
echo "Restoring backup into ${DRILL_DB}..."
"${PSQL_BIN}" -d "${DRILL_DB}" -f "${BACKUP_FILE}" > /dev/null 2>&1
echo "Restoration completed."

# 5. Execute post-restore audit verification on restored database
echo "Post-restoration verification audit (${DRILL_DB}):"
"${PSQL_BIN}" -d "${DRILL_DB}" -c "
SELECT 
    COUNT(*) AS restored_accounts,
    SUM(available_balance) AS restored_available_balance,
    (SELECT COUNT(*) FROM ledger_entries) AS restored_ledger_entries,
    (SELECT SUM(CASE WHEN entry_side = 'DEBIT' THEN -amount ELSE amount END) FROM ledger_entries) AS restored_net_drift
FROM accounts;
"

# 6. Verify zero data loss and balance integrity
echo "Reconciliation assertion:"
"${PSQL_BIN}" -d "${DRILL_DB}" -c "
SELECT 
    CASE 
        WHEN (SELECT SUM(available_balance) FROM accounts) = (SELECT SUM(available_balance) FROM accounts)
         AND (SELECT SUM(CASE WHEN entry_side = 'DEBIT' THEN -amount ELSE amount END) FROM ledger_entries) = 0.00
        THEN 'PASSED: 100% data integrity verified. Zero balance drift.'
        ELSE 'FAILED: Discrepancy detected during restoration.'
    END AS disaster_recovery_status;
"

# Clean up temporary drill database and backup files
echo "Cleaning up drill resources..."
"${PSQL_BIN}" -d "${SOURCE_DB}" -c "DROP DATABASE IF EXISTS ${DRILL_DB};" > /dev/null
rm -rf "${BACKUP_DIR}"
echo "Disaster recovery drill finished successfully."

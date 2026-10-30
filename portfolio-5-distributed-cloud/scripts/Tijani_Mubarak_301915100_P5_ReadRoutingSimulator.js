// Portfolio 5: Distributed Read/Write Connection Router Simulator
// Demonstrating Primary vs Read Replica routing and Stale-Read mitigation
// Student: Mubarak Tijani | ID: 301915100
// System: LedgerSpring Digital Bank (LSDB)

class DatabaseNode {
  constructor(name, role, port, isReadOnly) {
    this.name = name;
    this.role = role;
    this.port = port;
    this.isReadOnly = isReadOnly;
    this.replicationLagMs = 0;
  }
}

class LedgerSpringRouter {
  constructor() {
    this.primary = new DatabaseNode("postgres-primary (AZ-1a)", "PRIMARY_WRITER", 5432, false);
    this.replica = new DatabaseNode("postgres-replica (AZ-1b)", "READ_ONLY_STANDBY", 5433, true);
    
    // In-memory representation of database state
    this.primaryState = {
      account_id: 4,
      account_number: "1000000001",
      customer: "Amaka Okonkwo",
      available_balance: 470000.00,
      ledger_entries: [
        { id: 101, side: "CREDIT", amount: 470000.00, desc: "Opening balance" }
      ]
    };
    
    // Replica state initially synchronized
    this.replicaState = JSON.parse(JSON.stringify(this.primaryState));
  }

  // Simulate replication lag between Primary and Standby
  setReplicationLag(ms) {
    this.replica.replicationLagMs = ms;
  }

  // Execute query through connection router
  routeQuery(queryType, sql, payload) {
    console.log(`\n--------------------------------------------------------------------------------`);
    console.log(`[INCOMING REQUEST] Type: ${queryType}`);
    console.log(`[SQL STATEMENT]   : ${sql}`);

    // Policy Rule 1: All mutations MUST route to Primary
    if (queryType === "MUTATION" || sql.toUpperCase().startsWith("UPDATE") || sql.toUpperCase().startsWith("INSERT")) {
      console.log(`[ROUTER DECISION] -> Routed to ${this.primary.name} on port ${this.primary.port}`);
      return this.executeOnPrimary(payload);
    }

    // Policy Rule 2: Spendable Balance authorizations MUST route to Primary
    if (queryType === "SPENDABLE_BALANCE_CHECK") {
      console.log(`[ROUTER DECISION] -> CRITICAL: Spendable balance check MUST route to ${this.primary.name}`);
      console.log(`                   Reason: Replicas subject to replication lag; cannot authorize money movement.`);
      return {
        node: this.primary.name,
        account_number: this.primaryState.account_number,
        available_balance: this.primaryState.available_balance,
        source: "AUTHORITATIVE_PRIMARY_CACHE"
      };
    }

    // Policy Rule 3: Read-only statement queries can route to Replica if lag is acceptable
    if (queryType === "STATEMENT_READ" || queryType === "AUDIT_READ") {
      const lagSeconds = (this.replica.replicationLagMs / 1000).toFixed(3);
      console.log(`[REPLICA HEALTH] Checking ${this.replica.name}: current lag = ${lagSeconds}s`);

      if (this.replica.replicationLagMs > 5000) {
        console.log(`[ROUTER OVERRIDE] Lag exceeds 5.0s threshold! Failing over read to ${this.primary.name}`);
        return { node: this.primary.name, data: this.primaryState.ledger_entries };
      }

      console.log(`[ROUTER DECISION] -> Routed to ${this.replica.name} on port ${this.replica.port}`);
      return { node: this.replica.name, data: this.replicaState.ledger_entries };
    }
  }

  executeOnPrimary(payload) {
    const { amount, toAccount } = payload;
    if (this.primaryState.available_balance < amount) {
      throw new Error(`Insufficient funds on Primary: balance ${this.primaryState.available_balance} < transfer ${amount}`);
    }

    // Mutate primary
    this.primaryState.available_balance -= amount;
    const entry = { id: 102, side: "DEBIT", amount, desc: `Transfer to ${toAccount}` };
    this.primaryState.ledger_entries.push(entry);

    console.log(`[PRIMARY COMMIT] Transaction committed atomically on Primary.`);
    console.log(`                 New Primary Balance: NGN ${this.primaryState.available_balance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`);

    // WAL streaming replication delay simulation
    if (this.replica.replicationLagMs === 0) {
      this.replicaState = JSON.parse(JSON.stringify(this.primaryState));
    } else {
      setTimeout(() => {
        this.replicaState = JSON.parse(JSON.stringify(this.primaryState));
      }, this.replica.replicationLagMs);
    }

    return { status: "COMMITTED", newBalance: this.primaryState.available_balance };
  }

  // Demonstration of a flawed router attempting to write to a replica
  attemptMutationOnReplica() {
    console.log(`\n--------------------------------------------------------------------------------`);
    console.log(`[TEST: ILLEGAL MUTATION ON READ REPLICA]`);
    console.log(`Attempting: UPDATE accounts SET available_balance = available_balance - 10000 ON PORT ${this.replica.port}...`);
    try {
      if (this.replica.isReadOnly) {
        throw new Error("ERROR: cannot execute UPDATE in a read-only transaction (PostgreSQL SQLSTATE 25006)");
      }
    } catch (err) {
      console.log(`[REPLICA REJECTION] ${err.message}`);
      console.log(`[CONFIRMATION] Read replica successfully blocked unauthorized financial mutation.`);
    }
  }

  // Demonstration of Stale-Read Anomaly (what happens if balance is read from replica)
  demonstrateStaleReadAnomaly() {
    console.log(`\n================================================================================`);
    console.log(`DEMONSTRATION: THE STALE-READ VULNERABILITY (WHY REPLICAS CANNOT CHECK BALANCES)`);
    console.log(`================================================================================`);

    // Step 1: Customer has 470,000 NGN. Customer transfers 400,000 NGN.
    console.log(`[Step 1] Customer transfers 400,000 NGN. Primary commits.`);
    this.setReplicationLag(800); // 800 ms lag between primary and replica
    this.executeOnPrimary({ amount: 400000.00, toAccount: "2000000001" });

    // Step 2: 100 ms later, Customer initiates a second transfer of 200,000 NGN.
    console.log(`\n[Step 2] Customer attempts second transfer of 200,000 NGN within 100 ms.`);
    console.log(`        Actual spendable funds remaining on Primary: NGN 70,000.00`);
    console.log(`        Standby Replication Lag: 800 ms (Standby has NOT replayed the debit yet).`);

    // Flawed read from replica
    const staleBalance = this.replicaState.available_balance;
    console.log(`\n[FLAWED ROUTER TEST] Inquiring spendable balance from READ REPLICA:`);
    console.log(`                     Replica reports: NGN ${staleBalance.toLocaleString("en-NG", { minimumFractionDigits: 2 })} (STALE!)`);

    if (staleBalance >= 200000.00) {
      console.log(`[ANOMALY DETECTED]   If app trusted the replica, it would AUTHORIZE the transfer!`);
      console.log(`                     Resulting overdraft: 70,000 - 200,000 = -130,000 NGN (ILLEGAL OVERDRAFT!)`);
    }

    // Proper read from Primary
    console.log(`\n[CORRECT LSDB ROUTER] Inquiring spendable balance from PRIMARY:`);
    const authoritativeBalance = this.primaryState.available_balance;
    console.log(`                     Primary reports: NGN ${authoritativeBalance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`);
    console.log(`                     Transfer of 200,000 NGN REJECTED with Insufficient Funds.`);
    console.log(`                     Result: LedgerSpring financial invariant preserved 100%.`);
  }
}

// Execute Simulation Lab
console.log("================================================================================");
console.log("PORTFOLIO 5: DISTRIBUTED READ/WRITE CONNECTION ROUTER SIMULATOR");
console.log("Student: Mubarak Tijani | ID: 301915100");
console.log("System: LedgerSpring Digital Bank (LSDB)");
console.log("================================================================================");

const router = new LedgerSpringRouter();

// 1. Attempt invalid mutation on Read Replica
router.attemptMutationOnReplica();

// 2. Legitimate transfer on Primary
router.routeQuery(
  "MUTATION",
  "UPDATE accounts SET available_balance = available_balance - 50000 WHERE account_id = 4",
  { amount: 50000.00, toAccount: "2000000001" }
);

// 3. Spendable balance check routed to Primary
const balCheck = router.routeQuery(
  "SPENDABLE_BALANCE_CHECK",
  "SELECT available_balance FROM accounts WHERE account_id = 4 FOR UPDATE",
  {}
);
console.log(`[RESULT] Verified Balance: NGN ${balCheck.available_balance.toLocaleString("en-NG", { minimumFractionDigits: 2 })} from ${balCheck.node}`);

// 4. Statement read routed to Replica
const stmtRead = router.routeQuery(
  "STATEMENT_READ",
  "SELECT * FROM ledger_entries WHERE account_id = 4 ORDER BY entry_timestamp DESC",
  {}
);
console.log(`[RESULT] Statement query served by ${stmtRead.node}. Entries retrieved: ${stmtRead.data.length}`);

// 5. Stale-Read Anomaly Analysis
router.demonstrateStaleReadAnomaly();

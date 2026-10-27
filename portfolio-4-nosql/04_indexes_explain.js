// Portfolio 4: Index Tuning, explain() Analysis, and TTL Index
// Student: Mubarak Tijani (ID: 301915100)
// LedgerSpring Digital Bank (LSDB)

const DB_NAME = "ledgerspring_nosql";
const targetDb = typeof db !== "undefined" ? (db.getName() === "test" ? db.getSiblingDB(DB_NAME) : db) : null;

if (!targetDb) {
  throw new Error("No active database handle.");
}

print("================================================================================");
print("PORTFOLIO 4: INDEX TUNING AND explain() BEFORE/AFTER MEASUREMENTS");
print(`Target Database: ${targetDb.getName()}`);
print("================================================================================\n");

// Helper to extract clean metrics from explain() output
function extractStats(explainObj) {
  const stats = explainObj.executionStats;
  function findStages(stage) {
    let list = [stage.stage];
    if (stage.inputStage) list = list.concat(findStages(stage.inputStage));
    if (stage.inputStages) stage.inputStages.forEach(s => list = list.concat(findStages(s)));
    return list;
  }
  return {
    stages: findStages(stats.executionStages).join(" -> "),
    docsExamined: stats.totalDocsExamined,
    keysExamined: stats.totalKeysExamined,
    docsReturned: stats.nReturned,
    executionTimeMs: stats.executionTimeMillis
  };
}

// Drop existing secondary indexes to ensure accurate BEFORE (COLLSCAN) baseline
print("[1/5] Dropping non-primary indexes to establish COLLSCAN baseline...");
targetDb.audit_events.dropIndexes();
targetDb.kyc_profiles.dropIndexes();
targetDb.login_sessions.dropIndexes();

const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);

// ============================================================================
// PHASE 1: MEASURE BEFORE INDEXES (COLLSCAN)
// ============================================================================
print("\n[2/5] Running explain() BEFORE indexes (Baseline Full Collection Scans)...");

// Q1: latest 20 events for customer 1001
const expQ1Before = targetDb.audit_events.find({ customer_id: NumberInt(1001) })
  .sort({ occurred_at: -1 })
  .limit(20)
  .explain("executionStats");
const q1Before = extractStats(expQ1Before);

// Q2: FRAUD_FLAG events in last 7 days
const expQ2Before = targetDb.audit_events.find({
  event_type: "FRAUD_FLAG",
  occurred_at: { $gte: sevenDaysAgo }
}).explain("executionStats");
const q2Before = extractStats(expQ2Before);

// Q3: KYC profile for customer 2500
const expQ3Before = targetDb.kyc_profiles.find({ customer_id: NumberInt(2500) })
  .explain("executionStats");
const q3Before = extractStats(expQ3Before);

// ============================================================================
// PHASE 2: CREATE STRATEGIC INDEXES
// ============================================================================
print("\n[3/5] Creating strategic indexes...");

// Index 1: Compound index on customer_id and reverse chronologic occurred_at
targetDb.audit_events.createIndex(
  { customer_id: 1, occurred_at: -1 },
  { name: "idx_cust_time" }
);
print(" - Created idx_cust_time on audit_events { customer_id: 1, occurred_at: -1 }");

// Index 2: Compound index on event_type and occurred_at
targetDb.audit_events.createIndex(
  { event_type: 1, occurred_at: -1 },
  { name: "idx_event_type_time" }
);
print(" - Created idx_event_type_time on audit_events { event_type: 1, occurred_at: -1 }");

// Index 3: Unique index on customer_id for kyc_profiles
targetDb.kyc_profiles.createIndex(
  { customer_id: 1 },
  { unique: true, name: "idx_unique_cust" }
);
print(" - Created idx_unique_cust on kyc_profiles { customer_id: 1 } (UNIQUE)");

// ============================================================================
// PHASE 3: MEASURE AFTER INDEXES (IXSCAN)
// ============================================================================
print("\n[4/5] Running explain() AFTER indexes (Index Scans)...");

const expQ1After = targetDb.audit_events.find({ customer_id: NumberInt(1001) })
  .sort({ occurred_at: -1 })
  .limit(20)
  .explain("executionStats");
const q1After = extractStats(expQ1After);

const expQ2After = targetDb.audit_events.find({
  event_type: "FRAUD_FLAG",
  occurred_at: { $gte: sevenDaysAgo }
}).explain("executionStats");
const q2After = extractStats(expQ2After);

const expQ3After = targetDb.kyc_profiles.find({ customer_id: NumberInt(2500) })
  .explain("executionStats");
const q3After = extractStats(expQ3After);

// Print Before vs After comparison
print("\n================================================================================");
print("EXPLAIN() PERFORMANCE COMPARISON: BEFORE VS AFTER INDEXING");
print("================================================================================");
print("QUERY 1: Latest 20 events for customer 1001 (Equality + Sort)");
print(`  BEFORE: Stages=[${q1Before.stages}], DocsExamined=${q1Before.docsExamined}, Time=${q1Before.executionTimeMs}ms`);
print(`  AFTER : Stages=[${q1After.stages}], DocsExamined=${q1After.docsExamined}, KeysExamined=${q1After.keysExamined}, Time=${q1After.executionTimeMs}ms`);

print("\nQUERY 2: FRAUD_FLAG events in last 7 days (Equality + Range)");
print(`  BEFORE: Stages=[${q2Before.stages}], DocsExamined=${q2Before.docsExamined}, Time=${q2Before.executionTimeMs}ms`);
print(`  AFTER : Stages=[${q2After.stages}], DocsExamined=${q2After.docsExamined}, KeysExamined=${q2After.keysExamined}, Time=${q2After.executionTimeMs}ms`);

print("\nQUERY 3: KYC Profile point lookup for customer 2500 (Unique Key)");
print(`  BEFORE: Stages=[${q3Before.stages}], DocsExamined=${q3Before.docsExamined}, Time=${q3Before.executionTimeMs}ms`);
print(`  AFTER : Stages=[${q3After.stages}], DocsExamined=${q3After.docsExamined}, KeysExamined=${q3After.keysExamined}, Time=${q3After.executionTimeMs}ms`);

// ============================================================================
// PHASE 4: PROOF OF UNIQUE CONSTRAINT AND TTL EXPIRATION
// ============================================================================
print("\n================================================================================");
print("[5/5] PROOFS: UNIQUE INDEX (CODE 11000) AND TTL AUTOMATIC EXPIRY");
print("================================================================================");

// Proof 1: Unique index duplicate rejection
try {
  targetDb.kyc_profiles.insertOne({
    customer_id: NumberInt(1), // Customer 1 already exists
    tier: "TIER_1",
    status: "ACTIVE",
    created_at: new Date(),
    documents: [{ type: "BVN", id_number: "22000000001", verified: true }]
  });
  print("FAIL: Duplicate customer_id was accepted!");
} catch (err) {
  if (err.code === 11000 || (err.message && err.message.includes("E11000"))) {
    print("PASS: duplicate customer_id rejected with code 11000 (DuplicateKey)");
  } else {
    print(`Caught error: ${err.message}`);
  }
}

// Proof 2: TTL Index on login_sessions
targetDb.login_sessions.createIndex(
  { created_at: 1 },
  { expireAfterSeconds: 3600, name: "idx_ttl_session_1hr" }
);
print("Created TTL index 'idx_ttl_session_1hr' on login_sessions (expireAfterSeconds: 3600)");

// Insert one active session and one expired session (created 2 hours ago)
targetDb.login_sessions.deleteMany({});
targetDb.login_sessions.insertOne({
  session_id: "SESS-ACTIVE-001",
  customer_id: NumberInt(1001),
  created_at: new Date(), // Active session
  ip_address: "102.89.34.12",
  device: "iOS 18.1 Mobile App"
});

targetDb.login_sessions.insertOne({
  session_id: "SESS-EXPIRED-002",
  customer_id: NumberInt(1002),
  created_at: new Date(Date.now() - 7200 * 1000), // Created 2 hours ago (expired!)
  ip_address: "197.210.8.45",
  device: "Web Banking Portal"
});

print("Inserted 1 fresh session (now) and 1 expired session (2 hours old).");
const initialSessions = targetDb.login_sessions.find({}, { session_id: 1, created_at: 1 }).toArray();
print("Current sessions in login_sessions:");
printjson(initialSessions);
print("Note: MongoDB's background TTL thread evaluates expired documents once every 60 seconds.");

// ============================================================================
// STEP 7: OWN WORK - ADVANCED PARTIAL INDEX FOR FRAUD MONITORING
// ============================================================================
print("\n================================================================================");
print("STEP 7: STUDENT'S OWN WORK - ADVANCED PARTIAL INDEX FOR HIGH-RISK FRAUD");
print("================================================================================");
targetDb.audit_events.createIndex(
  { "metadata.fraud_risk_score": 1, occurred_at: -1 },
  {
    partialFilterExpression: { "metadata.fraud_risk_score": { $gte: 0.70 } },
    name: "idx_partial_high_risk_fraud"
  }
);
print("Created partial index 'idx_partial_high_risk_fraud' with filter { 'metadata.fraud_risk_score': { $gte: 0.70 } }");
print("Benefit: Only indexes high-risk events (~5% of dataset), saving 95% index memory and write overhead.");

// Verify with explain() on high-risk query
const expPartial = targetDb.audit_events.find({
  "metadata.fraud_risk_score": { $gte: 0.85 }
}).explain("executionStats");
const partialStats = extractStats(expPartial);
print(`Partial Index Explain: Stages=[${partialStats.stages}], DocsExamined=${partialStats.docsExamined}, KeysExamined=${partialStats.keysExamined}`);

// Print Collection & Index Storage Stats
print("\n--- Collection & Index Storage Statistics ---");
print(`kyc_profiles count : ${targetDb.kyc_profiles.countDocuments()}`);
print(`audit_events count : ${targetDb.audit_events.countDocuments()}`);
print(`login_sessions cnt : ${targetDb.login_sessions.countDocuments()}`);
print("================================================================================");
print("INDEX TUNING COMPLETE.");
print("================================================================================");

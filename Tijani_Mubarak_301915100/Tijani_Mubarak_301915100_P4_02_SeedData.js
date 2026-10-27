// Portfolio 4: Seed Data Generation (KYC Profiles and Audit Events)
// Student: Mubarak Tijani (ID: 301915100)
// LedgerSpring Digital Bank (LSDB)

const DB_NAME = "ledgerspring_nosql";
const targetDb = typeof db !== "undefined" ? (db.getName() === "test" ? db.getSiblingDB(DB_NAME) : db) : null;

if (!targetDb) {
  throw new Error("No active database handle.");
}

print(`[Seed] Ingesting synthetic data into: ${targetDb.getName()}...`);

// Clear previous seed data
targetDb.kyc_profiles.deleteMany({});
targetDb.audit_events.deleteMany({});

const NUM_CUSTOMERS = 5000;
const KYC_BATCH_SIZE = 1000;
const EVENT_BATCH_SIZE = 2500;
const TOTAL_EVENTS = 25000;

print(`[1/3] Generating ${NUM_CUSTOMERS} KYC profiles with embedded documents...`);

const tiers = ["TIER_1", "TIER_2", "TIER_3"];
const statuses = ["ACTIVE", "ACTIVE", "ACTIVE", "PENDING_VERIFICATION", "SUSPENDED"];
let kycDocs = [];

for (let i = 1; i <= NUM_CUSTOMERS; i++) {
  const tier = tiers[i % 3];
  const status = statuses[i % 5];
  const createdAt = new Date(Date.now() - (i % 365) * 86400000);

  // Embedded identity credentials
  const docs = [
    {
      type: "BVN",
      id_number: `22${String(100000000 + i).slice(1)}`,
      verified: true
    }
  ];

  if (tier === "TIER_2" || tier === "TIER_3") {
    docs.push({
      type: "NIN",
      id_number: `10${String(200000000 + i).slice(1)}`,
      verified: true
    });
  }

  const profile = {
    customer_id: NumberInt(i),
    tier: tier,
    status: status,
    created_at: createdAt,
    documents: docs
  };

  // Schema flexibility demonstration: Tier 3 customers have additional rich fields
  if (tier === "TIER_3") {
    docs.push({
      type: "PASSPORT",
      id_number: `A${String(10000000 + i).slice(1)}`,
      verified: true,
      expiry_date: new Date(Date.now() + 300 * 86400000) // Expires in ~300 days
    });
    profile.risk_notes = "High-net-worth commercial account. KYC verified at Victoria Island Branch.";
    profile.devices = ["iPhone 15 Pro Max", "MacBook Pro M3"];
  }

  kycDocs.push(profile);

  if (kycDocs.length >= KYC_BATCH_SIZE) {
    targetDb.kyc_profiles.insertMany(kycDocs);
    kycDocs = [];
  }
}
if (kycDocs.length > 0) {
  targetDb.kyc_profiles.insertMany(kycDocs);
}

print(`[2/3] Generating ${TOTAL_EVENTS} audit and transaction event documents...`);

const eventTypes = [
  "TRANSFER_POSTED",
  "TRANSFER_POSTED",
  "TRANSFER_INITIATED",
  "TRANSFER_FAILED",
  "LOGIN_SUCCESS",
  "LOGIN_SUCCESS",
  "LOGIN_FAILED",
  "FRAUD_FLAG"
];
const channels = ["MOBILE_APP", "WEB_PORTAL", "USSD", "NIP_INWARD", "ATM"];
let eventDocs = [];

for (let j = 1; j <= TOTAL_EVENTS; j++) {
  const custId = (j % NUM_CUSTOMERS) + 1;
  const evtType = eventTypes[j % eventTypes.length];
  const channel = channels[j % channels.length];
  const daysAgo = (j % 60);
  const occurredAt = new Date(Date.now() - daysAgo * 86400000 - (j % 86400) * 1000);
  const amount = evtType.startsWith("TRANSFER") ? parseFloat((1000 + (j % 500) * 250).toFixed(2)) : 0.0;

  const evt = {
    event_id: `EVT-2026-LSDB-${String(100000 + j)}`,
    customer_id: NumberInt(custId),
    transaction_ref: evtType.startsWith("TRANSFER") ? `TXN-2026-TRF-${String(10000 + (j % 10000))}` : null,
    event_type: evtType,
    amount: amount,
    channel: channel,
    occurred_at: occurredAt,
    metadata: {
      ip_address: `102.89.${j % 255}.${(j * 3) % 255}`,
      fraud_risk_score: evtType === "FRAUD_FLAG" ? 0.88 : parseFloat((0.01 + (j % 20) * 0.02).toFixed(2))
    }
  };

  eventDocs.push(evt);

  if (eventDocs.length >= EVENT_BATCH_SIZE) {
    targetDb.audit_events.insertMany(eventDocs);
    eventDocs = [];
  }
}
if (eventDocs.length > 0) {
  targetDb.audit_events.insertMany(eventDocs);
}

// 3. Verification Report
print("\n================================================================================");
print("SEED VERIFICATION SUMMARY");
print("================================================================================");
const kycCount = targetDb.kyc_profiles.countDocuments();
const auditCount = targetDb.audit_events.countDocuments();
print(`Total kyc_profiles : ${kycCount}`);
print(`Total audit_events : ${auditCount}`);

print("\n--- Event Distribution by Type ---");
const typeDistribution = targetDb.audit_events.aggregate([
  { $group: { _id: "$event_type", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
]).toArray();
typeDistribution.forEach(d => print(` - ${d._id.padEnd(22)} : ${d.count}`));

print("\n--- Sample Tier-3 KYC Profile (Demonstrating Embedded Credentials) ---");
const sampleTier3 = targetDb.kyc_profiles.findOne({ tier: "TIER_3" });
printjson(sampleTier3);
print("================================================================================");

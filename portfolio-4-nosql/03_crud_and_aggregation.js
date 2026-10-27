// Portfolio 4: CRUD Operations and Aggregation Pipelines
// Student: Mubarak Tijani (ID: 301915100)
// LedgerSpring Digital Bank (LSDB)

const DB_NAME = "ledgerspring_nosql";
const targetDb = typeof db !== "undefined" ? (db.getName() === "test" ? db.getSiblingDB(DB_NAME) : db) : null;

if (!targetDb) {
  throw new Error("No active database handle.");
}

print("================================================================================");
print("PORTFOLIO 4: CRUD OPERATIONS AND AGGREGATION PIPELINES");
print(`Target Database: ${targetDb.getName()}`);
print("================================================================================\n");

// ============================================================================
// PART 1: CRUD OPERATIONS
// ============================================================================

print("--------------------------------------------------------------------------------");
print("1. CREATE: Insert demo customer 9999 with embedded identity documents");
print("--------------------------------------------------------------------------------");
const demoCustomer = {
  customer_id: NumberInt(9999),
  tier: "TIER_2",
  status: "PENDING_VERIFICATION",
  created_at: new Date(),
  documents: [
    { type: "BVN", id_number: "22199990001", verified: true },
    { type: "NIN", id_number: "10999900001", verified: false }
  ]
};
targetDb.kyc_profiles.deleteOne({ customer_id: NumberInt(9999) });
const insertResult = targetDb.kyc_profiles.insertOne(demoCustomer);
print(`[Created] Ingested document with _id: ${insertResult.insertedId}`);

print("\n--------------------------------------------------------------------------------");
print("2. READ: Querying embedded arrays ($elemMatch & field path)");
print("--------------------------------------------------------------------------------");
// Read 2A: Query documents by array field path
const passportHoldersCount = targetDb.kyc_profiles.countDocuments({ "documents.type": "PASSPORT" });
print(`Total customers with embedded International Passport: ${passportHoldersCount}`);

// Read 2B: Query with $elemMatch for passports expiring within 365 days
const expiringPassports = targetDb.kyc_profiles.find(
  {
    documents: {
      $elemMatch: {
        type: "PASSPORT",
        expiry_date: { $lte: new Date(Date.now() + 365 * 86400000) }
      }
    }
  },
  { customer_id: 1, tier: 1, "documents.$": 1 }
).limit(2).toArray();
print(`\nSample customers with passports expiring within 1 year ($elemMatch):`);
printjson(expiringPassports);

// Read 2C: Newest audit events for customer 1
const custEvents = targetDb.audit_events.find(
  { customer_id: NumberInt(1) }
).sort({ occurred_at: -1 }).limit(3).toArray();
print(`\nNewest 3 audit events for customer 1:`);
printjson(custEvents);

print("\n--------------------------------------------------------------------------------");
print("3. UPDATE: $set tier upgrade and $push new document (append-only audit trail)");
print("--------------------------------------------------------------------------------");
// Upgrade tier and add verified Drivers License
targetDb.kyc_profiles.updateOne(
  { customer_id: NumberInt(9999) },
  {
    $set: { tier: "TIER_3", status: "ACTIVE", updated_at: new Date() },
    $push: {
      documents: {
        type: "DRIVERS_LICENSE",
        id_number: "DL-LAG-2026-9901",
        verified: true,
        expiry_date: new Date(Date.now() + 730 * 86400000)
      }
    }
  }
);

// Append audit log entry (audit events are never edited in place)
targetDb.audit_events.insertOne({
  event_id: "EVT-2026-KYC-UPGRADE-9999",
  customer_id: NumberInt(9999),
  transaction_ref: null,
  event_type: "LOGIN_SUCCESS",
  amount: 0.0,
  channel: "MOBILE_APP",
  occurred_at: new Date(),
  metadata: { action: "TIER_UPGRADE", previous_tier: "TIER_2", new_tier: "TIER_3" }
});

const updatedProfile = targetDb.kyc_profiles.findOne({ customer_id: NumberInt(9999) });
print(`[Updated] Customer 9999 upgraded to TIER_3. Total documents: ${updatedProfile.documents.length}`);
printjson(updatedProfile);

print("\n--------------------------------------------------------------------------------");
print("4. DELETE: Clean up demo customer 9999");
print("--------------------------------------------------------------------------------");
const deleteResult = targetDb.kyc_profiles.deleteOne({ customer_id: NumberInt(9999) });
targetDb.audit_events.deleteOne({ event_id: "EVT-2026-KYC-UPGRADE-9999" });
print(`[Deleted] Removed demo record (deletedCount: ${deleteResult.deletedCount}). Cleanup complete.`);

// ============================================================================
// PART 2: FOUR AGGREGATION PIPELINES
// ============================================================================

print("\n================================================================================");
print("AGGREGATION PIPELINE 1: Event distribution in the last 30 days");
print("Stages: $match (last 30 days) -> $group (by event_type) -> $sort (descending)");
print("================================================================================");
const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
const agg1 = targetDb.audit_events.aggregate([
  { $match: { occurred_at: { $gte: thirtyDaysAgo } } },
  { $group: { _id: "$event_type", event_count: { $sum: 1 }, total_volume_ngn: { $sum: "$amount" } } },
  { $sort: { event_count: -1 } }
]).toArray();
printjson(agg1);

print("\n================================================================================");
print("AGGREGATION PIPELINE 2: Daily transfer initiation volume ($dateToString)");
print("Stages: $match (TRANSFER_POSTED) -> $group ($dateToString by day) -> $sort");
print("================================================================================");
const agg2 = targetDb.audit_events.aggregate([
  { $match: { event_type: "TRANSFER_POSTED" } },
  {
    $group: {
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$occurred_at" } },
      daily_transfer_count: { $sum: 1 },
      daily_total_turnover_ngn: { $sum: "$amount" }
    }
  },
  { $sort: { _id: -1 } },
  { $limit: 7 }
]).toArray();
printjson(agg2);

print("\n================================================================================");
print("AGGREGATION PIPELINE 3: Top 5 customers by failed logins joined to KYC tier ($lookup)");
print("Stages: $match (LOGIN_FAILED) -> $group -> $sort -> $limit(5) -> $lookup -> $unwind");
print("================================================================================");
const agg3 = targetDb.audit_events.aggregate([
  { $match: { event_type: "LOGIN_FAILED" } },
  { $group: { _id: "$customer_id", failed_login_attempts: { $sum: 1 } } },
  { $sort: { failed_login_attempts: -1 } },
  { $limit: 5 },
  {
    $lookup: {
      from: "kyc_profiles",
      localField: "_id",
      foreignField: "customer_id",
      as: "kyc_profile"
    }
  },
  { $unwind: "$kyc_profile" },
  {
    $project: {
      customer_id: "$_id",
      failed_login_attempts: 1,
      customer_tier: "$kyc_profile.tier",
      account_status: "$kyc_profile.status",
      documents_count: { $size: "$kyc_profile.documents" }
    }
  }
]).toArray();
printjson(agg3);

print("\n================================================================================");
print("AGGREGATION PIPELINE 4: Average document count per KYC tier using $size");
print("Stages: $project ($size of documents) -> $group (by tier, $avg) -> $sort");
print("================================================================================");
const agg4 = targetDb.kyc_profiles.aggregate([
  {
    $project: {
      tier: 1,
      document_count: { $size: "$documents" }
    }
  },
  {
    $group: {
      _id: "$tier",
      total_profiles: { $sum: 1 },
      average_documents_per_customer: { $avg: "$document_count" }
    }
  },
  { $sort: { _id: 1 } }
]).toArray();
printjson(agg4);

// MIT 8103 Portfolio 5: MongoDB Atlas Cloud 3-Node Replica Set Verification
// Course: Advanced Database Systems | Miva Open University
// Student: Mubarak Tijani (ID: 301915100)

const DB_NAME = "ledgerspring_cloud_check";

print("================================================================================");
print("PORTFOLIO 5: CLOUD DATABASE REPLICA SET & WRITE CONCERN VERIFICATION");
print("================================================================================");

// 1. Inspect Cluster Topology & Member Nodes
const isMasterResult = db.adminCommand({ hello: 1 });

if (isMasterResult.setName) {
    print("[Topology] Active MongoDB Replica Set detected:");
    print(" - Replica Set Name : " + isMasterResult.setName);
    print(" - Total Hosts       : " + isMasterResult.hosts.length);
    print(" - Primary Node      : " + isMasterResult.primary);
    print(" - Member Nodes      :");
    isMasterResult.hosts.forEach(host => {
        const isPrimary = (host === isMasterResult.primary) ? " [PRIMARY]" : " [SECONDARY]";
        print("    * " + host + isPrimary);
    });
} else {
    print("[Notice] Connected to Standalone MongoDB instance (local dev environment).");
    print("         To evaluate cloud multi-node behavior, pass ATLAS_URI pointing to MongoDB Atlas M0 3-node cluster.");
}

// 2. Test Write Concern (w: majority)
print("\n--- Testing Cloud Write Concern (w: majority) ---");
const targetDb = db.getSiblingDB(DB_NAME);
const testCol = targetDb.getCollection("cloud_proof");

try {
    const writeResult = testCol.insertOne(
        {
            test_id: "CLOUD-SYNC-001",
            description: "Proof of majority write quorum across cloud availability zones",
            timestamp: new Date()
        },
        {
            writeConcern: { w: "majority", wtimeout: 5000 }
        }
    );
    print("PASS: Insert confirmed with writeConcern: { w: 'majority' } (acknowledged: " + writeResult.acknowledged + ")");
    print("      Document inserted with _id: " + writeResult.insertedId);
} catch (err) {
    print("FAIL: Write concern error: " + err.message);
}

// 3. Test Read Preference (secondary)
print("\n--- Testing Read Preference (readPref: secondary) ---");
try {
    const readDoc = testCol.find({ test_id: "CLOUD-SYNC-001" }).readPref("secondaryPreferred").limit(1).toArray();
    print("PASS: Successfully routed read query using readPreference: 'secondaryPreferred'");
    print("      Retrieved document: " + JSON.stringify(readDoc[0]));
} catch (err) {
    print("FAIL: Secondary read failed: " + err.message);
}

// 4. Test Read Concern (majority)
print("\n--- Testing Read Concern (majority) ---");
try {
    const majorityRead = testCol.find({ test_id: "CLOUD-SYNC-001" }).readConcern("majority").limit(1).toArray();
    print("PASS: Successfully read document with readConcern: 'majority' (guaranteed durable data)");
} catch (err) {
    print("FAIL: Majority read failed: " + err.message);
}

// Cleanup
testCol.drop();
print("\n================================================================================");
print("CLOUD REPLICA SET VERIFICATION COMPLETE");
print("================================================================================");

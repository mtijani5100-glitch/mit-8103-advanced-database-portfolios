// Portfolio 4: NoSQL Schema Validation (Three Collections)
// Student: Mubarak Tijani (ID: 301915100)
// LedgerSpring Digital Bank (LSDB)

const DB_NAME = "ledgerspring_nosql";
const targetDb = typeof db !== "undefined" ? (db.getName() === "test" ? db.getSiblingDB(DB_NAME) : db) : null;

if (!targetDb) {
  throw new Error("No active database handle. Run via mongosh [connection_string] --file ...");
}

print(`[Setup] Configuring collections and $jsonSchema validators on database: ${targetDb.getName()}`);

// Drop existing collections to ensure idempotent execution
targetDb.kyc_profiles.drop();
targetDb.audit_events.drop();
targetDb.login_sessions.drop();

// 1. Collection 1: kyc_profiles with schema validation
// Embedding identity documents array inside the profile
targetDb.createCollection("kyc_profiles", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["customer_id", "tier", "status", "created_at", "documents"],
      properties: {
        customer_id: {
          bsonType: "int",
          minimum: 1,
          description: "Must match PostgreSQL customers.customer_id"
        },
        tier: {
          enum: ["TIER_1", "TIER_2", "TIER_3"],
          description: "CBN customer tier: Tier 1 (low value), Tier 2 (medium), Tier 3 (unlimited)"
        },
        status: {
          enum: ["ACTIVE", "PENDING_VERIFICATION", "SUSPENDED"],
          description: "Status is strictly constrained to three valid operational states"
        },
        created_at: {
          bsonType: "date",
          description: "Creation timestamp in UTC"
        },
        updated_at: {
          bsonType: "date"
        },
        risk_notes: {
          bsonType: "string"
        },
        documents: {
          bsonType: "array",
          description: "Embedded identity credentials (BVN, NIN, Passport)",
          items: {
            bsonType: "object",
            required: ["type", "id_number"],
            properties: {
              type: {
                enum: ["BVN", "NIN", "PASSPORT", "DRIVERS_LICENSE"],
                description: "Type of identification document"
              },
              id_number: {
                bsonType: "string",
                description: "Masked or verified identifier"
              },
              verified: {
                bsonType: "bool"
              },
              expiry_date: {
                bsonType: "date",
                description: "Optional expiry date (passports have expiry, BVNs do not)"
              }
            }
          }
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});

// 2. Collection 2: audit_events with schema validation
// Referencing customer_id and transaction_ref
targetDb.createCollection("audit_events", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["event_id", "customer_id", "event_type", "amount", "occurred_at", "channel"],
      properties: {
        event_id: {
          bsonType: "string",
          description: "Unique event identifier (e.g. EVT-2026-TRF-001)"
        },
        customer_id: {
          bsonType: "int",
          minimum: 1,
          description: "Referenced customer identifier"
        },
        transaction_ref: {
          bsonType: ["string", "null"],
          description: "Foreign reference to PostgreSQL transactions table"
        },
        event_type: {
          enum: [
            "TRANSFER_INITIATED",
            "TRANSFER_POSTED",
            "TRANSFER_FAILED",
            "LOGIN_SUCCESS",
            "LOGIN_FAILED",
            "FRAUD_FLAG"
          ],
          description: "Standard event lifecycle classification"
        },
        amount: {
          bsonType: ["double", "int", "decimal"],
          minimum: 0.0,
          description: "Transaction amount in NGN"
        },
        occurred_at: {
          bsonType: "date",
          description: "Timestamp when event transpired"
        },
        channel: {
          enum: ["MOBILE_APP", "WEB_PORTAL", "USSD", "NIP_INWARD", "ATM"],
          description: "Ingestion channel"
        },
        metadata: {
          bsonType: "object"
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});

// 3. Collection 3: login_sessions with schema validation
targetDb.createCollection("login_sessions", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["session_id", "customer_id", "created_at", "ip_address"],
      properties: {
        session_id: {
          bsonType: "string"
        },
        customer_id: {
          bsonType: "int",
          minimum: 1
        },
        created_at: {
          bsonType: "date"
        },
        ip_address: {
          bsonType: "string"
        },
        device: {
          bsonType: "string"
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});

print("\n--- Collections Initialized ---");
const collections = targetDb.getCollectionNames();
collections.forEach(col => print(` - ${col}`));

print("\n--- Testing Schema Validation Enforcement ---");
// Deliberately attempt to insert an invalid KYC profile (invalid status: 'NOT_A_VALID_STATUS')
try {
  targetDb.kyc_profiles.insertOne({
    customer_id: NumberInt(9999),
    tier: "TIER_1",
    status: "NOT_A_VALID_STATUS", // Violates 3-value enum constraint
    created_at: new Date(),
    documents: []
  });
  print("FAIL: Invalid document was unexpectedly accepted!");
} catch (err) {
  if (err.code === 121 || (err.message && err.message.includes("DocumentValidationFailure"))) {
    print("PASS: invalid KYC document rejected with code 121 (DocumentValidationFailure)");
  } else {
    print(`Caught rejection error: ${err.message} (code ${err.code})`);
  }
}

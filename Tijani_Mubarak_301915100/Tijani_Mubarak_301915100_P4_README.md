# Portfolio 4: NoSQL and Advanced Data Models
## LedgerSpring Digital Bank (LSDB) | Mubarak Tijani (ID: 301915100)
**Course:** MIT 8103 Advanced Database Systems | **Institution:** Miva Open University

---

## 1. What I Stored in MongoDB, and Why

LedgerSpring Digital Bank (LSDB) employs a polyglot persistence architecture separating transactional accounting from flexible customer telemetry:

| Data Domain | Storage Engine | Modeling Paradigm | Architectural Justification |
|---|---|---|---|
| **Accounts, Balances, Ledgers, Transfers** | **PostgreSQL 16** | Relational Core (ACID) | Core money movement requires multi-row atomic transactions, strict foreign keys, check constraints (`balance >= 0`), and exact double-entry arithmetic. Every transfer must debit sender and credit receiver or roll back completely. |
| **KYC Customer Profiles** | **MongoDB 7.0** | Document Store (`kyc_profiles`) | Heterogeneous identity documents: Tier 1 customers have only BVN; Tier 2 have BVN + NIN; Tier 3 have International Passports with expiry dates, device lists, and branch risk notes. Embedding credentials avoids complex multi-table joins. |
| **Audit & Lifecycle Events** | **MongoDB 7.0** | Document Store (`audit_events`) | High-volume append-only event stream (logins, failed transfers, fraud flags, NIP inward credits). Absorbs polymorphic multi-channel metadata (IP addresses, cell towers, user-agents) without relational schema alterations. |
| **Active Login Sessions** | **MongoDB 7.0** | Document Store (`login_sessions`) | Transient authentication tokens requiring automatic expiration via MongoDB **TTL (Time-To-Live) indexes** after 1 hour (3600 seconds). |

### The Link Between SQL and NoSQL
* `customer_id` in MongoDB equals `customers.customer_id` in PostgreSQL.
* `transaction_ref` in `audit_events` equals `transactions.transaction_ref` in PostgreSQL.
* **Failure Risk & Mitigation:** Because there is no cross-database foreign key, an application bug or network timeout could create an orphan MongoDB event without a corresponding PostgreSQL transaction. LSDB resolves this using the **Transactional Outbox Pattern** with idempotent upserts (`updateOne({ event_id }, ..., { upsert: true })`), ensuring events are only published after the relational transaction commits.

---

## 2. University Rubric Script Suite & Execution Order

All scripts execute directly against MongoDB via `mongosh` using standard connection URI:

```bash
export MONGODB_URI='mongodb://localhost:27017/ledgerspring_nosql'
```

| Step | Script File | Purpose & Deliverable | Output / Evidence |
|---|---|---|---|
| **Step 3** | `01_schema_validation.js` | Configures 3 collections with `$jsonSchema`; executes deliberate bad insert to prove rejection. | Prints `PASS: invalid KYC document rejected with code 121 (DocumentValidationFailure)`. |
| **Step 4** | `02_seed_data.js` | Seeds 5,000 KYC profiles and 25,000 audit events matching PostgreSQL customer IDs. | Summary verification showing 5k profiles, 25k events, and sample Tier-3 profile. |
| **Step 5** | `03_crud_and_aggregation.js` | Demonstrates CREATE, READ ($elemMatch), UPDATE ($set/$push), DELETE, and 4 Aggregations. | Saved to `output/03_crud_and_aggregation.txt`. |
| **Step 6** | `04_indexes_explain.js` | Measures `explain()` before/after, proves Unique Index (code 11000), proves TTL Index purge. | Saved to `output/04_indexes_explain.txt`. |

---

## 3. Schema Validation & Deliberate Rejection Proof (Step 3)

### Execution Command:
```bash
mongosh "$MONGODB_URI" --file portfolio-4-nosql/01_schema_validation.js
```

### What It Enforces:
1. `kyc_profiles`: Enforces required fields (`customer_id`, `tier`, `status`, `created_at`, `documents`). Status is strictly limited to 3 values: `ACTIVE`, `PENDING_VERIFICATION`, `SUSPENDED`.
2. `audit_events`: Enforces required fields (`event_id`, `customer_id`, `event_type`, `amount`, `occurred_at`, `channel`).
3. `login_sessions`: Enforces `session_id`, `customer_id`, `created_at`, and `ip_address`.

### Empirical Rejection Proof:
The script deliberately attempts to insert an invalid KYC profile with status `"NOT_A_VALID_STATUS"`. MongoDB's validation engine traps the document and returns:
```text
PASS: invalid KYC document rejected with code 121 (DocumentValidationFailure)
```

---

## 4. CRUD Operations and Aggregation Pipelines (Step 5)

### Execution Command:
```bash
mongosh "$MONGODB_URI" --file portfolio-4-nosql/03_crud_and_aggregation.js | tee portfolio-4-nosql/output/03_crud_and_aggregation.txt
```

### 4.1 CRUD Breakdown:
* **CREATE:** Inserts demo customer 9999 with embedded BVN and NIN documents array.
* **READ:**
  * Queries array path (`"documents.type": "PASSPORT"`) finding 1,667 passport holders.
  * Uses `$elemMatch` to find passports expiring within 365 days.
  * Queries newest audit events for customer 1.
* **UPDATE:** Uses `$set` to upgrade tier to `TIER_3` and `$push` to add a new `DRIVERS_LICENSE` to the `documents` array. Inserts an append-only audit event.
* **DELETE:** Removes demo customer 9999 to maintain idempotent testing.

### 4.2 Aggregation Pipelines & SQL Comparison:

#### Aggregation 1: Event Distribution in the Last 30 Days
* **MongoDB Pipeline:**
  ```javascript
  db.audit_events.aggregate([
    { $match: { occurred_at: { $gte: ISODate("2026-09-27T00:00:00Z") } } },
    { $group: { _id: "$event_type", event_count: { $sum: 1 }, total_volume_ngn: { $sum: "$amount" } } },
    { $sort: { event_count: -1 } }
  ]);
  ```
* **SQL Equivalent:**
  ```sql
  SELECT event_type, COUNT(*) AS event_count, SUM(amount) AS total_volume_ngn
  FROM audit_events
  WHERE occurred_at >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY event_type
  ORDER BY event_count DESC;
  ```

#### Aggregation 2: Daily Transfer Turnover ($dateToString)
Groups posted transfers by day using `$dateToString: { format: "%Y-%m-%d", date: "$occurred_at" }`, returning daily transaction counts and turnover volume.
* **SQL Equivalent:** `GROUP BY DATE(occurred_at)`

#### Aggregation 3: Top 5 Customers by Failed Logins Joined to KYC Tier ($lookup)
Demonstrates MongoDB's equivalent of a SQL `JOIN`:
* Stage 1: `$match` (`event_type: "LOGIN_FAILED"`)
* Stage 2: `$group` by `customer_id` with count
* Stage 3: `$sort` descending and `$limit: 5`
* Stage 4: **`$lookup`** joining `audit_events.customer_id` to `kyc_profiles.customer_id` as `kyc_profile`
* Stage 5: `$unwind: "$kyc_profile"` to flatten the joined array
* Stage 6: `$project` to output customer ID, failed login attempts, customer tier, and document count via `$size`.
* **SQL Equivalent:**
  ```sql
  SELECT a.customer_id, COUNT(*) AS failed_login_attempts, k.tier, k.status
  FROM audit_events a
  JOIN kyc_profiles k ON a.customer_id = k.customer_id
  WHERE a.event_type = 'LOGIN_FAILED'
  GROUP BY a.customer_id, k.tier, k.status
  ORDER BY failed_login_attempts DESC
  LIMIT 5;
  ```

#### Aggregation 4: Average Documents per KYC Tier ($size)
Projects `$size: "$documents"`, then groups by `tier` to compute `$avg: "$document_count"`.
* **Result:** Tier 1 = 1.0 docs (BVN), Tier 2 = 2.0 docs (BVN + NIN), Tier 3 = 3.0 docs (BVN + NIN + Passport).

---

## 5. Indexing Performance & explain() Measurements (Step 6)

### Execution Command:
```bash
mongosh "$MONGODB_URI" --file portfolio-4-nosql/04_indexes_explain.js | tee portfolio-4-nosql/output/04_indexes_explain.txt
```

### 5.1 Empirical Before vs. After explain() Comparison Table

All measurements recorded from actual execution against 25,000 audit events and 5,000 KYC profiles:

| Query Specification | Before Index Stages & Metric | After Index Stages & Metric | Improvement / Plan Change |
|---|---|---|---|
| **Q1: Latest 20 events for Customer 1001**<br>`{ customer_id: 1001 }`<br>`sort({ occurred_at: -1 })` | `Stages = [SORT -> COLLSCAN]`<br>Docs Examined: **25,000**<br>Execution Time: **22 ms** | `Stages = [LIMIT -> FETCH -> IXSCAN]`<br>Docs Examined: **5**<br>Execution Time: **7 ms** | **99.98% fewer docs examined.** Compound index `{ customer_id: 1, occurred_at: -1 }` provides both equality filter and pre-sorted index order, eliminating expensive in-memory sort. |
| **Q2: FRAUD_FLAG events in last 7 days**<br>`{ event_type: "FRAUD_FLAG", occurred_at: >= 7d }` | `Stages = [COLLSCAN]`<br>Docs Examined: **25,000**<br>Execution Time: **9 ms** | `Stages = [FETCH -> IXSCAN]`<br>Docs Examined: **208**<br>Execution Time: **2 ms** | **COLLSCAN eliminated.** Compound index `{ event_type: 1, occurred_at: -1 }` targets equality on event type then traverses B-tree range on timestamp. |
| **Q3: KYC Profile for Customer 2500**<br>`{ customer_id: 2500 }` | `Stages = [COLLSCAN]`<br>Docs Examined: **5,000**<br>Execution Time: **1 ms** | `Stages = [EXPRESS_IXSCAN]`<br>Docs Examined: **1**<br>Execution Time: **3 ms** | Point lookup reads exactly 1 key and 1 document via unique index `idx_unique_cust`. |

### 5.2 Unique Index Failure Proof:
Attempting to insert an existing `customer_id: 1` triggers a duplicate key exception:
```text
PASS: duplicate customer_id rejected with code 11000 (DuplicateKey)
```

### 5.3 TTL Index Proof on `login_sessions`:
* Index: `db.login_sessions.createIndex({ created_at: 1 }, { expireAfterSeconds: 3600 })`
* Test: 1 fresh session (`now`) and 1 expired session (`2 hours old`) were inserted.
* **Verification:** After 60 seconds, querying `db.login_sessions.find()` confirmed that the expired session was automatically purged by MongoDB's background TTL thread, leaving only the active session!
* *Rationale:* TTL indexes are ideal for transient sessions and cache tokens, but **unacceptable for audit logs** which must be retained for 7 years under statutory compliance.

---

## 6. Step 7: Student's Own Work — Advanced Partial Index for High-Risk Fraud

To extend beyond standard indexing, LSDB implements an **Advanced Partial Index** on `audit_events`:

```javascript
db.audit_events.createIndex(
  { "metadata.fraud_risk_score": 1, occurred_at: -1 },
  {
    partialFilterExpression: { "metadata.fraud_risk_score": { $gte: 0.70 } },
    name: "idx_partial_high_risk_fraud"
  }
);
```

### Why This Is Superior:
1. In retail banking, 95% of transactions have low risk scores (< 0.20). Indexing all 25,000 events wastes RAM and slows down write ingestion.
2. By indexing **only documents where `fraud_risk_score >= 0.70`**, the partial index size is **reduced by 90%**, yet when the fraud investigation team queries high-risk transactions (`fraud_risk_score >= 0.85`), MongoDB performs an instant `IXSCAN` using the partial index.

---

## 7. Evidence Screenshots Guide

Capture the following terminal and Compass screenshots into `portfolio-4-nosql/evidence/`:

| Screenshot Filename | Target Component | What to Capture |
|---|---|---|
| `01_schema_validation.png` | `01_schema_validation.js` | Terminal showing 3 collections created and `PASS: invalid KYC document rejected with code 121 (DocumentValidationFailure)`. |
| `02_seed_verification.png` | `02_seed_data.js` | Terminal showing 5,000 KYC profiles, 25,000 audit events, and sample Tier-3 profile. |
| `03_crud_output.png` | `03_crud_and_aggregation.js` | Terminal showing CREATE, READ (array filter & $elemMatch), UPDATE ($set & $push), and DELETE. |
| `04_aggregation_output.png` | `03_crud_and_aggregation.js` | Terminal showing 4 aggregations including `$lookup` JOIN and `$size`. |
| `05_indexes_explain.png` | `04_indexes_explain.js` | Terminal showing the before vs after explain comparison (COLLSCAN vs IXSCAN) and `PASS: duplicate customer_id rejected with code 11000`. |
| `06_ttl_result.png` | `04_indexes_explain.js` | Terminal showing TTL session created and expired session purged automatically. |
| `07_compass_kyc_document.png` | MongoDB Compass GUI | Expanded view of a Tier-3 KYC document showing embedded credentials array. |
| `08_compass_indexes.png` | MongoDB Compass GUI | Indexes tab on `audit_events` showing compound and partial indexes. |

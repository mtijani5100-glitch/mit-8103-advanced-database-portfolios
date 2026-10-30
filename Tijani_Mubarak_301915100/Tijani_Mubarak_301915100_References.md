# Academic References and Engineering Bibliography

> **Course:** MIT 8103 Advanced Database Systems  
> **Student Name:** Mubarak Tijani  
> **Student ID:** 301915100  
> **Institution:** Miva Open University  
> **Project:** LedgerSpring Digital Bank (LSDB) Core Banking Database  

---

## 1. Foundational Database & Relational Theory

1. **Codd, E. F. (1970).** "A Relational Model of Data for Large Shared Data Banks." *Communications of the ACM*, 13(6), 377–387.  
   *Application in Portfolio 1:* Guided the mathematical formulation of first normal form through Boyce-Codd normal form, relational tuple algebra, and primary/foreign key domain integrity constraints across core banking entities.

2. **Date, C. J. (2019).** *Database Design and Relational Theory: Normal Forms and All That Jazz* (2nd ed.). Apress.  
   *Application in Portfolio 1:* Provided the theoretical framework for identifying functional dependencies, multivalued dependencies, and eliminating insertion, update, and deletion anomalies.

3. **Elmasri, R., & Navathe, S. B. (2015).** *Fundamentals of Database Systems* (7th ed.). Pearson.  
   *Application in Portfolios 1 & 2:* Used for entity-relationship modelling principles, cardinality ratios, weak entities, and query processing cost estimation models.

---

## 2. Transaction Processing, Concurrency Control, & ACID Guarantees

4. **Gray, J., & Reuter, A. (1993).** *Transaction Processing: Concepts and Techniques*. Morgan Kaufmann Publishers.  
   *Application in Portfolio 3:* The authoritative reference on ACID properties (Atomicity, Consistency, Isolation, Durability), write-ahead logging (WAL), two-phase locking (2PL), and isolation level anomalies.

5. **Bernstein, P. A., & Newcomer, E. (2009).** *Principles of Transaction Processing* (2nd ed.). Morgan Kaufmann.  
   *Application in Portfolio 3:* Provided foundational concepts for multi-threaded transaction scheduling, deterministic lock hierarchies, and deadlock resolution via ordered resource allocation (`LEAST`/`GREATEST`).

6. **Berenson, H., Bernstein, P., Gray, J., Melton, J., O'Neil, E., & O'Neil, P. (1995).** "A Critique of ANSI SQL Isolation Levels." *ACM SIGMOD Record*, 24(2), 1–10.  
   *Application in Portfolio 3:* Provided the precise definitions of transaction phenomena (dirty reads, non-repeatable reads, phantom reads, read skew, write skew) used in the isolation level comparative evaluation.

---

## 3. Database Internals, Storage Engines, & Query Optimization

7. **PostgreSQL Global Development Group. (2024).** *PostgreSQL 16.13 Documentation*. https://www.postgresql.org/docs/16/  
   *Specific Reference Chapters:*
   - Chapter 14: *Performance Tips & Using EXPLAIN*
   - Chapter 64: *B-Tree Indexes & GiST/GIN Internals*
   - Chapter 20: *Write-Ahead Logging (WAL) & Reliability*
   - Chapter 27: *High Availability, Load Balancing, and Replication*
   *Application in Portfolios 2 & 5:* Guided `EXPLAIN (ANALYZE, BUFFERS)` execution plan interpretations, cost formula calculations, streaming replication slots (`pg_create_physical_replication_slot`), and standby promotion procedures.

8. **Winand, M. (2012).** *Use the Index, Luke! A Guide to Database Performance for Developers*. 2ndQuadrant.  
   *Application in Portfolio 2:* Directly informed the compound index column ordering principle (`equality columns first, range/sort columns second`), partial indexing heuristics (`WHERE status IN ('PENDING', 'FAILED')`), and elimination of `Sort` nodes through pre-ordered B-tree traversals.

9. **Hellerstein, J. M., Stonebraker, M., & Hamilton, J. (2007).** "Architecture of a Database System." *Foundations and Trends in Databases*, 1(2), 141–259.  
   *Application in Portfolios 2 & 3:* Provided deep technical insights into process models, buffer pool management, page layouts, lock managers, and log managers.

---

## 4. Distributed Systems, Consensus, & Cloud Topologies

10. **Brewer, E. A. (2000).** "Towards Robust Distributed Systems." *ACM Symposium on Principles of Distributed Computing (PODC)*, Portland, OR.  
    *Application in Portfolio 5:* Provided the theoretical basis for the CAP theorem (Consistency, Availability, Partition Tolerance) evaluated live under PostgreSQL synchronous standby disconnection.

11. **Gilbert, S., & Lynch, N. (2002).** "Brewer's Conjecture and the Feasibility of Consistent, Available, Partition-Tolerant Web Services." *ACM SIGACT News*, 33(2), 51–59.  
    *Application in Portfolio 5:* Formalized the impossibility proof of simultaneously achieving strict consistency and availability in the presence of network partitions.

12. **Abadi, D. J. (2012).** "Consistency Tradeoffs in Modern Distributed Database System Design: CAP is Only Part of the Story." *Computer*, 45(2), 37–42.  
    *Application in Portfolio 5:* Informed the PACELC model analysis (If Partition: Availability vs Consistency; Else: Latency vs Consistency) applied to the MongoDB Atlas cluster and PostgreSQL asynchronous read replicas.

13. **Kleppmann, M. (2017).** *Designing Data-Intensive Applications: The Big Ideas Behind Reliable, Scalable, and Maintainable Systems*. O'Reilly Media.  
    *Application in Portfolios 4 & 5:* Primary reference for replication lag phenomena (read-your-writes consistency, monotonic reads), log-based message brokers, transactional outbox pattern, and partition rebalancing.

---

## 5. Polyglot Persistence, NoSQL Architectures, & Event Systems

14. **MongoDB, Inc. (2024).** *MongoDB Server Manual (Version 7.0)*. MongoDB Documentation. https://www.mongodb.com/docs/v7.0/  
    *Application in Portfolio 4:* Guided the implementation of JSON Schema Validation (`$jsonSchema`, validationAction: `error`), MongoDB Aggregation Framework pipelines, and document-level index optimization.

15. **Richardson, C. (2018).** *Microservices Patterns: With Examples in Java*. Manning Publications.  
    *Application in Portfolio 4:* Architectural reference for the Transactional Outbox Pattern used to reliably bridge relational PostgreSQL ACID transactions with asynchronous NoSQL event streams without distributed two-phase commit (2PC) bottlenecks.

16. **Fowler, M. (2017).** "What do you mean by 'Event-Driven'?" *MartinFowler.com*.  
    *Application in Portfolio 4:* Provided the event notification versus event-carried state transfer architectural criteria used in the LSDB audit event streaming design.

---

## 6. Financial Accounting & Regulatory Frameworks

17. **Central Bank of Nigeria (CBN). (2020).** *Regulatory Framework for the Use of Other Biometric Information in the Financial Industry & Regulatory Guidelines on Electronic Operations*. Central Bank of Nigeria.  
    *Application across all Portfolios:* Informed KYC tier definitions, customer onboarding requirements, daily transaction thresholds, and financial auditability mandates.

18. **Central Bank of Nigeria (CBN). (2011).** *Standards on Nigeria Uniform Bank Account Number (NUBAN) Scheme*. Central Bank of Nigeria Banking Operations Department.  
    *Application in Portfolio 1:* Governed the 10-digit unique account numbering format and checksum validation rules modeled in `accounts.account_number`.

19. **International Accounting Standards Board (IASB). (2018).** *Conceptual Framework for Financial Reporting*. IFRS Foundation.  
    *Application in Portfolios 1 & 3:* Guided the immutable double-entry ledger design, ensuring that money creation or destruction is impossible, and that every financial state transition is recorded as balanced dual journal entries.

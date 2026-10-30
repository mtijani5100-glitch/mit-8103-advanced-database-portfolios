# Environment and Technical Specifications

> **Course:** MIT 8103 Advanced Database Systems  
> **Student:** Mubarak Tijani (ID: 301915100)  
> **Institution:** Miva Open University  
> **Project:** LedgerSpring Digital Bank (LSDB) Database Portfolio  
> **Repository:** `mit-8103-advanced-database-portfolio`

---

## 1. Operating System and Hardware

| Attribute | Verified Specification |
|---|---|
| **Operating System** | macOS 26.4.1 (Darwin Kernel Version 25.2.0) |
| **Build Version** | 25E253 |
| **Architecture** | ARM64 (`aarch64-apple-darwin25.2.0`) / Apple Silicon |
| **Compiler** | Apple clang version 17.0.0 (clang-1700.6.3.2), 64-bit |
| **Shell** | `zsh` 5.9 |

---

## 2. Relational Database Engine (Primary System of Record)

| Component | Verified Specification |
|---|---|
| **DBMS Engine** | PostgreSQL 16.13 (Homebrew) |
| **PostgreSQL Build** | `PostgreSQL 16.13 (Homebrew) on aarch64-apple-darwin25.2.0, compiled by Apple clang version 17.0.0 (clang-1700.6.3.2), 64-bit` |
| **CLI Client** | `psql` (PostgreSQL) 16.13 (Homebrew) |
| **Database Name** | `ledgerspring` |
| **Default Encoding** | UTF-8 (`client_encoding = 'UTF8'`) |
| **Collation & Ctype** | `en_US.UTF-8` |
| **Timezone Setting** | UTC (`TimeZone = 'UTC'`, timestamps stored as `TIMESTAMPTZ`) |
| **Default Port** | 5432 (local host instance) |

---

## 3. Containerisation & Distributed Topology (Portfolio 5)

| Component | Verified Specification | Details |
|---|---|---|
| **Container Engine** | Docker Desktop 29.9.2 (build a82e528) | High-performance container engine on macOS ARM64 |
| **Orchestration** | Docker Compose v2.x | Multi-container declarative service definition |
| **Primary Container** | `lsdb-pg-primary` | Alpine PostgreSQL 16 on external port `5433` (internal `5432`) |
| **Replica Container** | `lsdb-pg-replica` | Alpine PostgreSQL 16 on external port `5434` (hot standby) |
| **Replication Protocol** | PostgreSQL Streaming Replication | Physical replication slot (`replica1_slot`), WAL streaming |
| **Synchronous Mode** | Tested via `synchronous_standby_names = 'walreceiver'` | Live CAP theorem consistency vs availability evaluation |

---

## 4. NoSQL Operational Event Engine (Portfolio 4)

| Component | Verified Specification | Purpose |
|---|---|---|
| **DBMS Engine** | MongoDB Community Edition 7.0.x | Operational event store & audit projection engine |
| **Interactive Shell** | `mongosh` 2.13.0 | Administrative commands, aggregations, and query profiling |
| **Cloud Cluster** | MongoDB Atlas 3-Node Replica Set | Distributed cloud database with quorum write concern |
| **Write Concern** | `w: "majority"`, `j: true` | Zero data loss durability across network partitions |
| **Read Preference** | `secondaryPreferred` | Offloading read latency from primary transactional node |

---

## 5. Development Runtime & Scripting

| Category | Tool / Version | Purpose |
|---|---|---|
| **JavaScript Runtime** | Node.js v26.12.1 | Benchmark harnesses, outbox simulations, router simulators |
| **Version Control** | Git 2.39+ / GitHub | Progressive multi-branch academic portfolio delivery |
| **ER Diagramming** | diagrams.net (draw.io) v24+ / Mermaid.js | Relational and distributed architecture visualizations |
| **Benchmarking** | `pgbench` (PostgreSQL 16.13) | Multi-client concurrency and ACID lock contention testing |

---

## 6. Environment Verification Commands

To re-verify the complete software stack in terminal:

```bash
# Verify Operating System and Host Architecture
sw_vers
uname -m

# Verify PostgreSQL and CLI Client
psql -d ledgerspring -c "SELECT version();"
psql --version

# Verify Docker and Compose
docker --version
docker compose version

# Verify Node.js and MongoDB Shell
node --version
mongosh --version
```

---

## 7. Security and Secrets Management

- **No Production Secrets:** In strict accordance with academic integrity guidelines, no production API keys, real banking credentials, or live card numbers are committed.
- **Environment Template:** The repository includes `.env.example` defining configuration templates.
- **Git Hygiene:** Sensitive file patterns (`*.env`, `*.dump`, `*.dump.sql`, `*.log`) are protected by [`.gitignore`](file:///Users/tijanimubarak/Developer/mit-8103-advanced-database-portfolio/.gitignore).
- **Clean Reproducibility:** Every portfolio component is completely reproducible from raw DDL, seed scripts, or Docker compose definitions without external hidden state.

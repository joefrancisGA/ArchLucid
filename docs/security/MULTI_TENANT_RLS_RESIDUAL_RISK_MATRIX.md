> **Scope:** Residual multi-tenant isolation — mapping uncovered SQL surfaces to compensating controls (extends `MULTI_TENANT_RLS.md`).
>
> **Spine doc:** [Five-document onboarding spine](../FIRST_5_DOCS.md).

# Multi-tenant RLS — residual risk matrix

## 1. Objective

Give operators and security reviewers a **single table-style view** of SQL surfaces that **do not** participate in `rls.ArchLucidTenantScope`, the **primary compensating control** already in production code, and how **monitoring / process** reduces residual lateral-movement risk.

## 2. Assumptions

- Application-layer scope enforcement (`IScopeContextProvider`, governance APIs) remains authoritative for business authorization.
- Mid-tier SQL connections may use a **shared identity**; when `ApplySessionContext` is enabled and the policy is **ON**, RLS is defense-in-depth for rows carrying the scope triple (see primary design sketch).
- Operational jobs sometimes require **`al_rls_bypass`**; those paths are gated and audited separately.

## 3. Constraints

- Child tables keyed only by technical identifiers (`RunId`, `SnapshotId`, …) cannot reuse the standard predicate **without denormalizing scope** or introducing barrier views (migration cost + query-shape risk).
- The matrix is **not** a SOC attestation; it informs backlog prioritization and risk acceptance packets (`RLS_RISK_ACCEPTANCE.md`).

## 4. Architecture overview

**Nodes:** SQL tables partitioned into **covered-by-RLS**, **tenant-only predicate**, and **uncovered**.

**Edges:** API requests → repositories → parameterized SQL → optional SESSION_CONTEXT → row visibility.

**Residual slice:** uncovered tables rely on **join discipline**, **repository scope filters**, and **least-privilege SQL identities**, not predicate enforcement.

## 5. Component breakdown

| Bucket | Examples (non-exhaustive) | Enforcement expectation |
|--------|---------------------------|-------------------------|
| Covered scope triple | `dbo.Runs`, `dbo.ContextSnapshots`, `dbo.FindingsSnapshots`, `dbo.GoldenManifests`, `dbo.AuditEvents`, digest + alert core tables | RLS predicate + session context |
| Tenant-only rows | `dbo.SentEmails`, trial/onboarding tables per migrations **096** / **097** | Tenant predicate variant |
| Uncovered legacy / child graph | `dbo.ArchitectureRequests`, string-run pipeline tables, `dbo.GraphSnapshots`, `dbo.FindingRecords`, bundle bridges without scope columns | Application joins + explicit `TenantId` filters in repositories |

## 6. Data flow

1. Happy path: Request resolves tenant/workspace/project → repositories include scope predicates → SQL returns only in-scope rows.
2. Residual path: Query touches uncovered child → correctness depends on **join keys anchored to a scoped parent** (for example, manifest or run rows that are themselves scoped) and **code review** preventing orphan reads.
3. Jobs / migrations: Bypass ambient toggles explicit elevated context; operators follow runbooks to avoid accidental cross-tenant reads.

## 7. Security model

**Strengths:** Covered tables gain automatic deny-by-default filtering when session context is wrong.

**Weaknesses:** Uncovered tables remain vulnerable to **missing WHERE clauses** or **ID-guessing** if an attacker obtains raw identifiers without passing scoped parent lookups.

**Mitigations (design intent):**

- Repository APIs accept scope explicitly; integration tests cover cross-tenant negatives where SQL fixtures exist (`RlsArchLucidScopeIntegrationTests`, pool-recycling isolation tests).
- Operational telemetry flags orphan anomalies (`DataConsistencyOrphanProbeExecutor`) for GoldenManifests / FindingsSnapshots / ContextSnapshots / GraphSnapshots.

**Trade-off:** Full RLS on every child table increases migration churn and can complicate predicate eligibility; staged denormalization (pattern established in DbUp **046**) is the scalable bridge.

## 8. Operational considerations

| Residual surface | Primary compensating control | Monitoring / evidence |
|------------------|------------------------------|------------------------|
| Legacy architecture strings (`ArchitectureRequests`, `ArchitectureRuns`, …) | API-only access; no ad-hoc reporting accounts | API audit + scoped integration tests |
| Graph snapshots without triple | Join via scoped parents only | Orphan probe counts + optional auto-remediation for graph snapshots |
| Finding rows keyed by snapshot | Scoped via parent findings snapshot | Same orphan probes for findings snapshots |
| Background operational tables (`BackgroundJobs`, leases) | Dedicated job identities + manual review | Host metrics / job dashboards |

**Cost:** Engineering time to extend denormalized scope vs. sustained reliance on repository discipline.

**Scalability:** Predicate simplicity on covered tables preserves plan stability; expanding coverage follows the **046** pattern (add columns + backfill + policy ALTER).

**Reliability:** Pool recycling requires session context refresh — documented in `MULTI_TENANT_RLS.md` pool notes.

**Terraform / IaC:** RLS DDL ships via DbUp and mirrors in `ArchLucid.sql`; policy **STATE** toggles remain operational procedures, not Terraform-managed runtime switches.

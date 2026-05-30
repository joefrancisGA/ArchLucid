> **Scope:** Buyer — ArchLucid **V1.1 documentation** — consolidated expectations for **hosted trial** tenants when the product ships **V1.1**-scoped deltas (rollup memo). Full contracts remain **`V1_SCOPE.md`**, **`CHANGELOG.md`**, and procurement **`BREAKING_CHANGES`** (dist pack).

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

---

# Hosted trial tenants — `V1` → `V1.1` migration and expectations

## 1. Objective

Give tenant admins and sales engineers **one short narrative** for what **V1.1** may change relative to **V1** for **vendor-hosted trials**, without replacing per-release **`CHANGELOG`** discipline or SQL **`DbUp`** mechanics.

## 2. Assumptions

- Trials use the same **catalog-per-tenant** posture as paid tenants (see **`TENANT_DATABASE_TOPOLOGY.md`**).
- Operators apply releases through the **normal hosted upgrade path** (vendor-managed SQL migrations + app rollout).
- Buyers still validate procurement claims against **`docs/`**, **`openapi`**, and their own pilot acceptance criteria — this memo is orientation, not a substitute for those artifacts.

## 3. Constraints

- **Calendar dates** for **V1.1** are **not implied** here; schedule lives in owner decisions (**`PENDING_QUESTIONS.md`**) and release communications.
- **V1 GA readiness** is **not** gated on this document (see **`V1_DEFERRED.md` §6i** scoring note).

## 4. Architecture overview

**V1** ships a working tenant-isolated control plane + SQL persistence + HTTP API + operator UI. **V1.1** is expected to layer **buyer-visible optional capabilities** and commercial milestones that were explicitly deferred out of **V1** scoring — principally items summarized in **`V1_DEFERRED.md`** §**6b** (commerce un-hold), §**6d** (MCP / agent ecosystem documentation commitments), and §**6a** (Slack interactive approvals as a **V1.1** UX slice).

Data-plane isolation boundaries (**tenant / workspace / project** scopes, audit semantics, authority workflows) remain the spine; **V1.1** changes should present as **additive features**, **configuration**, or **documented breaking deltas** rather than silent behavioral drift.

## 5. Component breakdown (tenant-facing surfaces)

| Surface | V1 posture | Typical V1.1 deltas (examples — finalize against release notes) |
|---------|------------|-------------------------------------------------------------------|
| **Evidence bulk upload** | Up to **200** files per request; **ZIP expansion** server-side (UI advertises ZIP). | Browser **folder recursion** (`webkitdirectory`) when product prioritizes it |
| **Topology / RAG** | Reference-architecture **exemplar style prior** wired into Topology agent (fail-open). Owner curates `templates/reference-architectures/**`. | Fingerprint-based exemplar matching; expanded exemplar library |
| **MCP / agent ecosystem** | **HTTP bridge** for three read-only retrieval tools (`/v1/mcp/retrieval/*`, non-GA). REST/CLI remain supported. | Streamable HTTP **MCP membrane**, seven governance read tools (**§6d**), production hardening |
| **Commerce / billing** | Sales-led motion may run without live Stripe/Marketplace un-hold (**§6b**) | Live Stripe keys + Marketplace publication + DNS cutovers become relevant when finance/legal completes Partner Center readiness |
| **Chat-ops** | Slack outbound parity targets **V1 GA** per **`V1_SCOPE.md`** §2.14 | **In-Slack interactive approvals** are pinned **V1.1** (**`V1_DEFERRED.md` §6a**) |
| **Policy packs / governance** | V1 governance emits durable audit events | Promotions of stricter packs or new enforcement modes must arrive with **`BREAKING_CHANGES`** entries when customer-visible |

## 6. Data flow

Hosted upgrades apply **`ArchLucid.Persistence/Migrations/*.sql`** sequentially via **DbUp**; tenant admins do **not** hand-run DDL. Application services read **`SESSION_CONTEXT` / scope headers** as today — **V1.1** features must preserve tenant/workspace/project isolation unless a reviewed migration explicitly introduces new scope semantics (unlikely; treat as exceptional).

## 7. Security model

- **Least privilege** stays default: new integrations (**Slack buttons**, **MCP**, commerce webhooks) must reuse existing **Authority-shaped** payloads and **typed audit** semantics documented in **`AUDIT_COVERAGE_MATRIX.md`**.
- **Secrets** remain **Key Vault / managed identity** oriented per **`CONFIGURATION_REFERENCE.md`**; **V1.1** must not introduce silent secret sprawl.

## 8. Operational considerations

### 8.1 What tenant admins should watch

- **`CHANGELOG.md`** — authoritative shipped deltas per release.
- **Procurement pack / `BREAKING_CHANGES`** — customer-facing migration notes when behavior or contracts move.
- **Trial runbooks** — start at **`docs/runbooks/TRIAL_FUNNEL_END_TO_END.md`** and linked operator guides.

### 8.2 Scalability

**V1.1** may add optional caches (**Redis-backed read models**) or connectors; hosted trials should inherit scale characteristics of the shared region footprint documented for production (no trial-specific “lite” security boundary).

### 8.3 Reliability

Upgrade windows should preserve **DbUp idempotency** expectations: failed migrations roll forward only with operator playbooks — tenant admins rely on vendor status channels during hosted maintenance.

### 8.4 Cost

Deferred **V1.1** commerce milestones (**§6b**) can change **metering visibility** (live invoices vs pilot quotes). Trials remain bounded by pilot tier limits documented in billing UX and emails.

---

## 9. References (inventory anchors)

- **`docs/library/V1_DEFERRED.md`** §**6i** (hosted trial memo scoring posture), §**6b** (commerce), §**6d** (MCP), §**6a** (Slack interactivity).
- **`docs/library/V1_SCOPE.md`** — **V1** contract of record.
- **`CHANGELOG.md`** — release facts.
- **`docs/runbooks/TRIAL_FUNNEL_END_TO_END.md`** — operational trial path.

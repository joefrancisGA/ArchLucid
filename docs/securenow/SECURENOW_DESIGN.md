> **Scope:** Solution design for **SecureNow** — how the security product line is structured on the shared platform stack. **Contributor-reference** — internal only.
> **Spine:** [`README.md`](README.md) · **Requirements:** [`SECURENOW_REQUIREMENTS.md`](SECURENOW_REQUIREMENTS.md) · **Architect contract:** [`../library/SECURENOW_ARCHITECT_PLANE.md`](../library/SECURENOW_ARCHITECT_PLANE.md)

# SecureNow — design document

**Audience:** Engineering agents and architects implementing or extending SecureNow for security-operator workflows.

**Status:** Design summary (~two pages). Authoritative engine and IE detail remain in library contracts and [`TECHNICAL_BACKLOG.md`](TECHNICAL_BACKLOG.md).

---

## 1. System context

SecureNow is a **product-line configuration** on one monorepo stack: .NET application layer, HTTP API, background worker, SQL catalog, and Next.js UI. Differentiation is **policy and shell**, not a separate Azure harvester.

```text
                    ┌─────────────────────────────────────┐
                    │  Next.js UI (productLine = security) │
                    │  SecureNow shell, routes, copy policy  │
                    └─────────────────┬───────────────────┘
                                      │ OpenAPI / REST
                    ┌─────────────────▼───────────────────┐
                    │  Platform API + Worker               │
                    │  Infra-evidence + SecureNowArchitect │
                    └─────────────────┬───────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          │                           │                           │
   AzureInventorySnapshot      SecurityEvidencePath      OperationalSecurityFinding
   (IE plane)                   (architect plane)         (third finding stream)
          ▲                           │
          │ Tier-1 ZIP + hosted GET   │ deterministic engines
          └───────────────────────────┘
```

**Boundary rule:** Authority and platform namespaces must **not** depend on SecureNow implementation types; cross-product ports live in Core/Contracts (`SecureNowProductBoundaryTests`).

---

## 2. Layered design

| Layer | Responsibility | SecureNow-specific |
|-------|----------------|-------------------|
| **UI** | Operator workflows, diagrams, findings queue, metrics panels | Product-line gates in `product-line-catalog.ts`, `securenow-*-copy.ts`, cloud platform policy (Azure-only). |
| **API** | Infra-evidence ingest, path inspector, ranking, remediation advisory, diagram GETs | Controllers under infra-evidence; SN-RT inference questionnaire mapped to avoid unregistered routes. |
| **Application** | Snapshot materialization, graph projection, path engines, finding materialization, metrics queries | Infra-evidence namespaces (`SecureNowArchitect` and related operational security modules). |
| **Core / Contracts** | Shared types, tenant scope, provenance enums, ports | No SecureNow-only leakage into authority graph types. |
| **Collection** | `Get-SecureNowAzurePackage.ps1` / shared extractor discipline | Extends IE-02 files; **no** `Get-SecureNowAttackPathPackage.ps1`. |

### Processing spine (design invariant)

```text
Azure (+ optional adapters)
  → AzureInventorySnapshot
        → Security evidence graph (projection)
              → Path engines → SecurityEvidencePath
                    → OperationalSecurityFinding ( cites PathId )
                          → Ranking + SecurityEvidenceCutPoint
                                → Remediation advisory + verify on Snapshot N+1
                                      → Outcome metrics (path-oriented)
```

AI sits **after** deterministic paths: summarize, narrate remediation, map labels — with validation on the next snapshot. AI does not mint hops or ARM facts.

---

## 3. Major components

### 3.1 Infrastructure-evidence plane (shared)

Single normalized snapshot feeds configuration drift, diagrams, remediation factory, **and** SecureNow engines. See [`INFRA_EVIDENCE_PLANE.md`](../library/INFRA_EVIDENCE_PLANE.md).

Design choices SecureNow relies on:

- Append-only snapshot identity and tenant-scoped storage.
- Three **distinct** finding streams (agent-sealed findings vs operational security).
- Advisory Terraform reconstruction and diff rows shared with drift narrative.

### 3.2 SecureNow architect plane

Implemented as deterministic engines over projected nodes/edges (identity, resource, RBAC, network controls, policy, shared controls). Path kinds and confidence weakest-link semantics are defined in [`SECURENOW_ARCHITECT_PLANE.md`](../library/SECURENOW_ARCHITECT_PLANE.md).

Notable design elements:

- **Diagnostic hypotheses** (e.g. external reachability, common-mode dependency) — investigation claims, not findings or graph traversal seeds.
- **Ranking** — persisted dimensional breakdown; optional tenant weights; no single opaque multiplier as system of record.
- **Cut points** — coarse operational-cost weighting for advisory leverage.
- **Assurance** — synthetic Azure worlds + metamorphic tests validate semantics without calling Azure.

### 3.3 Diagram honesty stack

Three conceptual diagram classes (see [`DATA_ARCHITECTURE_AND_DATA_FLOW_DIAGRAMS.md`](DATA_ARCHITECTURE_AND_DATA_FLOW_DIAGRAMS.md)):

| Mode | Design intent |
|------|----------------|
| Infrastructure | Resource topology from inventory |
| Data architecture | Stores, pipelines, classification hooks |
| Data flow | Declared/probable/observed **may connect** edges |

Probable evidence families (SN-PE) and runtime companions (SN-RT) add labeled edge classes without numeric confidence. PE hops require DNS join where applicable; observed runtime requires explicit observation grain or HumanAssertion confirm.

### 3.4 UI product-line policy

Central policy module excludes unsupported cloud providers, help topics for other product jobs, and integration connectors not sold on SecureNow (e.g. Azure Boards, Slack). CI consumer-copy allowlist ratchet blocks sibling-product name leaks in SecureNow surfaces.

---

## 4. Data and integration design

| Artifact | Role |
|----------|------|
| `AzureInventorySnapshot` | System of record for Azure-normalized rows at a point in time |
| `SecurityEvidencePath` | First-class ranked work unit with hop list and hash idempotency |
| `OperationalSecurityFinding` | Queue item referencing path + remediation linkage |
| `SecurityAssetAssertion` | Time-bounded human crown-jewel / sensitivity labels |
| Diagram stage catalog | Mermaid/workbench rendering with provenance stroke styles |

**External integrations (design):**

- **Microsoft Defender** — companion/summary inputs; architect graph excludes CVE payload nodes; positioning is reconcile-with-inventory, ownership, and remediation history—not replace Defender.
- **Entra / federated CI** — optional inventory adapters; Graph forbidden → InsufficientEvidence.
- **ITSM / export** — advisory handoff; execute outside product.

**Future optional split (backlog):** `SecureNow.Api` facade compile check (**TB-2400**) and catalog DDL split (**TB-2401**) — not required for current single-host design (**PL-05**).

---

## 5. Security, reliability, and operations

| Concern | Design approach |
|---------|-----------------|
| **Security** | Reader-only collection; no secret persistence from runtime parsers; SoD on remediation pattern approval; AI cannot authorize apply |
| **Isolation** | TenantId on paths and findings; database-per-tenant hosted model |
| **Reliability** | Idempotent path ingest by canonical hop hash; fail-soft adapters |
| **Performance** | Neighborhood-bounded graph work; incremental invalidation on inventory diff (SA-13) |
| **Observability** | Shared platform health, version, and correlation IDs; SecureNow-specific metrics API for architect outcomes |
| **Verification honesty** | Separate UI states for analysis completeness, attested change, and snapshot-verified postconditions (**SN-VF**) |

---

## 6. Design exclusions (do not implement here)

- Second Azure collector or apply engine inside SecureNow sessions.
- Findings-as-nodes in the security graph; new `IFindingEngine` coverage families.
- Numeric confidence percentages or compliance scores without imported catalog math.

---

## Related

- [`SECURENOW_REQUIREMENTS.md`](SECURENOW_REQUIREMENTS.md)
- [`../library/SECURENOW_CUT_POINTS.md`](../library/SECURENOW_CUT_POINTS.md) · [`../library/SECURENOW_ARCHITECT_METRICS.md`](../library/SECURENOW_ARCHITECT_METRICS.md)
- [`../assurance/SECURENOW_TRUTH_KERNEL.md`](../assurance/SECURENOW_TRUTH_KERNEL.md) (if present on branch)
- Composer prompt indexes listed in [`TECHNICAL_BACKLOG.md`](TECHNICAL_BACKLOG.md)

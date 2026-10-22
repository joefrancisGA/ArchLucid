> **Scope:** Sample one-page architecture requirements for ArchLucid — quality / demo intake fixture, not a buyer contract or roadmap.

# ArchLucid — one-page requirements

**System:** ArchLucid (Architecture Proof Engine)  
**Environment:** prod (Azure-native SaaS)  
**Audience:** Operators, architects, sponsors who need a defensible architecture package  
**Use:** Paste or attach as guided-intake / `POST /v1/architecture/request` context for quality samples

---

## 1. Problem

Enterprise architecture reviews are slow, inconsistent, and weakly evidenced. Ad-hoc AI chat produces prose without a durable decision record. Teams need a governed path from architecture evidence to a finalized, exportable **architecture package**.

## 2. Goal

Deliver a vendor-operated SaaS that turns buyer architecture context into a **reviewable architecture package**: evidence-linked findings, stated confidence limits, signed (hash-anchored) manifest, append-only audit trail, and sponsor-ready exports (Markdown / DOCX / ZIP).

**Lead promise:** *Defensible architecture, on demand.*

## 3. In-scope capabilities (V1)

| ID | Requirement |
|----|-------------|
| R1 | Create a review from structured request or guided intake; execute agent analysis; **finalize** an architecture package. |
| R2 | Multi-agent pipeline (Topology, Cost, Compliance, Critic) produces structured findings with explainability traces. |
| R3 | Manifest-scoped artifacts list/download; Markdown/DOCX export and ZIP bundle from a finalized package. |
| R4 | Tenant isolation via **database-per-tenant** on hosted workloads; Entra ID / JWT / API-key auth modes. |
| R5 | Hosted real LLM path uses platform-provisioned Azure OpenAI; simulator mode for deterministic CI/demo. |
| R6 | Operate layer: two-review compare, replay, provenance/graph, Ask, advisory scans, policy packs, pre-finalize governance gate, SoD approvals. |
| R7 | Operator surfaces: architect workspace, REST API, CLI (`health`, `run`, `status`, `commit`, `artifacts`). |
| R8 | Health (`/health/live`, `/health/ready`), correlation IDs, support bundle / doctor diagnostics. |

## 4. Constraints

- Azure-first hosting (Container Apps, SQL Server, private endpoints, managed identity where applicable).
- Append-only audit events — no silent mutation of sealed evidence.
- Decision-support only: does **not** push infrastructure changes or auto-approve production deployments.
- Do not claim CPA-issued SOC 2 or published third-party pen-test unless artifacts exist.
- Create and review are workflows; the buyer noun is the **architecture package**.

## 5. Non-goals (V1)

- Replacing EAM modeling repositories (LeanIX / Ardoq class).
- Customer-installed production container/Helm as the licensed product.
- Autonomous remediations or chat-only deliverables without finalize.
- Guaranteed cycle-time or cost savings without buyer-specific measurement.

## 6. Assumptions

- Operators supply real architecture context (docs, topology hints, constraints).
- Incomplete evidence is acceptable; gaps must be visible, not invented.
- Pilot success = at least one finalized package with exportable sponsor summary.

## 7. Success criteria

1. Request → execute → finalize completes with a content-hash-anchored package.  
2. Top findings cite evidence or explicitly mark evidence gaps.  
3. Export (DOCX/Markdown/ZIP) reconstructs the decision package for sponsor/audit handoff.  
4. Audit trail reconstructs who/what finalized and major disposition events.

## 8. Actors & trust boundary

| Actor | Role |
|-------|------|
| Architect / operator | Intake, review findings, finalize, export |
| Sponsor / reviewer | Consumes package and first-value / sponsor summary |
| Automation (CLI/CI) | Health, run lifecycle, artifact download |
| Model (LLM) | Analysis inside host prompts — no tool-loop side effects to customer infra |

**Out of boundary:** Customer cloud control planes (ArchLucid does not mutate them).

---

*Sample fixture for quality and intake tests. Canonical product boundary: [`docs/library/V1_SCOPE.md`](../../library/V1_SCOPE.md). Positioning: [`docs/go-to-market/POSITIONING.md`](../../go-to-market/POSITIONING.md).*

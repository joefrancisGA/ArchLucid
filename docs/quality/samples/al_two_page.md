> **Scope:** Sample two-page architecture requirements for ArchLucid — quality / demo intake fixture, not a buyer contract or roadmap. Companion to [`al_onepage.md`](al_onepage.md).

# ArchLucid — two-page requirements

**System:** ArchLucid (Architecture Proof Engine)  
**Environment:** prod (Azure-native SaaS)  
**Audience:** Operators, architects, sponsors who need a defensible architecture package  
**Use:** Paste or attach as guided-intake / `POST /v1/architecture/request` context for quality samples  
**Category:** Architecture Proof Engine — *Defensible architecture, on demand.*

---

<!-- PAGE 1 -->

## 1. Problem

Enterprise architecture reviews are slow, inconsistent, and weakly evidenced. Teams manually assemble decks, reconstruct reasoning after the fact, and struggle to show sponsors what changed and why. Ad-hoc AI chat produces fluent prose without a durable decision record, signed package, or audit trail.

Security and procurement reviewers need more than a diagram: they need findings tied to evidence, explicit limits where proof is missing, and a handoff package that survives without a founder narrating the session.

## 2. Goal

Deliver a **vendor-operated SaaS** that turns buyer architecture context into a reviewable **architecture package**:

- evidence-linked findings with explainability traces  
- stated confidence limits and explicit non-conclusions where proof is missing  
- content-hash-anchored (signed) manifest and append-only audit trail  
- sponsor-ready exports (Markdown / DOCX / ZIP)

**Create** and **review** are workflows; the buyer noun is the **architecture package**.

## 3. In-scope capabilities (V1)

### 3.1 Pilot (must work for every pilot)

| ID | Requirement |
|----|-------------|
| R1 | Create a review from structured request (`POST /v1/architecture/request`) or guided intake (draft → admit → submit); execute agent analysis; **finalize** an architecture package. |
| R2 | Multi-agent pipeline (Topology, Cost, Compliance, Critic) produces structured findings with explainability traces. |
| R3 | Manifest-scoped artifacts list/download; Markdown/DOCX export and ZIP bundle from a finalized package. |
| R4 | Tenant isolation via **database-per-tenant** on hosted workloads; Entra ID / JWT / API-key auth modes. |
| R5 | Hosted real LLM path uses platform-provisioned Azure OpenAI; simulator mode for deterministic CI/demo. |
| R6 | Operator surfaces: architect workspace, REST API, CLI (`health`, `run`, `status`, `commit`, `artifacts`). |
| R7 | Health (`/health/live`, `/health/ready`), correlation IDs, support bundle / doctor diagnostics. |

### 3.2 Operate (after at least one finalized package)

| ID | Requirement |
|----|-------------|
| R8 | Two-review compare (structured deltas + optional AI explanation); comparison and authority replay. |
| R9 | Provenance / architecture graph; Ask against architecture context; advisory scans; pilot feedback signals. |
| R10 | Policy packs (versioned rules), pre-finalize governance gate, SoD approval workflows with SLA tracking. |

## 4. Constraints

- **Platform:** Azure-first (Container Apps, SQL Server, private endpoints, managed identity where applicable).  
- **Evidence integrity:** Append-only audit events; no silent mutation of sealed evidence.  
- **Decision-support only:** Does **not** push infrastructure changes or auto-approve production deployments.  
- **Claim honesty:** Do not claim CPA-issued SOC 2 or published third-party pen-test unless artifacts exist.  
- **IaC:** Infrastructure must be representable in Terraform for vendor-operated reference deployments.  
- **Data:** Single DDL source per database; forward-only migrations.

## 5. Non-goals (V1)

- Replacing EAM modeling repositories (LeanIX / Ardoq class).  
- Customer-installed production container/Helm as the licensed product.  
- Autonomous remediations or chat-only deliverables without finalize.  
- Guaranteed cycle-time or cost savings without buyer-specific measurement.  
- “Smarter than frontier chat” positioning; commodity generate-from-goals as the hero claim.

---

<!-- PAGE 2 -->

## 6. Assumptions

- Operators supply real architecture context (docs, topology hints, constraints, policy references).  
- Incomplete evidence is acceptable; gaps must be **visible**, not invented by the model.  
- Pilot success = at least one finalized package with an exportable sponsor summary.  
- Workspace/project scope comes from the signed-in operator session unless automation supplies it.  
- Hosted trial tenants follow the same database-per-tenant isolation model as paying tenants.

## 7. Operator happy path

1. **Intake** — architecture request or guided draft with description, constraints, capabilities, and optional documents.  
2. **Execute** — agents analyze under Real or Simulator mode; quality gates may warn or hold low-quality output.  
3. **Review** — operator inspects findings, dispositions, evidence gaps, and provenance.  
4. **Finalize** — commit produces an immutable, hash-anchored architecture package (blocked if pre-finalize gate fails).  
5. **Export / handoff** — Markdown/DOCX/ZIP and optional sponsor first-value summary for audit or sponsor email.

## 8. Non-functional requirements

| Concern | Requirement |
|---------|-------------|
| **Security** | Least-privilege identities; deny-by-default network posture on hosted stack; tenant predicates on data access; prompt/content safety on model ingress; no model tool-loop side effects to customer infra. |
| **Scalability** | API + Worker decomposition; async orchestration for long-running reviews; per-tenant LLM spend controls on hosted path. |
| **Reliability** | Health/ready probes; idempotent run/task semantics where shipped; durable outbox patterns for integration events (V1.1 buyer bar for full fan-out). |
| **Cost** | Prefer Azure-native managed services; simulator mode for CI to avoid LLM spend; budget reservation/settlement on real calls. |
| **Observability** | Correlation IDs, structured logs, OpenTelemetry on critical paths; CLI `doctor` / support bundle for triage. |

## 9. Success criteria

1. Request → execute → finalize completes with a content-hash-anchored package.  
2. Top findings cite evidence or explicitly mark evidence gaps.  
3. Export (DOCX/Markdown/ZIP) reconstructs the decision package for sponsor/audit handoff.  
4. Audit trail reconstructs who/what finalized and major disposition events.  
5. A second review can be compared to the first with durable delta artifacts.  
6. Pre-finalize gate (when enabled) blocks packages that exceed configured severity thresholds.

## 10. Actors & trust boundary

| Actor | Role |
|-------|------|
| Architect / operator | Intake, review findings, finalize, export |
| Sponsor / reviewer | Consumes package and first-value / sponsor summary |
| Governance approver | SoD approvals; distinct from package author when required |
| Automation (CLI/CI) | Health, run lifecycle, artifact download |
| Model (LLM) | Analysis inside host prompts only — no HTTP/shell/ITSM tool-loop to customer systems |

**Inside boundary:** Architect workspace (Next.js), ArchLucid.Api, ArchLucid.Worker, tenant SQL catalogs, optional blob/Service Bus.  
**Out of boundary:** Customer cloud control planes (ArchLucid does not mutate them); third-party EAM CMDB systems as system of record.

## 11. Risks & honest limits

| Risk | Mitigation / honesty |
|------|----------------------|
| Model hallucination | Evidence links, quality gates, Critic agent, explicit insufficiency |
| Incomplete intake | Clarifications / missing-item surfaces; do not invent proof |
| Over-claim in sales | Public claim boundary; no universal cycle-time or attestation claims |
| Replay drift | Packages are immutable; model/source changes still matter for re-execute |

---

*Sample fixture for quality and intake tests. One-page companion: [`al_onepage.md`](al_onepage.md). Canonical product boundary: [`docs/library/V1_SCOPE.md`](../../library/V1_SCOPE.md). Positioning: [`docs/go-to-market/POSITIONING.md`](../../go-to-market/POSITIONING.md).*

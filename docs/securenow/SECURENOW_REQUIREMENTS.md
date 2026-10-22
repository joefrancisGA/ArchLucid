> **Scope:** Product requirements for the **SecureNow** security product line. **Contributor-reference** — internal; not procurement or buyer-facing copy.
> **Spine:** [`README.md`](README.md) · **Design:** [`SECURENOW_DESIGN.md`](SECURENOW_DESIGN.md) · **Engineering backlog:** [`TECHNICAL_BACKLOG.md`](TECHNICAL_BACKLOG.md)

# SecureNow — requirements document

**Audience:** Product owner, security architects, engineering, and pilot sponsors who need a bounded statement of what SecureNow must deliver.

**Status:** Contract aligned with shipped baseline (2026-09) and active holds. Describes required behavior and honesty boundaries, not net-new roadmap items unless noted as backlog.

**Document length:** Two-page summary; detail lives in linked library contracts.

---

## 1. Purpose and problem

SecureNow helps enterprise security and cloud architecture teams **prioritize and explain** Azure exposure, privilege, and dependency risk using **evidence-backed paths**, not another misconfiguration checklist alone.

| Stakeholder need | SecureNow must… |
|------------------|-----------------|
| Security architect | See ranked paths (who can reach what, with what privilege), inspect cited hops, and assign advisory remediation with verification on a later snapshot. |
| Operator / engineer | Upload or connect Azure inventory, review findings queue and diagrams, execute runbooks **outside** the product (no in-app ARM/Terraform apply). |
| Executive / sponsor | Read outcome-oriented metrics (paths removed, crown-jewel exposure reduced), not raw “findings closed” as the headline. |

**Product identity:** Consumer-facing name **SecureNow**. Platform rename and API split (**SN-08**, **TB-2400 / TB-2401**) remain owner holds. **Cloud scope:** Azure only.

---

## 2. Functional requirements

### 2.1 Evidence intake (must)

| ID | Requirement | Acceptance signal |
|----|-------------|-------------------|
| **FR-EV-01** | Collect normalized Azure inventory into `AzureInventorySnapshot` via the **single** Tier-1 extractor + hosted Reader GET family (no second collector product). | Snapshot ingest, hash, tenant scope; tests on upload parsers. |
| **FR-EV-02** | Support optional companion files (Entra group inventory, federated CI credentials, runtime connection observations, SQL principals) with **fail-soft** gaps — missing companions yield `InsufficientEvidence`, not blocked Azure spine. | Warnings in UI/API; engines continue on RBAC + network. |
| **FR-EV-03** | Preserve epistemic categories on every hop: ObservedFact, DerivedFact, DeterministicInference, AiInference, HumanAssertion. Never promote AI or inference to observed fact in copy or API. | Provenance labels in path inspector and diagrams. |

### 2.2 Security architect plane (must)

| ID | Requirement | Acceptance signal |
|----|-------------|-------------------|
| **FR-AP-01** | Project snapshot rows into a **security evidence graph** and run deterministic path engines: privilege, intended reachability, capability-to-flow, shared-control blast radius, toxic combination, four-reality drift. | `SecurityEvidencePath` records with ordered hops and `PathKind`. |
| **FR-AP-02** | Emit **operational** findings that **cite** `PathId`; findings are not graph nodes for downstream traversal. Do **not** expand agent-coverage `IFindingEngine` streams. | Operational finding stream + product boundary tests (`SecureNowProductBoundaryTests`). |
| **FR-AP-03** | Rank paths on **independent dimensions** (exposure, privilege depth, blast radius, business consequence, confidence band). `Unknown` business consequence must not zero a real technical path. | Ranking breakdown exposed on GET; rule version string. |
| **FR-AP-04** | Recommend **cut points** (high-leverage advisory controls) without auto-executing change. | Cut-point records linked to ranked paths. |
| **FR-AP-05** | Expose path inspect workbench, constrained AI explanation **on cited paths only**, and security-outcome metrics vs prior snapshot. | API + UI panels; golden/metamorphic tests where shipped. |

### 2.3 Diagrams and declared connectivity (must)

| ID | Requirement | Acceptance signal |
|----|-------------|-------------------|
| **FR-DG-01** | Provide infrastructure, data architecture, and **data flow** diagram modes with honesty legends (declared / probable / observed / human-confirmed). | `DiagramMode` workbench; SN-DF / SN-PE / SN-RT baseline shipped. |
| **FR-DG-02** | Label capability-to-flow as **may access / may reach**, not observed exfiltration or packet proof. | Copy guards + CI ratchet on SecureNow routes. |
| **FR-DG-03** | Support runtime declared/observed overlays (e.g. Container Apps settings, optional LAW/upload confirm, inference questionnaire) without persisting secret values. | SN-RT companions; operator confirm as HumanAssertion. |

### 2.4 Remediation and verification (must)

| ID | Requirement | Acceptance signal |
|----|-------------|-------------------|
| **FR-RM-01** | Remediation remains **advisory** (runbook, Terraform representation, ITSM handoff). No `terraform apply`, ARM writes, or write roles in product workflows. | Hold prompts SA-22 / IE plane invariants. |
| **FR-RM-02** | Verification compares **next snapshot** to claimed postconditions; UI must not imply verification passed when analysis or chronology is incomplete (**SN-VF** honesty). | Verification labels and workbench copy tests. |
| **FR-RM-03** | Human asset classification (`SecurityAssetAssertion`) requires expiration; organizational routing fields empty unless HumanAssertion supplied. | No invented owners or crown-jewel labels. |

### 2.5 Operator shell (must)

| ID | Requirement | Acceptance signal |
|----|-------------|-------------------|
| **FR-UI-01** | Run as product line `security`: SecureNow chrome, help, and connector policy aligned to the security operator job. | `securenow-cloud-platform-policy.ts` + consumer-copy leak ratchet CI. |
| **FR-UI-02** | Governance findings queue, infrastructure home, extract/upload settings, and diagram routes use **security job language**. | SH-* help wave partial; SN brand shipped. |

---

## 3. Non-functional requirements

| ID | Requirement |
|----|-------------|
| **NFR-01** | **Tenant isolation** (ADR 0037): paths, snapshots, and findings scoped by tenant; cross-tenant leakage forbidden. |
| **NFR-02** | **Ordinal confidence only** (`PathConfidenceBand`); no numeric “82%” unless a calibrated model exists (none in V1). |
| **NFR-03** | **Reader-only** Azure collection; documented least-privilege Graph when enabled; inaccessible scopes → gaps, not silent elevation. |
| **NFR-04** | **Scale:** path computation over snapshot neighborhoods; incremental invalidation on inventory diffs where implemented. |
| **NFR-05** | **Shared platform (PL-05):** one API, one Worker, one SQL catalog, two UI shells — no mandatory second HTTP host for baseline SecureNow. |
| **NFR-06** | **Accessibility / enterprise UI:** Carbon-inspired operator surfaces per [`UI_DESIGN_SYSTEM.md`](../library/UI_DESIGN_SYSTEM.md). |

---

## 4. Explicitly out of scope

- Packaged governance-review lifecycles as the primary SecureNow happy path.
- Attack-path engines or cloud connectors outside Azure in the SecureNow shell.
- Customer Azure mutation, near-real-time SIEM replacement, or CMDB of record.
- Numeric risk scores as product-of-record; mega-graph of every inventory node type in V1.
- GTM cohort programs **M-90 / M-44 / M-91 / M-92**; CPA SOC 2 (**G-REAL-05**); third-party pen test publication (**G-ASSURANCE-02**) as engineering deliverables.
- Platform rename (**SN-08** hold): namespaces, domains, and API surface split (**TB-2400 / TB-2401**) unless owner directs.

---

## 5. Success criteria (release / pilot)

1. Operator can ingest Azure inventory and open ranked operational findings with **cited paths** inspectable end-to-end.
2. Diagrams distinguish declared vs probable vs observed connectivity without claiming traffic that was not evidenced.
3. Remediation and verification copy never states compliance, ExactMatch, or “fixed” without next-snapshot evidence.
4. SecureNow UI passes consumer-copy leak ratchet CI and shows Azure-only connector policy.
5. Security-outcome metrics headline path reduction and privilege-on-production paths, not ticket counts alone.

---

## Related

- [`../library/SECURENOW_ARCHITECT_PLANE.md`](../library/SECURENOW_ARCHITECT_PLANE.md) — engine contract
- [`../library/INFRA_EVIDENCE_PLANE.md`](../library/INFRA_EVIDENCE_PLANE.md) — observation spine
- [`DATA_ARCHITECTURE_AND_DATA_FLOW_DIAGRAMS.md`](DATA_ARCHITECTURE_AND_DATA_FLOW_DIAGRAMS.md) — diagram semantics

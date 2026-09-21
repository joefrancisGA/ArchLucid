> **Scope:** Contributor-reference — consolidated engineering backlog for the **SecureNow** Security product line (consumer shell + infra-evidence architect engines + diagram honesty). Not procurement copy, not GTM **M-90 / M-44 / M-91 / M-92**, and not **TB-135 / TB-136** assurance programs.
> **Spine:** [`README.md`](README.md) · **Monorepo TB index:** [`../library/TECH_BACKLOG.md`](../library/TECH_BACKLOG.md) · **Architect contract:** [`../library/SECURENOW_ARCHITECT_PLANE.md`](../library/SECURENOW_ARCHITECT_PLANE.md)

# SecureNow — technical backlog

**Audience:** Francis Architecture LLC owner and coding agents scoping SecureNow work.

**Last reconciled:** 2026-09-20 (trunk scan + prompt indexes under `.cursor/prompts/securenow-*`).

## How to use this file

| Need | Action |
|------|--------|
| Pick up one engineering slice | Open the wave index in [Composer prompt indexes](#composer-prompt-indexes), paste **one** numbered prompt file per session — **do not implement from an index**. |
| Understand diagram honesty | Read design notes in this folder (`DATA_ARCHITECTURE_*`, `EVIDENCE_BASED_*`, `RUNTIME_*`). |
| Azure ZIP / collector gaps | [`../library/AZURE_EXTRACTOR_TECHNICAL_BACKLOG.md`](../library/AZURE_EXTRACTOR_TECHNICAL_BACKLOG.md) (AX-DE shipped; AX-DC / IE-RF remain). |
| Second API host / SQL split | [`../library/TECH_BACKLOG_TB2400_INDEX.md`](../library/TECH_BACKLOG_TB2400_INDEX.md) (**TB-2400**, **TB-2401**) — owner pickup only. |

### Status legend

| Status | Meaning |
|--------|---------|
| **Shipped** | On trunk with tests or CI guards; do not re-run as greenfield. |
| **Partial** | Core landed; listed follow-ons remain in this backlog. |
| **Backlog** | Not started or prompts only — implement only when owner directs the row. |
| **Hold** | Written stop list — paste hold prompt if a session drifts into forbidden scope. |

### Global constraints (every SecureNow session)

- **One** Azure collector family (Tier-1 PowerShell + hosted GET-only reader). No second ZIP, no ARM writes, no `terraform apply`.
- **PL-05:** one `ArchLucid.Api`, one Worker, one SQL catalog, two UI shells (`NEXT_PUBLIC_ARCHLUCID_PRODUCT`).
- **Product vs company:** consumer copy says **SecureNow**; legal entity and Architecture product stay **ArchLucid** unless owner reopens **SN-08**.
- **Honesty:** ordinal `PathConfidenceBand` only — no numeric “82%” confidence; capability-to-flow is **may access**, not observed exfiltration.
- **Workspace chrome:** do not hide desktop review workspace tabs behind **More** (product rule).
- **Assessment exclusions:** do not file GTM cohort rows **M-90**, **M-44**, **M-91**, **M-92** as engineering gaps.

---

## Shipped baseline (do not re-diagnose)

These waves are **closed for greenfield re-implementation**. Extend or fix with a scoped bug/UX row; cite the original prompt ID in commit messages when touching behavior.

| Wave | IDs | What landed (summary) |
|------|-----|------------------------|
| **Product line** | **PL-01–PL-05** | Dual-start UI; `product-line-catalog.ts`; route/product-line gate. |
| **Consumer brand** | **SN-01–SN-07** | Display name, connector copy, help token policy, leak ratchet (`scripts/ci/data/securenow-archlucid-allowlist.json`). **SN-08** remains hold. |
| **Data flow diagrams** | **SN-DF-01–SN-DF-08** | `DiagramMode.DataFlow` / `DataArchitecture`, stage catalog, ADF spine, workbench `mermaidMode=dataFlow`, honesty legends, empty-stage captions, mermaid contract tests. |
| **Probable evidence on Data Flow** | **SN-PE-01–SN-PE-07** | `AzureInventoryDataFlowEvidenceCatalog`, family filter, PE DNS join (`peReachableTarget`), messaging RBAC direction, ordinal bands — **not** percents. |
| **Runtime connections** | **SN-RT-01–SN-RT-14** (core) | Container Apps env → `app-settings-hosts.json`, parsers, SQL catalog grain, PaaS stages, RBAC allowlist, opt-in `dependency-observations.json` + `ObservedRuntime`, SQL principals companion, upload parsers, operator confirm (`HumanAssertion`), inference questionnaire API + workbench panel. **SN-RT-14** maps the operator-inferred controller so Diagrams GETs stop 500ing `Unmapped API controller`. |
| **Architect plane** | **SA-01–SA-21** | `SecurityEvidencePath` domain, security edges, privilege/reachability/toxic/capability engines, ranking, cut points, four-reality drift, neighborhood recompute, path inspector API + UI, constrained path explanation, asset assertions, outcome metrics, honesty copy. Optional Entra group + federated-credential **inventory** companions feed SA-02/SA-03. |
| **Help job-match (partial set)** | **SH-01**, **SH-07–SH-10**, **SH-26**, others | Product-line contextual help rows for governance/infrastructure routes; Security help hub excludes Architecture-process featured slugs (e.g. `billing-and-plans`, `first-architecture-review`). |

**Holds (active):** [`SECURENOW_ARCHITECT_HOLD.md`](../library/SECURENOW_ARCHITECT_HOLD.md) (**SA-22**), [`SECURENOW_PROBABLE_EVIDENCE_HOLD.md`](../library/SECURENOW_PROBABLE_EVIDENCE_HOLD.md), [`SECURENOW_RUNTIME_CONNECTION_HOLD.md`](../library/SECURENOW_RUNTIME_CONNECTION_HOLD.md), [`SECURENOW_DATA_FLOW` hold via SN-DF-09](../architecture/SECURENOW_DATA_FLOW_DIAGRAM_COMPOSER_PROMPTS.md).

---

## Prioritized remaining backlog

Ordered for SecureNow operator value after the shipped baseline. Size is engineering relative (S/M/L/XL), not calendar.

| Pri | ID | Title | Status | Size | Notes |
|-----|-----|-------|--------|------|-------|
| P1 | **AX-DC-01–08** | Executive / Identity / Data diagram **consumption** | **Backlog** (prompts only) | L | Authorization endpoints, Probable/Inferred strokes, completeness warnings, edge inspector, hosted vs Tier-1 honesty. Hold: [`AZURE_EXTRACTOR_DIAGRAM_CONSUMPTION_HOLD.md`](../library/AZURE_EXTRACTOR_DIAGRAM_CONSUMPTION_HOLD.md). |
| P1 | **SH-02–SH-06**, **SH-11–SH-25** | Help articles + search still Architecture-job mismatched | **Partial** | M–L | Resolver pattern from **SH-01** exists; article bodies and some Learn-more maps may still teach first architecture review. Index: [securenow-help-00-index.md](../../.cursor/prompts/securenow-help-00-index.md). |
| P2 | **IE-RF** | Relationship-first topology (network associations) | **Backlog** | L | Catalog-driven associations; complements diagrams — see [`AZURE_EXTRACTOR_TECHNICAL_BACKLOG.md`](../library/AZURE_EXTRACTOR_TECHNICAL_BACKLOG.md) item 7. |
| P2 | **Extractor parity** | Cost, Advisor, orphans, NIC/PE inventory depth | **Backlog** | M | Same extractor discipline; SecureNow inventory workbenches consume output. |
| P2 | **IDA / IDL / IDS / IDT** | Inventory diagram layout and Graphviz forest | **Backlog** | L | Executive forest packing — see `.cursor/prompts/inventory-diagram-*-00-index.md`. Not a SecureNow-only codepath but blocks “all-day” diagram UX. |
| P2 | **TB-2400** | Second HTTP host **compile check** (`SecureNow.Api` facade subset) | **Backlog** | L | Owner pickup only — [`TECH_BACKLOG_TB2400_INDEX.md`](../library/TECH_BACKLOG_TB2400_INDEX.md). |
| P3 | **TB-2401** | Product-line catalog / DDL split | **Backlog** | XL | Last cut; requires integration contract — same index. |
| P3 | **SN-08** | Platform rename hold (namespaces, domains) | **Hold** | — | Do not implement from agent sessions. |

### SecureNow-specific follow-ons (after baseline)

| ID | Title | Status | Trigger |
|----|-------|--------|---------|
| **SN-RT-ops** | Hosted auto-pull includes new companions by default | **Backlog** | When operators expect LAW/SQL principal companions without Tier-1 flags — document in runbook first. |
| **SN-PE-regression** | Golden fixtures for new association types | **Partial** | Add AST tests when AX-DE catalog grows — do not reopen SN-PE collection. |
| **SA-19/SA-20** | Entra Graph + CI federated **adapters** fail-soft | **Partial** | Inventory files exist; Graph forbidden → warnings. Deep adapter work only on owner row. |
| **SA-16+** | Path workbench polish (factory queue ↔ inspector) | **Partial** | Core inspector shipped; UX cohesion with remediation factory is incremental. |

---

## Composer prompt indexes

Paste **one** file per session from the repo root (Cloud Agent: `pwsh` + working-tree check per [`AGENTS.md`](../../AGENTS.md)).

| Wave | Index | Prompt IDs | Architecture doc |
|------|-------|------------|------------------|
| Consumer brand | [securenow-brand-00-index.md](../../.cursor/prompts/securenow-brand-00-index.md) | **SN-01–SN-08** | [`SECURENOW_CONSUMER_BRAND_COMPOSER_PROMPTS.md`](../architecture/SECURENOW_CONSUMER_BRAND_COMPOSER_PROMPTS.md) |
| Help job-match | [securenow-help-00-index.md](../../.cursor/prompts/securenow-help-00-index.md) | **SH-01–SH-26** | [`SECURENOW_HELP_PAGE_COMPOSER_PROMPTS.md`](../architecture/SECURENOW_HELP_PAGE_COMPOSER_PROMPTS.md) |
| Architect engines | [securenow-architect-00-index.md](../../.cursor/prompts/securenow-architect-00-index.md) | **SA-01–SA-22** | [`SECURENOW_ARCHITECT_COMPOSER_PROMPTS.md`](../architecture/SECURENOW_ARCHITECT_COMPOSER_PROMPTS.md) |
| Data flow compile | [securenow-data-flow-00-index.md](../../.cursor/prompts/securenow-data-flow-00-index.md) | **SN-DF-01–SN-DF-09** | [`SECURENOW_DATA_FLOW_DIAGRAM_COMPOSER_PROMPTS.md`](../architecture/SECURENOW_DATA_FLOW_DIAGRAM_COMPOSER_PROMPTS.md) |
| Probable evidence | [securenow-probable-evidence-00-index.md](../../.cursor/prompts/securenow-probable-evidence-00-index.md) | **SN-PE-01–SN-PE-HOLD** | [`SECURENOW_PROBABLE_EVIDENCE_DATA_FLOW_COMPOSER_PROMPTS.md`](../architecture/SECURENOW_PROBABLE_EVIDENCE_DATA_FLOW_COMPOSER_PROMPTS.md) |
| Runtime connections | [securenow-runtime-connection-00-index.md](../../.cursor/prompts/securenow-runtime-connection-00-index.md) | **SN-RT-01–SN-RT-13** | [`SECURENOW_RUNTIME_CONNECTION_COMPOSER_PROMPTS.md`](../architecture/SECURENOW_RUNTIME_CONNECTION_COMPOSER_PROMPTS.md) |

---

## Wave detail tables

### SN — Consumer brand (**SN-01–SN-08**)

| ID | Title | Status |
|----|-------|--------|
| SN-01 | Display-name helper + chrome | **Shipped** |
| SN-02 | Cloud connector copy | **Shipped** |
| SN-03 | Admin / auth / integrations copy | **Shipped** |
| SN-04 | Product-line-aware help rewrite | **Shipped** |
| SN-05 | Emails / exports / ITSM bodies | **Shipped** |
| SN-06 | Trust pages (product vs company) | **Shipped** |
| SN-07 | CI ArchLucid leak ratchet | **Shipped** |
| SN-08 | Hold — no platform rename | **Hold** |

### SH — Help job-match (**SH-01–SH-26**)

| ID | Focus | Status |
|----|-------|--------|
| SH-01 | Resolver / Learn more product-line branch | **Shipped** |
| SH-02 | `/help/getting-started` | **Backlog** |
| SH-03 | Findings help + page | **Backlog** |
| SH-04 | Assigned-to-me queue | **Backlog** |
| SH-05 | Policy packs | **Backlog** |
| SH-06 | Standards and rules | **Backlog** |
| SH-07 | Remediation factory drawer | **Shipped** |
| SH-08 | Remediation patterns | **Shipped** |
| SH-09 | Audit evidence lineage | **Shipped** |
| SH-10 | Infrastructure hub | **Shipped** |
| SH-11–SH-17 | Infrastructure workbenches | **Partial** (contextual rows; articles vary) |
| SH-18 | Cloud connections (Azure-only Security) | **Backlog** |
| SH-19 | Users and roles | **Backlog** |
| SH-20 | Billing and plans (exclude from Security hub) | **Shipped** (hub/search exclusion) |
| SH-21–SH-24 | Data handling, integrations, onboarding, troubleshooting | **Backlog** |
| SH-25 | Help hub + search catalog | **Partial** |
| SH-26 | Infrastructure drift (Azure-only copy) | **Shipped** |

### SA — Architect plane (**SA-01–SA-22**)

| ID | Title | Status |
|----|-------|--------|
| SA-01 | Path domain + hops | **Shipped** |
| SA-02 | Security evidence graph edges | **Shipped** |
| SA-03 | Privilege-path engine | **Shipped** |
| SA-04 | Path inspector API | **Shipped** |
| SA-05 | Intended reachability | **Shipped** |
| SA-06 | Toxic combinations | **Shipped** |
| SA-07 | Capability-to-flow | **Shipped** |
| SA-08 | Shared-control blast radius | **Shipped** |
| SA-09 | Path ranking dimensions | **Shipped** |
| SA-10 | Cut points | **Shipped** |
| SA-11 | Architecture-outcome metrics | **Shipped** |
| SA-12 | Four-reality drift | **Shipped** |
| SA-13 | Incremental neighborhood invalidation | **Shipped** |
| SA-14 | Path-aware remediation narrative | **Shipped** |
| SA-15 | Organizational routing fields | **Shipped** |
| SA-16 | Findings queue + path inspect workbench | **Shipped** |
| SA-17 | Constrained AI explanation | **Shipped** |
| SA-18 | Human asset assertions | **Shipped** |
| SA-19 | Federated CI adapter | **Partial** (inventory + warnings) |
| SA-20 | Entra group adapter | **Partial** (inventory + warnings) |
| SA-21 | Honesty copy templates | **Shipped** |
| SA-22 | Hold — no apply / mega-graph / coverage engines | **Hold** |

### SN-DF — Data architecture / data flow (**SN-DF-01–SN-DF-09**)

| ID | Title | Status |
|----|-------|--------|
| SN-DF-01 | External ADF source nodes | **Shipped** |
| SN-DF-02 | Stage catalog | **Shipped** |
| SN-DF-03 | `DiagramMode.DataFlow` compile | **Shipped** |
| SN-DF-04 | Honesty legend (declared, not traffic) | **Shipped** |
| SN-DF-05 | Workbench mode + Ask allowlist | **Shipped** |
| SN-DF-06 | Data Architecture compile | **Shipped** |
| SN-DF-07 | Mermaid / AST contract tests | **Shipped** |
| SN-DF-08 | Empty-stage honesty | **Shipped** |
| SN-DF-09 | Hold (TLS, classification, process DFDs) | **Hold** |

### SN-PE — Probable evidence families (**SN-PE-01–07**)

| ID | Title | Status |
|----|-------|--------|
| SN-PE-01 | Evidence family catalog | **Shipped** |
| SN-PE-02 | Application + messaging stages | **Shipped** |
| SN-PE-03 | Data Flow family filter | **Shipped** |
| SN-PE-04 | PE reachable DNS join | **Shipped** |
| SN-PE-05 | Messaging RBAC direction | **Shipped** |
| SN-PE-06 | Honesty + ordinal bands | **Shipped** |
| SN-PE-07 | Golden mermaid contract | **Shipped** |
| SN-PE-HOLD | Numeric confidence, Kudu, naive PE | **Hold** |

### SN-RT — Runtime declared / observed (**SN-RT-01–13**)

| ID | Option | Title | Status |
|----|--------|-------|--------|
| SN-RT-01 | A | Container Apps env companion | **Shipped** |
| SN-RT-02 | A | Setting value parser | **Shipped** |
| SN-RT-03 | A | SQL catalog + ingress FQDN | **Shipped** |
| SN-RT-04 | A | PaaS hosts and stages | **Shipped** |
| SN-RT-05 | A | RBAC allowlist (Queue/OpenAI/Search) | **Shipped** |
| SN-RT-06 | B | Log Analytics companion | **Shipped** (Tier-1 opt-in) |
| SN-RT-07 | B | Observed family on canvas | **Shipped** |
| SN-RT-08 | C | SQL `sys.database_principals` names | **Shipped** (opt-in) |
| SN-RT-09 | D | Uploaded config parsers | **Shipped** |
| SN-RT-10 | D | Operator confirm → HumanAssertion | **Shipped** |
| SN-RT-12 | E | Inference questionnaire items | **Shipped** |
| SN-RT-13 | E | Questionnaire UI (Yes/No/Skip) | **Shipped** |
| SN-RT-14 | D/E | OP-01 map row for operator-inferred connections controller | **Shipped** |
| SN-RT-HOLD | — | Secret persistence, auto-answer, merge observed into May access | **Hold** |

---

## Design references (this folder)

| Document | Use when |
|----------|----------|
| [`DATA_ARCHITECTURE_AND_DATA_FLOW_DIAGRAMS.md`](DATA_ARCHITECTURE_AND_DATA_FLOW_DIAGRAMS.md) | Three diagram types; first slice vs gold standard |
| [`EVIDENCE_BASED_PROBABLE_DATA_FLOWS.md`](EVIDENCE_BASED_PROBABLE_DATA_FLOWS.md) | Diagram 3 evidence families; ordinal bands |
| [`RUNTIME_DECLARED_AND_OBSERVED_DATA_FLOWS.md`](RUNTIME_DECLARED_AND_OBSERVED_DATA_FLOWS.md) | Options A–E for empty Container Apps canvas |
| [`ARCHLUCID_DEV_DATA_FLOW_CONNECTION_REFERENCE.md`](ARCHLUCID_DEV_DATA_FLOW_CONNECTION_REFERENCE.md) | Expected DEV edges from IaC (not observed traffic) |

---

## Maintenance

- After a wave ships, update the **Shipped baseline** table and the matching wave detail row in the same PR as the code (or in a docs-only follow-up).
- Do not duplicate full TB row prose for **TB-2400** / **TB-2401** — link [`TECH_BACKLOG_TB2400_INDEX.md`](../library/TECH_BACKLOG_TB2400_INDEX.md).
- [`../library/AZURE_EXTRACTOR_TECHNICAL_BACKLOG.md`](../library/AZURE_EXTRACTOR_TECHNICAL_BACKLOG.md) items **10–11** are superseded by the SN-PE / SN-RT sections here once shipped; keep the extractor file focused on ZIP ingest and AX-DC.

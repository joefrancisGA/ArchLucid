> **Scope:** Contributor-reference — consolidated engineering backlog for the **SecureNow** Security product line (consumer shell + infra-evidence architect engines + diagram honesty). Not procurement copy, not GTM **M-90 / M-44 / M-91 / M-92**, and not **TB-135 / TB-136** assurance programs.
> **Spine:** [`README.md`](README.md) · **Monorepo TB index:** [`../library/TECH_BACKLOG.md`](../library/TECH_BACKLOG.md) · **Architect contract:** [`../library/SECURENOW_ARCHITECT_PLANE.md`](../library/SECURENOW_ARCHITECT_PLANE.md)

# SecureNow — technical backlog

**Audience:** Francis Architecture LLC owner and coding agents scoping SecureNow work.

**Last reconciled:** 2026-10-18 (added **SN-PERF-11** and **13–16** prompts — not implemented. **06–10** and **12** shipped in code without paste files. **11** was not shipped). Prior 2026-10-16 (marked **SN-VF-01–05**, **RTA-01–07**, and **AX-DC-02–08** shipped on trunk; **MB-EH** / **MB-SB** messaging behavior shipped). Prior 2026-10-16 (trunk scan: **DIC-01–05**, **DMW-01–02**, **RUR-01–03**, **SN-QQ-01–10**, **DCU-01–05**, and **SH-01–SH-26** help job-match closed — do not greenfield). Prior 2026-10-15 (marked **SH-03** shipped — SecureNow findings help + `/governance/findings` drawer). Prior 2026-10-15 (marked **SH-02** shipped — SecureNow `/help/getting-started` job-match). Prior 2026-10-15 (marked **SN-HOME-01–06** shipped on trunk — SecureNow Home work summary). Prior 2026-10-14 (marked **SN-HAND-09–10** shipped — gap 4 latest remediation attempt on Audit evidence lineage). Prior 2026-10-13 (marked **SN-HAND-05–08** shipped; gaps 1–3 baseline in `ENGINEER_ANALYST_HANDOFF.md`). Prior 2026-10-12 (added **RUR-01–RUR-03** + hold — role display name, counted plain-language `rbac-role-unmapped` warning, and a read / write / nothing question for one app and one resource; prompts only). Prior same day (added **SN-HOME-01–SN-HOME-06** + hold — SecureNow Home work summary, environment freshness, outcome copy, and visible labels; prompts only). Prior 2026-10-06 (added **SN-QQ-09** and **SN-QQ-10** — resource identity on the question card, then a readable open-question count; prompts only). Prior 2026-10-04 (added **DIC-01–DIC-05** + hold — import a customer drawing and compare it to an inventory capture without a sealed review; prompts only). Prior 2026-10-03 (added **SN-QQ-08** — map the questions controller so Diagrams stops 500ing `Unmapped API controller`; prompts only. Prior same day added **SN-QQ-07** — a failed question-queue load shows the API reason; prompts only. Prior same day added **DCU-01–DCU-05** + hold and **SN-QQ-01–SN-QQ-06** + hold; prompts only). Prior 2026-09-20 (trunk scan + prompt indexes under `.cursor/prompts/securenow-*`).

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
| **Help job-match** | **SH-01–SH-26** | Product-line contextual help, infrastructure workbench guides, Security hub/search exclusions. Do not greenfield. Index: [securenow-help-00-index.md](../../.cursor/prompts/securenow-help-00-index.md). |
| **Diagram import comparison** | **DIC-01–DIC-05** | Advisory snapshot compare (`/v1/infrastructure/diagram-comparisons`), confirmed mappings, connector gaps, count strip + CSV, imported-drawing overlay. Do not greenfield. |
| **Diagram matcher warnings** | **DMW-01–DMW-02** | Usage-gated `pe-reachable-dns-link-missing`; private-link / Key Vault / storage queue-table-file host targets. Do not greenfield. |
| **RBAC unmapped role** | **RUR-01–RUR-03** | `RoleDefinitionName` on snapshot, counted `rbac-role-unmapped` warnings, unmapped data-plane read/write/nothing questionnaire. Do not greenfield. |
| **Subscription question queue** | **SN-QQ-01–SN-QQ-10** | Disposition store/API, hero + bar, pack questions, failure reasons, questions controller map, resource identity + neighborhood, open-count CTA. Do not greenfield. |
| **Diagram consumption UX** | **DCU-01–DCU-05** | Connector click → evidence panel, one stroke legend, evidence-family chips, PNG reading strip, node connection hint. Do not greenfield. |
| **Verification honesty** | **SN-VF-01–SN-VF-05** | Chronology + `Succeeded` capture, path-analysis fail-closed, substantive postconditions, `ChangeImplemented` attestation, workbench labels. Do not greenfield. |
| **Reconciliation to action** | **RTA-01–RTA-07** | Finding reload, security-only finding gate, documentation decisions, later-capture check, diagram fingerprint, absent subjects, sealed-path decisions. Do not greenfield. |
| **Diagram consumption (extractor)** | **AX-DC-02–08** | Authorization endpoint inclusion, confidence strokes, completeness warnings, edge inspector, hosted Tier-1 honesty (see extractor backlog item 9). Do not greenfield. |
| **Messaging behavior** | **MB-EH**, **MB-SB** | Event Hub / Service Bus broker verbs on visible cards. Do not greenfield. |
| **Engineer–analyst handoff (gaps 4–5)** | **SN-HAND-05–SN-HAND-10** | Gap 5: verified remediation association row (identifiers only) — table, verify write, lineage read, Audit evidence + Remediation tracker UI. Gap 4: `latestRemediationAttempt` on lineage + Audit evidence spine row. Gaps 1–3 UI slices pre-existed. Do not greenfield. |
| **SecureNow Home work summary** | **SN-HOME-01–SN-HOME-06** | Short lead, environment context line, four counted work links, outcome directory copy, wrapping sidebar labels + SecureNow route titles, compact directory tables (`SecureNowHomeEnvironmentContext`, `SecureNowHomeWorkSummary`, `SecureNowHomeDestinationSection`). Do not greenfield. |

**Holds (active):** [`SECURENOW_ARCHITECT_HOLD.md`](../library/SECURENOW_ARCHITECT_HOLD.md) (**SA-22**), [`SECURENOW_PROBABLE_EVIDENCE_HOLD.md`](../library/SECURENOW_PROBABLE_EVIDENCE_HOLD.md), [`SECURENOW_RUNTIME_CONNECTION_HOLD.md`](../library/SECURENOW_RUNTIME_CONNECTION_HOLD.md), [`SECURENOW_DATA_FLOW` hold via SN-DF-09](../architecture/SECURENOW_DATA_FLOW_DIAGRAM_COMPOSER_PROMPTS.md).

---

## Prioritized remaining backlog

Ordered for SecureNow operator value after the shipped baseline. Size is engineering relative (S/M/L/XL), not calendar.

| Pri | ID | Title | Status | Size | Notes |
|-----|-----|-------|--------|------|-------|
| — | **SN-HAND-05–10** + hold | Engineer–analyst handoff (gaps 4–5) | **Shipped** | — | On trunk. Do not greenfield. Index: [`SECURENOW_ENGINEER_ANALYST_HANDOFF_LUNA_PROMPTS.md`](../architecture/SECURENOW_ENGINEER_ANALYST_HANDOFF_LUNA_PROMPTS.md). |
| — | **SN-HOME-01–06** + hold | SecureNow Home work summary | **Shipped** | — | On trunk. Do not greenfield. Index: [`SECURENOW_HOME_WORK_SUMMARY_LUNA_PROMPTS.md`](../architecture/SECURENOW_HOME_WORK_SUMMARY_LUNA_PROMPTS.md). |
| — | **DIC-01–05** + hold | Diagram import comparison | **Shipped** | — | On trunk. Do not greenfield. Index: [`DIAGRAM_IMPORT_COMPARISON_LUNA_PROMPTS.md`](../architecture/DIAGRAM_IMPORT_COMPARISON_LUNA_PROMPTS.md). |
| — | **DMW-01–02** | Diagram matcher warnings | **Shipped** | — | On trunk. Do not greenfield. Index: [`DIAGRAM_MATCHER_WARNING_LUNA_PROMPTS.md`](../architecture/DIAGRAM_MATCHER_WARNING_LUNA_PROMPTS.md). |
| — | **RUR-01–03** + hold | RBAC unmapped role | **Shipped** | — | On trunk. Do not greenfield. Index: [`RBAC_UNMAPPED_ROLE_LUNA_PROMPTS.md`](../architecture/RBAC_UNMAPPED_ROLE_LUNA_PROMPTS.md). |
| — | **SN-QQ-01–10** + hold | Subscription question queue | **Shipped** | — | On trunk. Do not greenfield. Index: [`SECURENOW_QUESTION_QUEUE_LUNA_PROMPTS.md`](../architecture/SECURENOW_QUESTION_QUEUE_LUNA_PROMPTS.md). |
| — | **DCU-01–05** + hold | Diagram consumption UX | **Shipped** | — | On trunk. Do not greenfield. Index: [`DIAGRAM_CONSUMPTION_UX_COMPOSER_PROMPTS.md`](../architecture/DIAGRAM_CONSUMPTION_UX_COMPOSER_PROMPTS.md). |
| — | **SH-01–SH-26** | Help job-match | **Shipped** | — | On trunk. Do not greenfield. Index: [securenow-help-00-index.md](../../.cursor/prompts/securenow-help-00-index.md). |
| — | **AX-DC-02–08** + hold | Executive / Identity / Data diagram **consumption** | **Shipped** | — | On trunk. Do not greenfield. Extractor index: [`AZURE_EXTRACTOR_TECHNICAL_BACKLOG.md`](../library/AZURE_EXTRACTOR_TECHNICAL_BACKLOG.md) item 9. |
| — | **SN-VF-01–05** | Verification honesty | **Shipped** | — | On trunk. Do not greenfield. |
| — | **RTA-01–07** + hold | Reconciliation to action | **Shipped** | — | On trunk (#4511–#4549). Do not greenfield. Index: [`RECONCILIATION_TO_ACTION_LUNA_PROMPTS.md`](../architecture/RECONCILIATION_TO_ACTION_LUNA_PROMPTS.md). |
| — | **MB-EH**, **MB-SB** | Messaging behavior on diagrams | **Shipped** | — | On trunk. Do not greenfield. Index: [`MESSAGING_BEHAVIOR_COMPOSER_PROMPTS.md`](../architecture/MESSAGING_BEHAVIOR_COMPOSER_PROMPTS.md). |
| P1 | **SN-PERF-01–05** + hold | Home counts, snapshot round trip, path-search buffer, neighborhood suffix index, toxic pair index | **Shipped** | M | Index: [`SECURENOW_PERFORMANCE_LUNA_PROMPTS.md`](../architecture/SECURENOW_PERFORMANCE_LUNA_PROMPTS.md). |
| P1 | **SN-PERF-06–10**, **12** | Batched path hops, factory match batch, prioritization prefetch, snapshot header batch, question graph reuse, wave instance lookup | **Shipped** | M | In code. No paste file. Do not greenfield. |
| P1 | **SN-PERF-11**, **13–16** | Unchanged drift resources, factory aggregates, inspector finding ids, inventory rows, shared header SQL | **Backlog** | M | Paste one file per session. Index: [`SECURENOW_PERFORMANCE_LUNA_PROMPTS.md`](../architecture/SECURENOW_PERFORMANCE_LUNA_PROMPTS.md). |
| P1 | **SN-PERF-17–19** | Question header lookup, ranked-path batch, architect outcome counts | **Shipped** | M | In code. No paste file. Do not greenfield. |
| P1 | **SN-PERF-20–24** | Evidence-hub resource slice, hub terraform and changes, preflight tags, instance-list seal batch, snapshot-list seal batch | **Backlog** | M | Prompts only. Do not implement from the index. |
| P2 | **IE-RF** | Relationship-first topology (network associations) | **Backlog** | L | Catalog-driven associations; complements diagrams — see [`AZURE_EXTRACTOR_TECHNICAL_BACKLOG.md`](../library/AZURE_EXTRACTOR_TECHNICAL_BACKLOG.md) item 7. |
| P2 | **Extractor parity** | Cost, Advisor, orphans, NIC/PE inventory depth | **Backlog** | M | Same extractor discipline; SecureNow inventory workbenches consume output. |
| P2 | **IDA / IDL / IDS / IDT** | Inventory diagram layout and Graphviz forest | **Backlog** | L | Executive forest packing — see `.cursor/prompts/inventory-diagram-*-00-index.md`. Not a SecureNow-only codepath but blocks “all-day” diagram UX. |
| P2 | **TB-2400** | Second HTTP host **compile check** (`SecureNow.Api` facade subset) | **Backlog** | L | Owner pickup only — [`TECH_BACKLOG_TB2400_INDEX.md`](../library/TECH_BACKLOG_TB2400_INDEX.md). |
| P3 | **TB-2401** | Product-line catalog / DDL split | **Backlog** | XL | Last cut; requires integration contract — same index. |
| P1/P2 | **TB-2409–TB-2412** | Engine-strength follow-ons | **Backlog** | M–XL | **TB-2409** stable-conclusion gate; **TB-2410** ordered remediation paths; **TB-2411** adaptive analysis depth; **TB-2412** proposed-state what-if planning. Directional mutations and bounded path oracles are already implemented as test-only coverage; paired engine-strength evaluation is **TB-2408** in the monorepo backlog. |
| P1/P3 | **TB-2413–TB-2416** | Future causal-search product | **Backlog** | M–XL | **TB-2413** N-1/N-2 contingency propagation; **TB-2414** information-gain investigation order; **TB-2415** Pareto alternatives; **TB-2416** requirements-constrained synthesis. Current-product diagnosis is SN-QA-03 and SN-QA-04, not these rows. |
| P3 | **SN-08** | Platform rename hold (namespaces, domains) | **Hold** | — | Do not implement from agent sessions. |

### SecureNow-specific follow-ons (after baseline)

| ID | Title | Status | Trigger |
|----|-------|--------|---------|
| **SN-RT-ops** | Hosted auto-pull includes new companions by default | **Backlog** | When operators expect LAW/SQL principal companions without Tier-1 flags — document in runbook first. |
| **SN-PE-regression** | Golden fixtures for new association types | **Partial** | Add AST tests when AX-DE catalog grows — do not reopen SN-PE collection. |
| **SA-19/SA-20** | Entra Graph + CI federated **adapters** fail-soft | **Partial** | Inventory files exist; Graph forbidden → warnings. Deep adapter work only on owner row. |
| **SA-16+** | Path workbench polish (factory queue ↔ inspector) | **Shipped** | Core inspector, `findingId` URL cursor, Alt+I + command palette, header shortcut rows, and `SECURENOW_PATH_INSPECT_WORKBENCH.md` across remediation factory, SecureNow Findings, and Assigned to me. |

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
| Verification honesty | [securenow-verification-00-index.md](../../.cursor/prompts/securenow-verification-00-index.md) | **SN-VF-01–SN-VF-05** | [`SECURENOW_VERIFICATION_HONESTY_LUNA_PROMPTS.md`](../architecture/SECURENOW_VERIFICATION_HONESTY_LUNA_PROMPTS.md) |
| Question queue | [securenow-question-queue-00-index.md](../../.cursor/prompts/securenow-question-queue-00-index.md) | **SN-QQ-01–SN-QQ-10** + hold | [`SECURENOW_QUESTION_QUEUE_LUNA_PROMPTS.md`](../architecture/SECURENOW_QUESTION_QUEUE_LUNA_PROMPTS.md) |
| Diagram consumption UX | [diagram-consumption-ux-00-index.md](../../.cursor/prompts/diagram-consumption-ux-00-index.md) | **DCU-01–DCU-05** + hold | [`DIAGRAM_CONSUMPTION_UX_COMPOSER_PROMPTS.md`](../architecture/DIAGRAM_CONSUMPTION_UX_COMPOSER_PROMPTS.md) |
| Diagram import comparison | [diagram-import-comparison-00-index.md](../../.cursor/prompts/diagram-import-comparison-00-index.md) | **DIC-01–DIC-05** + hold | [`DIAGRAM_IMPORT_COMPARISON_LUNA_PROMPTS.md`](../architecture/DIAGRAM_IMPORT_COMPARISON_LUNA_PROMPTS.md) |
| Diagram matcher warnings | [diagram-matcher-warning-00-index.md](../../.cursor/prompts/diagram-matcher-warning-00-index.md) | **DMW-01–DMW-02** | [`DIAGRAM_MATCHER_WARNING_LUNA_PROMPTS.md`](../architecture/DIAGRAM_MATCHER_WARNING_LUNA_PROMPTS.md) |
| Home work summary | [securenow-home-00-index.md](../../.cursor/prompts/securenow-home-00-index.md) | **SN-HOME-01–06** shipped + hold | [`SECURENOW_HOME_WORK_SUMMARY_LUNA_PROMPTS.md`](../architecture/SECURENOW_HOME_WORK_SUMMARY_LUNA_PROMPTS.md) |
| Engineer-to-analyst handoff, gaps 4–5 | [securenow-handoff-00-index.md](../../.cursor/prompts/securenow-handoff-00-index.md) | **SN-HAND-05–10** shipped + hold | [`SECURENOW_ENGINEER_ANALYST_HANDOFF_LUNA_PROMPTS.md`](../architecture/SECURENOW_ENGINEER_ANALYST_HANDOFF_LUNA_PROMPTS.md) |
| RBAC unmapped role | [rbac-unmapped-role-00-index.md](../../.cursor/prompts/rbac-unmapped-role-00-index.md) | **RUR-01–RUR-03** + hold | [`RBAC_UNMAPPED_ROLE_LUNA_PROMPTS.md`](../architecture/RBAC_UNMAPPED_ROLE_LUNA_PROMPTS.md) |
| Performance reads | [securenow-performance-00-index.md](../../.cursor/prompts/securenow-performance-00-index.md) | **SN-PERF-01–05** shipped; **11**, **13–16** backlog + hold | [`SECURENOW_PERFORMANCE_LUNA_PROMPTS.md`](../architecture/SECURENOW_PERFORMANCE_LUNA_PROMPTS.md) |
| Procurement pack | [securenow-procurement-00-index.md](../../.cursor/prompts/securenow-procurement-00-index.md) | **SN-PROC-01–09** shipped + hold | [`SECURENOW_PROCUREMENT_COMPOSER_PROMPTS.md`](../architecture/SECURENOW_PROCUREMENT_COMPOSER_PROMPTS.md) |

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
| SH-02 | `/help/getting-started` | **Shipped** |
| SH-03 | Findings help + page | **Shipped** |
| SH-04 | Assigned-to-me queue | **Shipped** |
| SH-05 | Policy packs | **Shipped** |
| SH-06 | Standards and rules | **Shipped** |
| SH-07 | Remediation factory drawer | **Shipped** |
| SH-08 | Remediation patterns | **Shipped** |
| SH-09 | Audit evidence lineage | **Shipped** |
| SH-10 | Infrastructure hub | **Shipped** |
| SH-11–SH-17 | Infrastructure workbenches | **Shipped** (SH-11–SH-17 guided help + topic maps) |
| SH-18 | Cloud connections (Azure-only Security) | **Shipped** |
| SH-19 | Users and roles | **Shipped** |
| SH-20 | Billing and plans (exclude from Security hub) | **Shipped** (hub/search exclusion) |
| SH-21 | Data handling | **Shipped** |
| SH-22 | Integration readiness | **Shipped** |
| SH-23 | Enterprise onboarding | **Shipped** |
| SH-24 | Troubleshooting | **Shipped** |
| SH-25 | Help hub + search catalog | **Shipped** |
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

### SN-VF — Verification honesty (**SN-VF-01–SN-VF-05**)

Settled scope: [`OPENAI_ASTRA_SGS_REVIEW_2026-09-27_AND_RESPONSE.md`](OPENAI_ASTRA_SGS_REVIEW_2026-09-27_AND_RESPONSE.md) Part 2. Index: [`../architecture/SECURENOW_VERIFICATION_HONESTY_LUNA_PROMPTS.md`](../architecture/SECURENOW_VERIFICATION_HONESTY_LUNA_PROMPTS.md). **Shipped** on trunk.

| ID | Title | Status |
|----|-------|--------|
| SN-VF-01 | Chronology and `Succeeded` capture | **Shipped** |
| SN-VF-02 | Path absence requires completed analysis | **Shipped** |
| SN-VF-03 | Substantive postcondition required | **Shipped** |
| SN-VF-04 | Attested `ChangeImplemented` | **Shipped** |
| SN-VF-05 | Workbench labels and Close affordance | **Shipped** |

### RTA — Reconciliation to action (**RTA-01–RTA-07**)

Index: [`../architecture/RECONCILIATION_TO_ACTION_LUNA_PROMPTS.md`](../architecture/RECONCILIATION_TO_ACTION_LUNA_PROMPTS.md). **Shipped** on trunk.

| ID | Title | Status |
|----|-------|--------|
| RTA-01 | Reload operational finding by natural key | **Shipped** |
| RTA-02 | Security-only operational finding gate | **Shipped** |
| RTA-03 | Documentation decision (not a finding) | **Shipped** |
| RTA-04 | Later-capture decision check | **Shipped** |
| RTA-05 | Diagram fingerprint scopes decisions | **Shipped** |
| RTA-06 | Absent-subject decision list | **Shipped** |
| RTA-07 | Sealed-path documentation decisions | **Shipped** |
| RTA-HOLD | Stop list | **Hold** |

### DIC — Diagram import comparison (**DIC-01–DIC-05**)

Index: [`DIAGRAM_IMPORT_COMPARISON_LUNA_PROMPTS.md`](../architecture/DIAGRAM_IMPORT_COMPARISON_LUNA_PROMPTS.md). Do not implement from the index. **Shipped** on trunk.

| ID | Title | Status |
|----|-------|--------|
| DIC-01 | Advisory compare without a sealed architecture review | **Shipped** |
| DIC-02 | Saved architect mapping wins over label parser | **Shipped** |
| DIC-03 | Structural connector gaps when both ends match | **Shipped** |
| DIC-04 | Count strip, grouped inventory-only rows, CSV export | **Shipped** |
| DIC-05 | Imported drawing overlay by match kind | **Shipped** |
| DIC-HOLD | Stop list | **Hold** |

### DMW — Diagram matcher warnings (**DMW-01–DMW-02**)

Index: [`DIAGRAM_MATCHER_WARNING_LUNA_PROMPTS.md`](../architecture/DIAGRAM_MATCHER_WARNING_LUNA_PROMPTS.md). **Shipped** on trunk.

| ID | Title | Status |
|----|-------|--------|
| DMW-01 | Usage-gated `pe-reachable-dns-link-missing` | **Shipped** |
| DMW-02 | Private-link, Key Vault, and storage queue/table/file hosts | **Shipped** |

### RUR — RBAC unmapped role (**RUR-01–RUR-03**)

Index: [`RBAC_UNMAPPED_ROLE_LUNA_PROMPTS.md`](../architecture/RBAC_UNMAPPED_ROLE_LUNA_PROMPTS.md). **Shipped** on trunk.

| ID | Title | Status |
|----|-------|--------|
| RUR-01 | Role display name on package and snapshot | **Shipped** |
| RUR-02 | Counted plain-language `rbac-role-unmapped` warning | **Shipped** |
| RUR-03 | Read / write / nothing for unmapped data-plane role | **Shipped** |
| RUR-HOLD | Stop list | **Hold** |

### DCU — Diagram consumption UX (**DCU-01–DCU-05**)

Index: [`DIAGRAM_CONSUMPTION_UX_COMPOSER_PROMPTS.md`](../architecture/DIAGRAM_CONSUMPTION_UX_COMPOSER_PROMPTS.md). **Shipped** on trunk.

| ID | Title | Status |
|----|-------|--------|
| DCU-01 | Connector click opens evidence panel | **Shipped** |
| DCU-02 | One stroke legend | **Shipped** |
| DCU-03 | Evidence-family chips | **Shipped** |
| DCU-04 | PNG reading strip | **Shipped** |
| DCU-05 | Node focus connection hint | **Shipped** |
| DCU-HOLD | Stop list | **Hold** |

### SN-QQ — Subscription question queue (**SN-QQ-01–SN-QQ-10**)

Index: [`../architecture/SECURENOW_QUESTION_QUEUE_LUNA_PROMPTS.md`](../architecture/SECURENOW_QUESTION_QUEUE_LUNA_PROMPTS.md). Do not implement from the index. **Shipped** on trunk.

| ID | Title | Status |
|----|-------|--------|
| SN-QQ-01 | Disposition store and API across snapshots | **Shipped** |
| SN-QQ-02 | Emit a question only when the answer changes the next action | **Shipped** |
| SN-QQ-03 | Hero and one-at-a-time drawer | **Shipped** |
| SN-QQ-04 | Outline Answer / Review shortcut | **Shipped** |
| SN-QQ-05 | Pack questions, including questions with no node | **Shipped** |
| SN-QQ-06 | Expiring HumanAssertion; ignore does not change the diagram | **Shipped** |
| SN-QQ-07 | Failed load shows the API reason; a GET does not use the governance save copy | **Shipped** |
| SN-QQ-08 | Map the questions controller so Diagrams stops 500ing `Unmapped API controller` | **Shipped** |
| SN-QQ-09 | Name the resource, say why SecureNow is asking, and show its neighborhood | **Shipped** |
| SN-QQ-10 | Open-question count: `Action needed`, medium helper type, outline `Review questions` | **Shipped** |
| SN-QQ-HOLD | Stop list | **Hold** |

### SN-HOME — SecureNow Home work summary (**SN-HOME-01–SN-HOME-06**)

Index: [`SECURENOW_HOME_WORK_SUMMARY_LUNA_PROMPTS.md`](../architecture/SECURENOW_HOME_WORK_SUMMARY_LUNA_PROMPTS.md). Do not implement from the index. **Shipped** on trunk.

| ID | Title | Status |
|----|-------|--------|
| SN-HOME-01 | Short Home lead and claim discipline | **Shipped** |
| SN-HOME-02 | Environment and collection freshness line | **Shipped** |
| SN-HOME-03 | Your work — four counted links | **Shipped** |
| SN-HOME-04 | Directory outcome copy and sidebar labels | **Shipped** |
| SN-HOME-05 | Wrapping sidebar labels; SecureNow route titles | **Shipped** |
| SN-HOME-06 | Compact directory (sr-only column headers) | **Shipped** |
| SN-HOME-HOLD | Stop list | **Hold** |

### SN-HAND — Verified remediation association and latest attempt (**SN-HAND-05–SN-HAND-10**)

Design note: [`ENGINEER_ANALYST_HANDOFF.md`](ENGINEER_ANALYST_HANDOFF.md). Do not implement from the index. Gaps 4–5 (**SN-HAND-05–10**) are **shipped** on trunk.

| ID | Title | Status |
|----|-------|--------|
| SN-HAND-05 | Association table and repository | **Shipped** |
| SN-HAND-06 | Write the row when verification passes | **Shipped** |
| SN-HAND-07 | Lineage read returns matching rows | **Shipped** |
| SN-HAND-08 | Audit evidence and Remediation tracker show the ids | **Shipped** |
| SN-HAND-09 | Lineage returns `latestRemediationAttempt` when no association row covers that instance | **Shipped** |
| SN-HAND-10 | Audit evidence shows the latest attempt | **Shipped** |
| SN-HAND-HOLD | Stop list | **Hold** |

### SN-PERF — Read-path performance (**SN-PERF-01–SN-PERF-24**)

Index: [`SECURENOW_PERFORMANCE_LUNA_PROMPTS.md`](../architecture/SECURENOW_PERFORMANCE_LUNA_PROMPTS.md). Do not implement from the index. Prompts only.

| ID | Title | Status |
|----|-------|--------|
| SN-PERF-01 | Grouped factory counts; Home uses API order | **Shipped** |
| SN-PERF-02 | Snapshot detail in one round trip | **Shipped** |
| SN-PERF-03 | Reused path-search buffer | **Shipped** |
| SN-PERF-04 | Neighborhood suffix index | **Shipped** |
| SN-PERF-05 | Toxic combinations paired by shared asset | **Shipped** |
| SN-PERF-06 | Batched path hops for metrics, sync, drift, inspector | **Shipped** |
| SN-PERF-07 | Active pattern matches in one read | **Shipped** |
| SN-PERF-08 | Prioritization prefetches exceptions and matches | **Shipped** |
| SN-PERF-09 | Snapshot header and grids in one round trip | **Shipped** |
| SN-PERF-10 | Question graph from the loaded snapshot | **Shipped** |
| SN-PERF-11 | Unchanged drift rows from resources only | **Shipped** |
| SN-PERF-12 | Wave create loads approved instances by finding id | **Shipped** |
| SN-PERF-13 | Factory metrics from grouped SQL | **Shipped** |
| SN-PERF-14 | Inspector finding ids in one snapshot read | **Shipped** |
| SN-PERF-15 | Snapshot inventory rows without full detail | **Shipped** |
| SN-PERF-16 | Shared snapshot header SQL | **Shipped** |
| SN-PERF-17 | Question list and ownership use snapshot header | **Shipped** |
| SN-PERF-18 | Ranked path page loads headers and cut points in batch | **Shipped** |
| SN-PERF-19 | Architect outcome counts skip full finding and exception lists | **Shipped** |
| SN-PERF-20 | Evidence hub loads one resource slice | **Backlog** |
| SN-PERF-21 | Evidence hub terraform mapping and recent changes for one resource | **Backlog** |
| SN-PERF-22 | Preflight production tag from one resource | **Backlog** |
| SN-PERF-23 | Instance list seals distinct findings and runs | **Backlog** |
| SN-PERF-24 | Snapshot list seals distinct cited runs | **Backlog** |
| SN-PERF-HOLD | Stop list | **Hold** |

---

## Design references (this folder)

| Document | Use when |
|----------|----------|
| [`ENGINEER_ANALYST_HANDOFF.md`](ENGINEER_ANALYST_HANDOFF.md) | Finding to verified fix to control. Gaps 4–5 shipped (**SN-HAND-05–10**). |
| [`DATA_ARCHITECTURE_AND_DATA_FLOW_DIAGRAMS.md`](DATA_ARCHITECTURE_AND_DATA_FLOW_DIAGRAMS.md) | Three diagram types; first slice vs gold standard |
| [`EVIDENCE_BASED_PROBABLE_DATA_FLOWS.md`](EVIDENCE_BASED_PROBABLE_DATA_FLOWS.md) | Diagram 3 evidence families; ordinal bands |
| [`RUNTIME_DECLARED_AND_OBSERVED_DATA_FLOWS.md`](RUNTIME_DECLARED_AND_OBSERVED_DATA_FLOWS.md) | Options A–E for empty Container Apps canvas |
| [`ARCHLUCID_DEV_DATA_FLOW_CONNECTION_REFERENCE.md`](ARCHLUCID_DEV_DATA_FLOW_CONNECTION_REFERENCE.md) | Expected DEV edges from IaC (not observed traffic) |

---

## Maintenance

- After a wave ships, update the **Shipped baseline** table and the matching wave detail row in the same PR as the code (or in a docs-only follow-up).
- Do not duplicate full TB row prose for **TB-2400** / **TB-2401** — link [`TECH_BACKLOG_TB2400_INDEX.md`](../library/TECH_BACKLOG_TB2400_INDEX.md).
- [`../library/AZURE_EXTRACTOR_TECHNICAL_BACKLOG.md`](../library/AZURE_EXTRACTOR_TECHNICAL_BACKLOG.md) items **10–11** are superseded by the SN-PE / SN-RT sections here once shipped; keep the extractor file focused on ZIP ingest and AX-DC.

> **Scope:** Copy-paste Composer/Cloud Agent prompts for the infrastructure-evidence plane. Internal engineering only.
> **Contract:** [`../library/INFRA_EVIDENCE_PLANE.md`](../library/INFRA_EVIDENCE_PLANE.md) · **V1:** [`../library/V1_SCOPE.md`](../library/V1_SCOPE.md) §2.16–2.17 · **ARC-AMPE pack (not this plane):** [`../library/POLICY_PACK_ARC_AMPE_DESIGN.md`](../library/POLICY_PACK_ARC_AMPE_DESIGN.md)

# Infrastructure-evidence Composer prompts

**Created:** 2026-09-04 · **Revised:** 2026-09-16 (added **AX-DE-01–AX-DE-18** + hold — Azure extractor diagram enrichment: join existing ZIP facts, then ADF/Synapse/Event Grid/Logic/messaging/PaaS child lists; **prompts only**. Same day: **IDLC-01–IDLC-04** inventory-diagram overwritten labels — cluster title vs node name vs stacked zoom hint; **not** IDT gap rewind. Same day: **IDF-01** inventory clustered-canvas overflow — existing Graphviz/Mermaid swimlane frames must enclose member nodes; **not** forest pack-by-RG. Same day: **IDF-01–IDF-07** inventory-diagram resource-group frame visibility — per-cell bounds, inside labels, 2 px solid stroke, frame-aware gaps, crop, PNG cluster parity; **prompts only**. Same day: **SN-DF-01–SN-DF-08** + hold — SecureNow Data flow / Data architecture modes from inventory + ADF declared wiring; **prompts only**. Same day: **IDP-01–IDP-04** inventory-diagram declared vs extract-derived edges — dash + `declared` label after provenance plumbing; **not** teal. Same day: **IDA-01–IDA-12** inventory-diagram aesthetics — neutral Carbon-like forest cards, category accents, elbows, RG pack+frames, legend, collapsed outline; IDA-08 **landed**). Prior 2026-09-15: **IDR-01–IDR-03** inventory-forest resource-group captions — print `ArmResourceGroup` on forest cards + Graphviz HTML PNG parity; **not** bounding boxes from IDR chats (frames are **IDA-08**). Prior 2026-09-13: **DAU-01–DAU-12** diagram AI usability — compile intent into existing view/model controls, not LLM Mermaid; **IE-DT-01–IE-DT-04** Drift & snapshots table overlapping microscopic text — `content-visibility` on `EnterpriseTable` rows; **IDG-01–IDG-05** Graphviz `fdp` from `DiagramAst` after the owner still saw a white sea and asked for Composer prompts; **IDH-01–IDH-03** inventory-diagram human layout from owner `.mmd`; **IE-DD-01–IE-DD-04** Data diagram render failed; **IDS-01–IDS-04** inventory-diagram spacing — **do not re-run**, packing subgraphs superseded by IDH/IDG; **IE-RF-01–IE-RF-12** relationship-first topology collection; **IE-ID-01–IE-ID-03** Identity diagram compiles but does not paint; **IE-ND-01–IE-ND-05** Network diagram empty despite inventory; **IE-HOTFIX** Mermaid snapshot 500 after #2931.

**Status:** ready to run — **one prompt per chat**.

Canonical design: [`INFRA_EVIDENCE_PLANE.md`](../library/INFRA_EVIDENCE_PLANE.md). If a prompt and the plane conflict, **the plane wins**.

## Prompt files

| File | IDs |
|------|-----|
| [`INFRA_EVIDENCE_COMPOSER_PROMPTS_IE01_IE08.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS_IE01_IE08.md) | **IE-01–IE-08** shared Azure observation (the only collector) |
| [`INFRA_EVIDENCE_COMPOSER_PROMPTS_IE09_IE15.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS_IE09_IE15.md) | **IE-09–IE-15** operational findings + remediation factory |
| [`INFRA_EVIDENCE_COMPOSER_PROMPTS_IE16_IE22.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS_IE16_IE22.md) | **IE-16–IE-22** Mermaid, diagrams, resource hub, Ask |
| [`INFRA_EVIDENCE_COMPOSER_PROMPTS_AE.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS_AE.md) | **AE-01–AE-10** ARC-AMPE audit evidence (**no second collector**) + **CW-01** crosswalk |
| [`INFRA_EVIDENCE_COMPOSER_PROMPTS_BR.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS_BR.md) | **BR-01–BR-09** tenant white-label branding |
| [`INFRA_EVIDENCE_COMPOSER_PROMPTS_IEUX.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS_IEUX.md) | **IE-UX-00–IE-UX-05** operator workbenches + Infrastructure nav spine |
| [`INFRA_EVIDENCE_MERMAID_500_COMPOSER_PROMPT.md`](INFRA_EVIDENCE_MERMAID_500_COMPOSER_PROMPT.md) | **IE-HOTFIX** Mermaid snapshot HTTP 500 after **#2931** (missing `AzureInventoryDefenderSummaries` DbUp + fail-soft dirty rows) |
| [`INFRA_EVIDENCE_NETWORK_DIAGRAM_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_NETWORK_DIAGRAM_COMPOSER_PROMPTS.md) | **IE-ND-01–IE-ND-05** Network mode empty despite `Microsoft.Network/*` inventory (category substring bug, mermaid contract, sparse flatten, subnet subgraphs, honest empty UX) |
| [`INFRA_EVIDENCE_RELATIONSHIP_FIRST_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_RELATIONSHIP_FIRST_COMPOSER_PROMPTS.md) | **IE-RF-01–IE-RF-12** Relationship-first ARG projections + type-scoped ARM lists → association table → Mermaid (not ARM export / `dependsOn`) |
| [`INFRA_EVIDENCE_IDENTITY_DIAGRAM_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_IDENTITY_DIAGRAM_COMPOSER_PROMPTS.md) | **IE-ID-01–IE-ID-03** Identity mode compiles (Succeeded + outline) but the canvas does not paint (sparse flatten leftover from IE-ND-03, mermaid contract, overlay collapse) |
| [`INFRA_EVIDENCE_DATA_DIAGRAM_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_DATA_DIAGRAM_COMPOSER_PROMPTS.md) | **IE-DD-01–IE-DD-04** Data mode Render failed (38 nodes / 70 edges / 38 subgraphs): SQL/Cosmos/DBfor category slash-bug, mermaid contract, owner Failed ratchet, honest validation errors |
| [`SECURENOW_DATA_FLOW_DIAGRAM_COMPOSER_PROMPTS.md`](SECURENOW_DATA_FLOW_DIAGRAM_COMPOSER_PROMPTS.md) | **SN-DF-01–SN-DF-08** + hold — Data flow (movement) and Data architecture (repositories) modes; ADF declared wiring; not Data-mode category leftover |
| [`AZURE_EXTRACTOR_DIAGRAM_ENRICHMENT_COMPOSER_PROMPTS.md`](AZURE_EXTRACTOR_DIAGRAM_ENRICHMENT_COMPOSER_PROMPTS.md) | **AX-DE-01–AX-DE-18** + hold — extractor collection to enhance diagrams (MI+RBAC, diagnostics, remaining ADF, Synapse, Event Grid, Logic Apps, messaging, PaaS children); one collector family; **prompts only** |
| [`INFRA_EVIDENCE_INVENTORY_DIAGRAM_SPACING_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_INVENTORY_DIAGRAM_SPACING_COMPOSER_PROMPTS.md) | **IDS-01–IDS-04** (landed — **do not re-run**) Executive spacing; packing subgraphs superseded by IDH |
| [`INFRA_EVIDENCE_INVENTORY_DIAGRAM_HUMAN_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_INVENTORY_DIAGRAM_HUMAN_COMPOSER_PROMPTS.md) | **IDH-01–IDH-03** Owner Executive `.mmd` (11 VNets / 6 unlabeled arrows / 0 subgraphs) must pack as TD columns, not `alpack_*` LR pairs |
| [`INFRA_EVIDENCE_INVENTORY_DIAGRAM_DENSE_SPACING_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_INVENTORY_DIAGRAM_DENSE_SPACING_COMPOSER_PROMPTS.md) | **IDT-01–IDT-04** Residual Mermaid slack — **do not start another IDT/IDS gap pass**; owner 2026-09-13 chose **IDG** |
| [`INFRA_EVIDENCE_INVENTORY_DIAGRAM_GRAPHVIZ_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_INVENTORY_DIAGRAM_GRAPHVIZ_COMPOSER_PROMPTS.md) | **IDG-01–IDG-05** + hold — Graphviz `fdp` from `DiagramAst` for inventory canvases; Mermaid stays export/fail-soft; **no** extractor DOT |
| [`INFRA_EVIDENCE_INVENTORY_DIAGRAM_RG_CAPTION_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_INVENTORY_DIAGRAM_RG_CAPTION_COMPOSER_PROMPTS.md) | **IDR-01–IDR-03** + hold — print Azure resource group on inventory-forest cards + Graphviz HTML PNG parity; **not** RG bounding boxes or pack-by-RG from **IDR** chats |
| [`INFRA_EVIDENCE_INVENTORY_DIAGRAM_LABEL_COLLISION_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_INVENTORY_DIAGRAM_LABEL_COLLISION_COMPOSER_PROMPTS.md) | **IDLC-01–IDLC-04** + hold — stop cluster titles / forest wrap / zoom hint from overwriting the top-left inventory card; **not** IDT gap rewind or `htmlLabels: true` |
| [`INFRA_EVIDENCE_INVENTORY_DIAGRAM_CLUSTER_OVERFLOW_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_INVENTORY_DIAGRAM_CLUSTER_OVERFLOW_COMPOSER_PROMPTS.md) | **IDF-01** — clustered Executive canvas: existing `g.cluster` frames must enclose the widest truncated-label node; **not** new forest RG boxes |
| [`INFRA_EVIDENCE_INVENTORY_DIAGRAM_FRAMES_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_INVENTORY_DIAGRAM_FRAMES_COMPOSER_PROMPTS.md) | **IDF-01–IDF-07** + hold — make IDA-08 RG frames honest and visible (per-cell bounds, inside labels, 2 px solid stroke, frame-aware gaps, crop, PNG parity); **prompts only** until implementation chats |
| [`INFRA_EVIDENCE_INVENTORY_DIAGRAM_AESTHETICS_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_INVENTORY_DIAGRAM_AESTHETICS_COMPOSER_PROMPTS.md) | **IDA-01–IDA-12** + hold — forest aesthetics (neutral palette, accents, content-sized cards, elbows, RG pack+frames, legend, collapsed outline); IDA-08 **landed** |
| [`INFRA_EVIDENCE_INVENTORY_DIAGRAM_PROVENANCE_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_INVENTORY_DIAGRAM_PROVENANCE_COMPOSER_PROMPTS.md) | **IDP-01–IDP-04** + hold — carry HumanAssertion onto `DiagramEdge`, dash + `declared` label on forest/Mermaid/Graphviz, outline Source + rationale panel; **not** teal or five-color legends |
| [`DIAGRAM_AI_USABILITY_COMPOSER_PROMPTS.md`](DIAGRAM_AI_USABILITY_COMPOSER_PROMPTS.md) | **DAU-01–DAU-12** AI usability: Ask `ViewPlan`, density coach, camera, walkthrough, path, finding spotlight, reconcile overlay, NL model patches, inferred merge, vision accept desk — **not** LLM Mermaid as source of truth |
| [`INFRA_EVIDENCE_DRIFT_TABLE_LAYOUT_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_DRIFT_TABLE_LAYOUT_COMPOSER_PROMPTS.md) | **IE-DT-01–IE-DT-04** Drift & snapshots change table overlapping microscopic text (`content-visibility` on `EnterpriseTable` `<tr>`; prompts only until implementation chats) |

## Why this set exists

Owner briefs described four products (remediation factory, subscription capture, ARC-AMPE GRC, white-label). ArchLucid already has extractor ZIPs, hosted Reader polling, `CanonicalObject` / `GraphSnapshot`, aztfexport wrap, `DiagramAst` → Mermaid, review compare, evidence-graph HTTP, Ask, pack #24 ARC-AMPE **architecture themes**, `RiskExceptionRecord`, first-value report branding, and a sealed architecture-finding stream.

Naive implementation would add a second Azure collector, a second finding type named `Finding`, and a second logo store. These prompts **force one observation spine** and **rename collisions**.

## Do not implement from this set

| Item | Why |
|------|-----|
| Second ARC-AMPE ARM/ZIP collector | Plane §1 — selectors over `AzureInventorySnapshot` |
| Inventing ARC-AMPE control text | Import versioned spec only |
| Calling automated eval an auditor conclusion or “compliance score” | Plane §2 |
| AI as evidence (ExactMatch, org docs, authoritative crosswalks, green checkboxes) | **AI explains evidence; it is not the evidence** |
| `terraform apply` / ARM writes / Entra Global Reader | [`V1_SCOPE.md`](../library/V1_SCOPE.md) §3 |
| Replacing aztfexport | §2.17 |
| Merging scanner findings into `FindingsSnapshot` | [`FINDING_STREAM_PRODUCT_OF_RECORD.md`](../library/FINDING_STREAM_PRODUCT_OF_RECORD.md) |
| New coverage `IFindingEngine` | [`HOLD_NO_COVERAGE_ENGINES.md`](../quality/HOLD_NO_COVERAGE_ENGINES.md) |
| FIT-01–05 re-run; diagram OCR as default-on V1 claim | Archives / IE-20 gated; **DAU-11** is accept UX only |
| LLM-authored Mermaid/DOT as the diagram of record | **DAU-01** / ADR 0101 — assist compiles into existing controls |
| Observed traffic, Confidential/TLS badges, classic process DFDs, fake Fabric/Power BI from **SN-DF** chats | **SN-DF-HOLD** |
| Secret harvest, Kudu, hosted POST, minting consumers, GET-every-id from **AX-DE** chats | **AX-DE-HOLD** |
| GTM M-90 / M-44 / M-91 / M-92; SOC 2 CPA; third-party pen test | Owner/GTM |
| Desktop review tab collapse | workspace rule |
| `Export-AzResourceGroup` / `dependsOn` as architecture arrows | **IE-RF-12** — ARG projections + type lists, not a deploy DAG |
| Resource-group bounding boxes or pack-by-RG from **IDR** chats | **IDR-HOLD** — captions only; frames are **IDA-08** (visibility follow-on is **IDF**) |
| Switching inventory Graphviz default from `fdp` to `dot` to “fix” clusters | **IDF-01** (cluster overflow) resizes existing frames after paint; do not change the layout engine |
| Microsoft Azure product icons; nested VNet/subnet frames; honey node fill; Mermaid gap retune from **IDA** chats | **IDA-HOLD** |
| Nested VNet/subnet frames; global component-gap bump; restoring frame dash `5 4` / peering `6 4` on RG boxes from **IDF** chats | **IDF-HOLD** |
| Teal / color-only / five-stroke provenance on inventory edges | **IDP-HOLD** — dash + `declared` (IDP-02); dotted `inferred` only in **IDP-04** |

## Sequencing

Run **IE-01 → IE-04 → IE-02 → IE-03** before audit selectors or Mermaid-from-snapshot. Branding (**BR-***) can start in parallel (no Azure dependency) but **BR-05/BR-06** should follow IE-16 and AE-08 so wrappers have artifacts to brand.

| ID | Title | Depends on |
|----|-------|------------|
| **IE-01** | Inventory snapshot domain + SQL | plane |
| **IE-04** | Stable `CloudResourceId` | IE-01 |
| **IE-02** | **The** Azure collector fidelity (script + hosted) | IE-01 |
| **IE-03** | Materialize snapshot → graph | IE-02, IE-04 |
| **IE-05** | Advisory Terraform representation | IE-03 |
| **IE-06** | Semantic diff (+ evidence-invalidation hooks) | IE-03 |
| **IE-07** | Infrastructure baselines + drift approval | IE-06 |
| **IE-08** | Diff narrative / trends (AI cites rows only) | IE-06 |
| **IE-10** | Pattern registry | plane (parallel) |
| **IE-09** | Operational finding ingest | IE-04 |
| **IE-11** | Deterministic matcher | IE-09, IE-10 |
| **IE-12** | Operational exceptions | IE-09 |
| **IE-13** | Remediation workflow (no apply) | IE-11, IE-12 |
| **IE-14** | Pattern UI | IE-10 |
| **IE-15** | Waves + metrics | IE-13 |
| **IE-16** | Mermaid via `DiagramAst` | IE-03 |
| **IE-17** | Render validate / repair / fallback | IE-16 |
| **IE-18** | Structured diagram ingest | IE-04 |
| **IE-19** | Diagram ↔ snapshot reconciliation | IE-03, IE-18 |
| **IE-20** | Vision ingest (default off) | IE-18 |
| **AE-01** | Audit framework/control ingest (no invented controls) | plane |
| **AE-02** | Evidence requirements + **selectors** (not collectors) | AE-01, IE-03 |
| **AE-03** | Control→evidence mapping + deterministic eval | AE-02 |
| **AE-04** | Immutable `AuditEvidenceSnapshot` (references inventory snapshot) | AE-02, IE-03 |
| **AE-05** | Freshness gate | AE-04 |
| **AE-06** | Readiness vs compliance dashboards | AE-03, AE-05 |
| **AE-07** | Manual/hybrid evidence (no LLM-minted docs) | AE-01 |
| **AE-08** | Auditor package export | AE-04, AE-07, BR-03 if branding landed |
| **AE-09** | Continuous re-eval on inventory diff + remediation handoff | IE-06, IE-13, AE-04 |
| **AE-10** | Evidence lineage API/UI (chain of custody) | AE-03, IE-04 |
| **CW-01** | Security crosswalk engine | AE-01, IE-10 |
| **IE-21** | Resource evidence hub | IE-05, IE-06, IE-09, IE-16, IE-19, AE-10 |
| **IE-22** | Ask grounding | IE-21 |
| **BR-01–BR-04** | Branding domain, assets, resolver, display rules | plane (parallel with IE-01) |
| **BR-05–BR-07** | Graphics, reports, UI tokens | BR-03, IE-16, AE-08 for wrappers |
| **BR-08** | Admin Settings UI | BR-02, BR-03 |
| **BR-09** | Isolation/a11y/fallback tests | BR-07, BR-08 |
| **IE-UX-00** | Infrastructure nav spine + route stubs | IE-01–IE-22, AE-01–AE-10, BR-01–BR-09 |
| **IE-UX-01** | Terraform advisory + drift workbench | IE-UX-00, IE-05–IE-08 |
| **IE-UX-02** | Large Mermaid viewer + server PNG export | IE-UX-00, IE-16, IE-17, BR-05 |
| **IE-UX-03** | Diagram reconciliation workbench | IE-UX-00, IE-18, IE-19 |
| **IE-UX-04** | Cloud resource hub + Infrastructure Ask | IE-UX-00, IE-21, IE-22, AE-10 |
| **IE-UX-05** | Remediation factory operator UI | IE-UX-00, IE-09–IE-15, IE-UX-04 |
| **IE-ND-01** | Canonical Azure network topology category (`Microsoft.Network/` not `Contains("/network")`) | IE-16, IE-UX-02 |
| **IE-ND-02** | Network-mode mermaid contract from inventory snapshots | IE-ND-01 |
| **IE-ND-03** | Flatten sparse Network-mode RG swimlanes | IE-ND-01 (parallel with 02) |
| **IE-ND-04** | VNet/subnet subgraph planner ARM matching | IE-ND-01 (parallel with 02/03) |
| **IE-ND-05** | Honest empty/failed Network diagram UX (not “too large”) | IE-ND-01, IE-ND-02 |
| **IE-ID-01** | Flatten sparse Identity-mode RG swimlanes | IE-16, IE-UX-02, IE-ND-03 |
| **IE-ID-02** | Identity-mode mermaid contract from inventory snapshots | IE-ID-01 |
| **IE-ID-03** | Inventory mermaid viewport must not collapse to overlay-only | IDV-01–03 (parallel with IE-ID-01) |
| **IE-DD-01** | Canonical Azure data/storage topology category (`Microsoft.Sql/` / `DocumentDB` / `DBfor*` not `Contains("/sql")`) | IE-16, IE-ND-01 |
| **IE-DD-02** | Data-mode mermaid contract from inventory snapshots | IE-DD-01 |
| **IE-DD-03** | Owner Failed ratchet (flatten + emitter/validator/`IsLayoutOnly`) | IE-DD-01 (parallel with 02) |
| **IE-DD-04** | Honest Failed UX (`validationErrors` on render + workbench) | IE-DD-03 |
| **SN-DF-01** | External ADF linked-service source nodes | ADF Prompt 7 |
| **SN-DF-02** | Data-flow stage catalog | SN-DF-01 |
| **SN-DF-03** | `DiagramMode.DataFlow` compile | SN-DF-01, SN-DF-02 |
| **SN-DF-04** | Data Flow honesty legend | SN-DF-03 |
| **SN-DF-05** | Workbench `dataFlow` | SN-DF-03 |
| **SN-DF-06** | `DiagramMode.DataArchitecture` + workbench | SN-DF-02, SN-DF-05 |
| **SN-DF-07** | Data Flow mermaid contract | SN-DF-03, SN-DF-05 |
| **SN-DF-08** | Missing companions / empty-stage honesty | SN-DF-05 |
| **SN-DF-HOLD** | Hold — not implementation | — |
| **AX-DE-01** | Diagram-enrichment association catalog | IE-RF-01, ADF Prompt 7 |
| **AX-DE-02–04** | Join existing ZIP (diagnostics labels, MI+RBAC May access, ADF hosts) | AX-DE-01 |
| **AX-DE-05–09** | ADF remaining connectors / triggers / IRs / data flows / Synapse | AX-DE-01 |
| **AX-DE-10–13** | Diagnostics fan-out, Event Grid, Logic Apps, EH/SB children | AX-DE-01 (10 after 02) |
| **AX-DE-14–16** | PaaS children, network leftovers, Databricks-when-present | AX-DE-01 |
| **AX-DE-17–18** | Service Connector; Tier 1 app-setting hosts | AX-DE-01 |
| **AX-DE-HOLD** | Hold — not implementation | — |
| **IE-RF-01** | Association type catalog on `network-associations.json` | IE-02 ZIP layout |
| **IE-RF-02** | Tier 1 ARG relationship projections | IE-RF-01 |
| **IE-RF-03** | Hosted type-scoped ARM list GETs | IE-RF-01 (parallel with 02) |
| **IE-RF-04** | VM→NIC + all IP configs | IE-RF-02 or IE-RF-03 |
| **IE-RF-05** | NSG / route table / peering associations | IE-RF-02 or IE-RF-03 |
| **IE-RF-06** | App Gateway / LB / Private DNS / App Service subnet | IE-RF-02 or IE-RF-03 |
| **IE-RF-07** | Materialize catalog associations → graph edges | IE-RF-01 (consume 04–06) |
| **IE-RF-08** | Display-only derived VM→VNet layout edges | IE-RF-07 |
| **IE-RF-09** | Completeness warnings per relationship class | IE-RF-02, IE-RF-03 |
| **IE-RF-10** | Optional effective NSG/routes (fail-soft) | IE-RF-07 |
| **IE-RF-11** | Network mermaid golden fixture for new edges | IE-RF-07, IE-RF-08 |
| **IE-RF-12** | Hold — not implementation | — |
| **IDG-01** | `DiagramAst` → Graphviz DOT (`fdp`, omit packing/`~~~`) | IE-16 |
| **IDG-02** | `fdp -Tsvg` sanitized + Docker `graphviz` | IDG-01 |
| **IDG-03** | Inventory canvas paints SVG; Export Mermaid unchanged | IDG-02 |
| **IDG-04** | Viewport fit + PNG match Graphviz | IDG-03 |
| **IDG-05** | Owner-shape compact-forest Playwright | IDG-01–04 |
| **IDG-HOLD** | No extractor DOT / `dependsOn` | — |
| **IDR-01** | Caption `ResourceGroupCaption` + accessibility title | trunk |
| **IDR-02** | Forest card muted RG line | IDR-01 |
| **IDR-03** | Graphviz HTML RG line (PNG parity) | IDR-01 (parallel with 02) |
| **IDR-HOLD** | No RG bounding boxes / pack-by-RG / flatten rewind **from IDR chats** | — |
| **IDLC-01** | Sanitize cluster FO vs nodeLabel; skip forest wrap recenter; tspan-safe normalize | trunk |
| **IDLC-02** | Cluster title band above first node | IDLC-01 |
| **IDLC-03** | Graphviz cluster `labelloc` / `margin` (PNG / fdp) | trunk (parallel with 01) |
| **IDLC-04** | Clip stacked zoom hint from SVG overflow | trunk (parallel with 01) |
| **IDLC-HOLD** | No IDT gap rewind / htmlLabels / RG boxes / hidden hint | — |
| **IDF-01** (cluster overflow) | Fit existing cluster frames to member-node union | trunk |
| **IDA-01** | Neutral forest/Mermaid/Graphviz card palette + AA captions | IDR-02 (captions already on forest) |
| **IDA-02** | Category accent bar | IDA-01 |
| **IDA-03** | Paint / Graphviz HTML / PNG parity | IDA-01, IDA-02 |
| **IDA-04** | Content-sized icon-left cards | IDA-03 |
| **IDA-05** | Orthogonal edges + markers | IDA-04 |
| **IDA-06** | Collapse duplicate edge labels; dash peering | IDA-05 |
| **IDA-07** | Hub-and-spoke placement | IDA-04 (parallel with 05–06 if no emitter overlap) |
| **IDA-08** | Pack by RG + dashed frames (IDR-HOLD follow-on) | IDA-04 |
| **IDA-09** | SVG legend | IDA-02, IDA-06 |
| **IDA-10** | Collapse Nodes/Edges outline | — (UI; parallel) |
| **IDA-11** | Fit in view on overflow only (keep IDH-02 when it fits) | IDA-04 |
| **IDA-12** | Aesthetics ratchet | IDA-01–11 |
| **IDA-HOLD** | No Microsoft icons / nested frames / gap retune | — |
| **IDF-01** (RG frame visibility) | Per-cell RG frame bounds + AABB tests | IDA-08 on trunk |
| **IDF-02** | Label inside the frame + top band | IDF-01 |
| **IDF-03** | 2 px solid `#64748b` frame + opaque plate + legend row | IDF-02 |
| **IDF-04** | Frame-aware cell chrome (space between boxes) | IDF-02 (prefer IDF-03) |
| **IDF-05** | Viewport crop includes `g.rg-frame` | IDF-02 |
| **IDF-06** | Graphviz PNG cluster parity from `ArmResourceGroup` | IDF-03 |
| **IDF-07** | Frame visibility ratchet | IDF-01–06 |
| **IDF-HOLD** | No nested frames / global gap bump / IDR boxes | — |
| **IDP-01** | Carry `ProvenanceKind` + `InferenceSource` onto `GraphEdge` / `DiagramEdge` | declared-connection merger on trunk |
| **IDP-02** | Dash + `declared` label in forest, Mermaid, Graphviz + legend | IDP-01 |
| **IDP-03** | Outline Source column + rationale/expiry panel | IDP-01 (IDP-02 preferred) |
| **IDP-04** | Three visual kinds (dotted `inferred` for AiInference) | IDP-02; gated |
| **IDP-HOLD** | No teal / five colors / promote-to-observed | — |

Run **IE-UX-00 first** after backend batches land; then IE-UX-01–IE-UX-05 in order (or parallel only when stubs from IE-UX-00 already exist). Nav contract: [`INFRA_EVIDENCE_COMPOSER_PROMPTS_IEUX.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS_IEUX.md).

**Network diagram empty despite inventory:** run **IE-ND-01 first**, then **IE-ND-02**. **IE-ND-03** and **IE-ND-04** may run in parallel after 01. **IE-ND-05** after 02. Prompts: [`INFRA_EVIDENCE_NETWORK_DIAGRAM_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_NETWORK_DIAGRAM_COMPOSER_PROMPTS.md).

**Identity diagram compiles but does not paint:** run **IE-ID-01 first**, then **IE-ID-02**. **IE-ID-03** may run in parallel with 01. Prompts: [`INFRA_EVIDENCE_IDENTITY_DIAGRAM_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_IDENTITY_DIAGRAM_COMPOSER_PROMPTS.md). Paste one numbered file from [`.cursor/prompts/inventory-diagram-identity-00-index.md`](../../.cursor/prompts/inventory-diagram-identity-00-index.md).

**Data diagram render failed:** run **IE-DD-01 first**, then **IE-DD-02**. **IE-DD-03** may run in parallel with 02 after 01. **IE-DD-04** after 03. Prompts: [`INFRA_EVIDENCE_DATA_DIAGRAM_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_DATA_DIAGRAM_COMPOSER_PROMPTS.md). Paste one numbered file from [`.cursor/prompts/inventory-diagram-data-00-index.md`](../../.cursor/prompts/inventory-diagram-data-00-index.md).

**Inventory diagram resources and connectors too far apart (after IDL):** **IDS-01–IDS-04 landed — do not re-run.** Owner Export Mermaid is 11/6/0 with no packing subgraphs; IDS-02 `alpack_*` wrapping widens that graph. Mermaid-path leftover is **IDH-01–IDH-03**. Owner 2026-09-13 asked for **Graphviz** instead of another dagre session: **IDG-01–IDG-05**. Do not run IDH and IDG in the same chat.

**Inventory diagram spacing still too loose (after IDS + IDL-07):** **Do not start IDT** if the owner still sees a white sea — that is **IDG**, not more `nodeSpacing`. Prompts: [`INFRA_EVIDENCE_INVENTORY_DIAGRAM_DENSE_SPACING_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_INVENTORY_DIAGRAM_DENSE_SPACING_COMPOSER_PROMPTS.md) remain historical.

**Inventory diagram white sea — Graphviz layout (owner 2026-09-13):** run **IDG-01**, then **IDG-02**, then **IDG-03**, then **IDG-04**, then **IDG-05**. **IDG-HOLD** is not implementation. Prompts: [`INFRA_EVIDENCE_INVENTORY_DIAGRAM_GRAPHVIZ_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_INVENTORY_DIAGRAM_GRAPHVIZ_COMPOSER_PROMPTS.md). Paste one numbered file from [`.cursor/prompts/inventory-diagram-graphviz-00-index.md`](../../.cursor/prompts/inventory-diagram-graphviz-00-index.md). Do **not** re-run IDL/IDS/IDT/IDH in an IDG session. Do **not** change the PowerShell extractor. Default layout engine is Graphviz **`fdp`**, not `dot`. Do **not** emit ARM `dependsOn`.

**Inventory diagram Full subscription forest has no resource groups on cards (owner 2026-09-15):** run **IDR-01**, then **IDR-02**. **IDR-03** may parallel **IDR-02** after 01. **IDR-HOLD** is not implementation. Prompts: [`INFRA_EVIDENCE_INVENTORY_DIAGRAM_RG_CAPTION_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_INVENTORY_DIAGRAM_RG_CAPTION_COMPOSER_PROMPTS.md). Paste one numbered file from [`.cursor/prompts/inventory-diagram-rg-caption-00-index.md`](../../.cursor/prompts/inventory-diagram-rg-caption-00-index.md). Do **not** draw RG bounding boxes. Do **not** pack by resource group. Do **not** undo sparse flatten. Do **not** start IDG/IDS/IDA in an IDR session.

**Inventory diagram honey wall / unreadable cards (owner 2026-09-15 aesthetics):** run **IDA-01**, then **IDA-02**, then **IDA-03**, then **IDA-04**. **IDA-05** after 04; **IDA-06** after 05. **IDA-07** after 04 (may parallel 05–06). **IDA-08** after 04 (pack-by-RG + frames — **not** an IDR chat). **IDA-09** after 02+06. **IDA-10** may parallel. **IDA-11** after 04. **IDA-12** last. **IDA-HOLD** is not implementation. Prompts: [`INFRA_EVIDENCE_INVENTORY_DIAGRAM_AESTHETICS_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_INVENTORY_DIAGRAM_AESTHETICS_COMPOSER_PROMPTS.md). Paste one numbered file from [`.cursor/prompts/inventory-diagram-aesthetics-00-index.md`](../../.cursor/prompts/inventory-diagram-aesthetics-00-index.md). Do **not** implement from this index. Do **not** retune Mermaid gaps. Do **not** ship Microsoft Azure product icons. Do **not** start IDR/IDG/IDS in an IDA session.

**Inventory diagram resource-group boxes exist but are hard to read (owner 2026-09-16):** run **IDF-01** first, then **IDF-02**, then **IDF-03**. **IDF-04** after 02 (prefer after 03). **IDF-05** after 02. **IDF-06** after 03. **IDF-07** last. **IDF-HOLD** is not implementation. Prompts: [`INFRA_EVIDENCE_INVENTORY_DIAGRAM_FRAMES_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_INVENTORY_DIAGRAM_FRAMES_COMPOSER_PROMPTS.md). Paste one numbered file from [`.cursor/prompts/inventory-diagram-frames-00-index.md`](../../.cursor/prompts/inventory-diagram-frames-00-index.md). Do **not** implement from this index. Do **not** double stroke before per-cell bounds (**IDF-01** before **IDF-03**). Do **not** bump global component gaps. Do **not** start IDA/IDR/IDP in an IDF session.

**Inventory diagram declared connections look like extract-derived edges (owner 2026-09-16):** run **IDP-01**, then **IDP-02**. **IDP-03** after 01 (prefer after 02). **IDP-04** only when AiInference inventory edges exist **or** the owner names 04. **IDP-HOLD** is not implementation. Prompts: [`INFRA_EVIDENCE_INVENTORY_DIAGRAM_PROVENANCE_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_INVENTORY_DIAGRAM_PROVENANCE_COMPOSER_PROMPTS.md). Paste one numbered file from [`.cursor/prompts/inventory-diagram-provenance-00-index.md`](../../.cursor/prompts/inventory-diagram-provenance-00-index.md). Do **not** use teal as a provenance stroke. Do **not** restyle architecture-review diagrams or React Flow. Do **not** start IDG/IDR/IDA in an IDP session. IDA-06 peering dash (`6 4`, often unlabeled) is a different language from IDP declared dash (`4 3` + `declared` label).

**Inventory diagram overwritten top-left labels (owner 2026-09-16):** run **IDLC-01**, then **IDLC-02**. **IDLC-03** and **IDLC-04** may parallel **IDLC-01**. **IDLC-HOLD** is not implementation. Prompts: [`INFRA_EVIDENCE_INVENTORY_DIAGRAM_LABEL_COLLISION_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_INVENTORY_DIAGRAM_LABEL_COLLISION_COMPOSER_PROMPTS.md). Paste one numbered file from [`.cursor/prompts/inventory-diagram-label-collision-00-index.md`](../../.cursor/prompts/inventory-diagram-label-collision-00-index.md). Do **not** undo IDT-01 mermaid gaps. Do **not** set `htmlLabels: true`. Do **not** hide the stacked zoom hint. Do **not** start IDT/IDR/IDG in an IDLC session.

**Inventory diagram node sticking out of a dashed swimlane (owner 2026-09-16):** run **IDF-01**. Prompts: [`INFRA_EVIDENCE_INVENTORY_DIAGRAM_CLUSTER_OVERFLOW_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_INVENTORY_DIAGRAM_CLUSTER_OVERFLOW_COMPOSER_PROMPTS.md). Paste [`.cursor/prompts/inventory-diagram-cluster-overflow-01-cluster-bbox-from-node-union.md`](../../.cursor/prompts/inventory-diagram-cluster-overflow-01-cluster-bbox-from-node-union.md). Do **not** pack forest by RG. Do **not** switch `fdp` to `dot`. Do **not** retune `nodeSpacing`. This is **not** IDR forest frames.

**Drift & snapshots table overlapping microscopic text (owner 2026-09-13):** run **IE-DT-01** first, then **IE-DT-02**. **IE-DT-03** may parallel **IE-DT-02** after 01. **IE-DT-04** last. Prompts: [`INFRA_EVIDENCE_DRIFT_TABLE_LAYOUT_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_DRIFT_TABLE_LAYOUT_COMPOSER_PROMPTS.md). Paste one numbered file from [`.cursor/prompts/drift-table-layout-00-index.md`](../../.cursor/prompts/drift-table-layout-00-index.md). Do **not** implement from this index. Do **not** put `content-visibility` back on `<tr>`. Do **not** start IDG/IDS in an IE-DT session.

**Relationship-first topology (sparse ARM flatten / no VM→NIC):** run **IE-RF-01 first**, then **IE-RF-02** and **IE-RF-03** in parallel. **IE-RF-10** must not block 01–09. **IE-RF-12** is a hold. Prompts: [`INFRA_EVIDENCE_RELATIONSHIP_FIRST_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_RELATIONSHIP_FIRST_COMPOSER_PROMPTS.md). Paste one numbered file from [`.cursor/prompts/infra-evidence-relationship-first-00-index.md`](../../.cursor/prompts/infra-evidence-relationship-first-00-index.md).

**Azure extractor diagram enrichment (owner 2026-09-16 — collect more for diagrams):** run **AX-DE-01 first**. **AX-DE-02–04** join existing ZIP facts (parallel after 01). Then collection **05–18** one prompt per chat. **AX-DE-18** last (Tier 1 `config/list`). **AX-DE-HOLD** is not implementation. Prompts: [`AZURE_EXTRACTOR_DIAGRAM_ENRICHMENT_COMPOSER_PROMPTS.md`](AZURE_EXTRACTOR_DIAGRAM_ENRICHMENT_COMPOSER_PROMPTS.md). Paste one numbered file from [`.cursor/prompts/azure-extractor-diagram-enrichment-00-index.md`](../../.cursor/prompts/azure-extractor-diagram-enrichment-00-index.md). Do **not** re-run IE-RF / ADF Prompt 7 / SN-DF as greenfield. Hosted stays GET-only.

**Run one prompt per chat.** Feature branch per prompt (`cursor/<short-name>-9cc3`). Name the branch in any commit/push request.

## Follow-on — SecureNow architect paths (not this set)

Attack-path / capability-to-flow engines over **live inventory** are **SA-01–SA-22**: [`SECURENOW_ARCHITECT_COMPOSER_PROMPTS.md`](SECURENOW_ARCHITECT_COMPOSER_PROMPTS.md). They consume this plane. Do **not** re-run IE collector bodies to add them. Do **not** add `IFindingEngine`. **IE-RF-01–IE-RF-11** extend IE-02 collection so **SA-02** edges and inventory Mermaid are not limited to first-IP-config flatteners.

## Global constraints (every prompt)

- Read the plane doc first. **One Azure collector family.** Audit code must not new up ARM clients.
- **AI explains evidence; AI is not the evidence.**
- Each class in its own file. Prefer LINQ. Prefer concrete types over `var`. Blank line before `if` / `foreach` unless first in method. Check nulls. Comment anything a two-year developer would not follow. **No `ConfigureAwait(false)` in tests.**
- ADR 0037: `TenantId` on every new table. Isolation test modeled on `SqlAzureExtractorPackageRepositoryScopeIsolationSqlIntegrationTests`.
- DbUp next unused number **and** `ArchLucid.sql` **and** `Migrations/Rollback/Rnnn_*.sql` ([`SQL_SCRIPTS.md`](../library/SQL_SCRIPTS.md)).
- HTTP: [`OPENAPI_CONTRACT_DRIFT.md`](../library/OPENAPI_CONTRACT_DRIFT.md); `python scripts/ci/assert_route_tier_policy_nav.py --sync`; mutating routes in [`AUDIT_COVERAGE_MATRIX.md`](../library/AUDIT_COVERAGE_MATRIX.md).
- Audit event constants: `ArchLucid.Core/Audit/AuditEventTypes.InfraEvidence.cs` and `.Branding.cs` as needed (`AuditEventTypes_DoNotCollideAcrossPipelinesTests`).
- Working-tree check before editing tracked files. Stage only this prompt’s paths. **No `git add -A`.**
- One scoped compile; one retry on exit 1. No new NuGet unless called out.
- UI: Carbon, `EnterpriseTable`, Operate disclosure, no desktop tab collapse, mermaid dynamic import policy.
- Do not start G-REAL-06 live spend, SOC 2 CPA, or third-party pen test.

## Suggested compile scopes

| IDs | `-ProjectPath` |
|-----|----------------|
| IE-01, IE-04, IE-06, IE-07, IE-09, IE-12, AE-01, AE-04, AE-05, BR-01 | `ArchLucid.Persistence.Tests/ArchLucid.Persistence.Tests.csproj` |
| IE-02 | `ArchLucid.Integrations.AzureExtractor.Tests/ArchLucid.Integrations.AzureExtractor.Tests.csproj` |
| IE-03, IE-16 | `ArchLucid.KnowledgeGraph.Tests/ArchLucid.KnowledgeGraph.Tests.csproj` |
| IE-05 | `ArchLucid.Cli.Tests/ArchLucid.Cli.Tests.csproj` |
| IE-08, IE-11, IE-13, IE-15, IE-19, IE-21, IE-22, AE-03, AE-06, AE-09, AE-10, CW-01 | `ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj` |
| IE-10, IE-14, AE-02, AE-08, BR-08 | `ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj` |
| IE-17, BR-05 | `ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj` |
| IE-18, IE-20, AE-07 | `ArchLucid.ContextIngestion.Tests/ArchLucid.ContextIngestion.Tests.csproj` |
| BR-02, BR-03, BR-09 | `ArchLucid.Application.Tests` + `archlucid-ui` Vitest as specified in the prompt |
| IE-UX-00 | `archlucid-ui` typecheck + nav Vitest guards |
| IE-UX-01, IE-UX-03, IE-UX-04 | `ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj` |
| IE-UX-02 | `ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj` |
| IE-UX-05 | `ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj` |
| IE-ND-01 | `ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj` (+ KnowledgeGraph/ArtifactSynthesis tests named in the prompt) |
| IE-ND-02 | `ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj` |
| IE-ND-03, IE-ND-04 | `ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj` |
| IE-ND-05 | `ArchLucid.Application.Tests` + `archlucid-ui` Vitest as specified in the prompt |
| IE-RF-01 | `ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj` |
| IE-RF-02 | Pester `scripts/azure/tests/` helpers named in the prompt |
| IE-RF-03, IE-RF-04, IE-RF-05, IE-RF-06 | `ArchLucid.Integrations.AzureExtractor.Tests/ArchLucid.Integrations.AzureExtractor.Tests.csproj` |
| IE-RF-07, IE-RF-09, IE-RF-11 | `ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj` |
| IE-RF-08 | `ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj` |
| IE-RF-10 | Extractor tests + Application.Tests if edges map |
| IE-DD-01 | `ArchLucid.KnowledgeGraph.Tests/ArchLucid.KnowledgeGraph.Tests.csproj` (+ ArtifactSynthesis `DiagramAstFromGraphCompilerTests` named in the prompt) |
| IE-DD-02 | `ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj` |
| IE-DD-03 | `ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj` (+ Application.Tests named in the prompt) |
| IE-DD-04 | `ArchLucid.Application.Tests` + `archlucid-ui` Vitest as specified in the prompt |
| IDG-01, IDG-02 | `ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj` |
| IDG-03, IDG-04 | `ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj` + `archlucid-ui` Vitest named in the prompt |
| IDG-05 | `archlucid-ui` Playwright `infra-diagrams-layout` (operator-mock) |
| IDR-01, IDR-02, IDR-03 | `ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj` |
| IDLC-01, IDLC-02, IDLC-04 | `archlucid-ui` focused Vitest named in the prompt |
| IDLC-03 | `ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj` |
| IDF-01 | `archlucid-ui` focused Vitest (`fit-inventory-diagram-cluster-frames` + `architecture-diagram-svg`) |
| IDP-01 | `ArchLucid.ArtifactSynthesis.Tests` + `ArchLucid.Application.Tests` + `ArchLucid.Core.Tests` named in the prompt |
| IDP-02 | `ArchLucid.ArtifactSynthesis.Tests` + `archlucid-ui` Vitest named in the prompt |
| IDP-03 | `ArchLucid.Application.Tests` + `ArchLucid.ArtifactSynthesis.Tests` + `archlucid-ui` Vitest named in the prompt |
| IDP-04 | `ArchLucid.ArtifactSynthesis.Tests` + legend Vitest named in the prompt |
| DAU-01, DAU-12 | ADR markdown + honesty tests named in the prompt |
| DAU-02 | `ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj` (`InfraEvidenceAsk` + ViewPlan validator) |
| DAU-03, DAU-04, DAU-05, DAU-07, DAU-08, DAU-09, DAU-10, DAU-11 | `archlucid-ui` focused Vitest named in the prompt |
| DAU-06 | `ArchLucid.ArtifactSynthesis.Tests` (`DiagramVisiblePathFinder`) + focused Vitest |

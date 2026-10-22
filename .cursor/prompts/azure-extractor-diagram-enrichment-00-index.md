<!-- Azure extractor diagram-enrichment Composer prompts.
     Origin: 2026-09-16 owner ask after ADF linked-service / pipeline-flow collection:
     go nuts collecting Azure facts that enhance diagrams, preferably in the
     existing extractor family (Reader + GET-only hosted).
     Do not implement from this index. -->

# Azure extractor diagram enrichment — Composer prompt set (AX-DE-01–AX-DE-18 + hold) — **shipped; do not re-run**

**Consumption follow-on:** [`azure-extractor-diagram-consumption-00-index.md`](azure-extractor-diagram-consumption-00-index.md) (**AX-DC-01–08**).

ADF companions already give **declared** factory→store wiring. Network associations already give VM→NIC→subnet, private endpoints, peering, and L7 backends. Diagrams still miss Event Grid, Logic Apps, Synapse pipelines, messaging children, remaining ADF connectors, app→store **authorization**, and most PaaS child lists.

These prompts extend the **existing** collector family (`Get-ArchLucidAzurePackage.ps1` + hosted GET-only ARM client) so Data Flow, Data Architecture, Network, Identity, and Executive canvases see more **proven / probable** edges. They do **not** add a second ZIP collector, Azure HTTP at Mermaid render time, secret harvest, or observed-traffic claims.

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/azure-extractor-de-NN-*.md` file per Composer / Cloud Agent session.

Copy-paste docs index: [`docs/architecture/AZURE_EXTRACTOR_DIAGRAM_ENRICHMENT_COMPOSER_PROMPTS.md`](../../docs/architecture/AZURE_EXTRACTOR_DIAGRAM_ENRICHMENT_COMPOSER_PROMPTS.md).

Hold: [`docs/library/AZURE_EXTRACTOR_DIAGRAM_ENRICHMENT_HOLD.md`](../../docs/library/AZURE_EXTRACTOR_DIAGRAM_ENRICHMENT_HOLD.md) (**AX-DE-HOLD**).

Feasibility: [`docs/architecture/AZURE_CONNECTION_POINT_DISCOVERY.md`](../../docs/architecture/AZURE_CONNECTION_POINT_DISCOVERY.md).

Contracts: [`docs/library/INFRA_EVIDENCE_PLANE.md`](../../docs/library/INFRA_EVIDENCE_PLANE.md) (plane wins) · [`docs/library/AZURE_EXTRACTOR.md`](../../docs/library/AZURE_EXTRACTOR.md).

**Do not** re-implement **IE-RF-01–11**, **ADF Prompt 7**, or **SN-DF-01–08** as greenfield. Consume them. Do **not** treat this set as a V1 assessment scorecard. No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.

## Diagnosis (already closed — do not re-diagnose)

1. Hosted `GET /subscriptions/{id}/resources` and ARG `project id, name, type, location, tags, sku, resourceGroup` often have **empty nested properties**. Type-scoped lists exist only for a network subset (IE-RF-03).
2. ADF sanitizer supports seven connector types. Others are `UnsupportedConnector`. Hostname matching knows storage, SQL, Key Vault, Synapse only.
3. Synapse workspaces are nodes; they have **no** pipeline/linked-service companions.
4. `diagnostic-settings.json` covers four ARM types and **workspaceId only**. Materializer already emits generic `CONNECTS_TO` to the workspace. Storage / Event Hub destinations and honest labels are missing.
5. `role-assignments.json` already emits `HAS_ROLE` / `CAN_READ` / `CAN_WRITE` from **principal nodes**. System-assigned `identity.principalId` on compute is not joined into **app → store** `appAuthorizedAccess` on architecture diagrams.
6. Event Grid, Logic Apps, Event Hub/Service Bus children, ADF triggers/IRs/data flows, NAT/Firewall/VMSS/Front Door/Container Apps typed lists are not collected as association rows.
7. Fabric / Power BI Consumer boxes must stay empty unless those ARM types exist. Do not mint them.

## Diagnosis → prompt

| # | Concern | Prompt | What moves |
|---|---------|--------|------------|
| 1 | New association strings will diverge across PS / hosted / materializer | **AX-DE-01** | Catalog types + ArmKind + labels (no ARM calls) |
| 2 | Diagnostic edges are generic `connects` to a peeled Log Analytics node | **AX-DE-02** | `diagnosticToDestination` + **Sends diagnostics to**; parse extra dest fields when present |
| 3 | App→SQL looks missing even though RBAC + identity exist | **AX-DE-03** | System-assigned MI join → `appAuthorizedAccess` (**May access**) |
| 4 | Cosmos / PG / EH / SB linked services stay unresolved | **AX-DE-04** | Widen ADF hostname index (no new collection) |
| 5 | SAP/Oracle/Cosmos/EH/SB/Snowflake stay `UnsupportedConnector` | **AX-DE-05** | Remaining ADF connectors (sanitizer + both collectors) |
| 6 | No “why the factory runs” | **AX-DE-06** | `adf-triggers.json` (schedule / blob / Event Grid) |
| 7 | SHIR / VNet IR never appear | **AX-DE-07** | `adf-integration-runtimes.json` |
| 8 | No Transform from ADF; no Raw/Curated path | **AX-DE-08** | Mapping data flows + dataset container/folder/table |
| 9 | Synapse is an isolated box | **AX-DE-09** | Synapse LS / datasets / pipelines (reuse ADF sanitizer) |
| 10 | Diagnostics collected only for 4 types / workspace | **AX-DE-10** | More types + storage + Event Hub destinations |
| 11 | Event Grid destinations unknown | **AX-DE-11** | `event-grid-subscriptions.json` → `eventGridToDestination` |
| 12 | Logic Apps not wired | **AX-DE-12** | Consumption workflows + `Microsoft.Web/connections` |
| 13 | Messaging spine missing | **AX-DE-13** | Event Hub / Service Bus children + capture |
| 14 | SQL DB / containers / AKS VNet missing from catalog pictures | **AX-DE-14** | Type-scoped PaaS child lists + identity flatten |
| 15 | NAT, Firewall, VMSS, Front Door, Container Apps, PE DNS | **AX-DE-15** | Network leftover type lists → associations |
| 16 | Databricks never becomes Transform even when present | **AX-DE-16** | Collect workspace properties; stage/peel/executive only if type exists |
| 17 | Service Connector unused when present | **AX-DE-17** | Opportunistic `serviceConnectorLink` |
| 18 | App→SQL from hostname in settings | **AX-DE-18** | Tier 1 redacted `config/list` only (hosted stays GET-only) |
| 19 | Temptation to scrape secrets / Kudu / traffic / fake PBI | **AX-DE-HOLD** | Written hold — not implementation |

## Run order

**AX-DE-01** first (catalog). **02–04** after 01 (join existing ZIP; parallel). **05–09** after 01 (ADF/Synapse collection; 05 before 06–08 if sanitizer types are shared). **06 / 07 / 08** may run in parallel after 05 or after 01 with stub types. **09** after 01; reuse 05 sanitizer if landed. **10** after 02. **11–13** after 01. **14–16** after 01; 16 may parallel 14. **17** after 01. **18** last (trust-center). **HOLD** is not implementation.

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **AX-DE-01** | First | IE-RF-01 catalog pattern; ADF Prompt 7 types already exist |
| **AX-DE-02** | After 01 | Existing `diagnostic-settings.json`; `AddDiagnosticEdges` |
| **AX-DE-03** | After 01 | `role-assignments.json` + `identity` flatten |
| **AX-DE-04** | After 01; parallel 02/03 | `AzureInventoryAdfLinkedServiceTargetResolver` |
| **AX-DE-05** | After 01 | Sanitizer + PS + hosted ADF collectors |
| **AX-DE-06** | After 01; prefer after 05 | New companion `adf-triggers.json` |
| **AX-DE-07** | After 01 | New companion `adf-integration-runtimes.json` |
| **AX-DE-08** | After 01; prefer after 05 | Data flows + dataset location fields |
| **AX-DE-09** | After 01; prefer after 05 | Synapse child lists; reuse sanitizer/extractor |
| **AX-DE-10** | After 02 | Collector fan-out + extra dest columns |
| **AX-DE-11** | After 01 | Event Grid subscription lists |
| **AX-DE-12** | After 01 | Logic App connections |
| **AX-DE-13** | After 01 | EH / SB child lists |
| **AX-DE-14** | After 01 | Type-scoped PaaS lists (not GET-every-id) |
| **AX-DE-15** | After 01; parallel 14 | Extend IE-RF type-list descriptors |
| **AX-DE-16** | After 01 | Databricks ARM when present; SN-DF-02 stage catalog |
| **AX-DE-17** | After 01 | Service Linker child list |
| **AX-DE-18** | After 01; after trust-center copy | Tier 1 only; hosted warning |
| **AX-DE-HOLD** | Hold | — |

Suggested Cloud Agent branch per prompt: `cursor/ax-de-<short-name>-80a4` locally, or the Cloud Agent suffix for that run. This prompt-set PR may live on `cursor/azure-extractor-diagram-enrichment-prompts-80a4`.

## Prompt files (paste one per session)

| # | File | Flaw it mitigates |
|---|------|-------------------|
| 00 | `azure-extractor-diagram-enrichment-00-index.md` | This index |
| 01 | `azure-extractor-de-01-association-catalog.md` | Ad hoc association strings |
| 02 | `azure-extractor-de-02-diagnostic-edges.md` | Generic diagnostic `connects` |
| 03 | `azure-extractor-de-03-app-authorized-access.md` | No app→store authorization overlay |
| 04 | `azure-extractor-de-04-adf-hostname-index.md` | Unique host match too narrow |
| 05 | `azure-extractor-de-05-adf-remaining-connectors.md` | Unsupported ADF connectors |
| 06 | `azure-extractor-de-06-adf-triggers.md` | No trigger→factory wiring |
| 07 | `azure-extractor-de-07-adf-integration-runtimes.md` | SHIR / VNet IR invisible |
| 08 | `azure-extractor-de-08-adf-dataflows-dataset-location.md` | No mapping data flow / zone path |
| 09 | `azure-extractor-de-09-synapse-pipelines.md` | Synapse has no declared flows |
| 10 | `azure-extractor-de-10-diagnostic-collection.md` | Sparse diagnostic companion |
| 11 | `azure-extractor-de-11-event-grid.md` | Event Grid destinations unknown |
| 12 | `azure-extractor-de-12-logic-apps.md` | Logic Apps unwired |
| 13 | `azure-extractor-de-13-event-hub-service-bus.md` | Messaging children missing |
| 14 | `azure-extractor-de-14-paas-child-lists.md` | SQL DB / containers / AKS VNet |
| 15 | `azure-extractor-de-15-network-leftovers.md` | NAT / Firewall / VMSS / Front Door / CA |
| 16 | `azure-extractor-de-16-databricks-catalogs.md` | Transform empty when Databricks exists |
| 17 | `azure-extractor-de-17-service-connector.md` | Linker ARM unused |
| 18 | `azure-extractor-de-18-app-settings-hosts.md` | Hostname coupling needs extra permission |
| 19 | `azure-extractor-de-19-hold.md` | Written hold |

## Companion files vs `network-associations.json`

Prefer **extending** `network-associations.json` for simple `{ fromResourceId, toResourceId, associationType }` ARM-id pairs (IE-RF-01).

Use a **new optional sibling JSON array** (schema v2, not a required schema bump) when the payload is not a pair: triggers, IRs, data flows, Event Grid subscriptions, Logic connections, messaging children, Service Linker, redacted app-setting hosts.

Synapse may **reuse** `adf-linked-services.json` / `adf-datasets.json` / `adf-pipeline-flows.json` with `factoryResourceId` = workspace ARM id **or** add `synapse-*.json` that the same parsers accept. Prefer reuse if tests stay honest.

## Product vs company (every prompt)

- **SecureNow** = Security product in the Security shell.
- **ArchLucid** = Architecture product + legal/company.
- Collector scripts: change **shared** `ArchLucid.*.helpers.ps1`. `Get-SecureNowAzurePackage.ps1` is a branded variant — keep helper identifiers `ArchLucid.*`.

## Global constraints (every prompt)

- Read [`docs/library/INFRA_EVIDENCE_PLANE.md`](../../docs/library/INFRA_EVIDENCE_PLANE.md) first. **One Azure collector family.**
- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing tracked files (Linux Cloud: `pwsh` from `$HOME/.local/bin`). Exit 2 → skip and report.
- Hosted path remains **GET-only** `management.azure.com`. No POST (Cost, Policy Insights, `config/list`) on hosted. Fail-soft + completeness warning instead.
- Never persist connection strings, passwords, keys, tokens, certificates, secret values. Reuse `AzureInventoryAdfLinkedServiceSanitizer` blocked property names.
- SchemaVersion stays **2** unless you prove a **required** ZIP entry (you cannot). New files are optional arrays.
- Type-scoped ARM **list** GETs + ARG typed projections. Do **not** GET every resource id.
- No Azure HTTP from `DiagramAstFromGraphCompiler` / mermaid routes.
- Do **not** claim ObservedFact for hostname-only or RBAC-only edges. Authorization = **May access**. ADF/Synapse activity I/O = **Reads from / Writes to** (DerivedFact), not traffic.
- Do **not** mint Fabric / Power BI / Confidential / TLS 1.3.
- Do **not** hide desktop review workspace tabs behind **More**.
- Prefer LINQ, concrete types, null checks, blank line before `if` / `foreach` unless first in method. Each new class in its own file. **No `ConfigureAwait(false)` in tests.**
- Stage only files the prompt names. **No `git add -A`.**
- Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s on compile/test >15s.
- Implement only *What to build*.

## After each prompt

Summarize: files changed, tests run, ZIP companions / `associationType` values landed, hosted vs Tier 1 parity, completeness warnings, diagram labels, residual InsufficientEvidence, no-apply hold still holds.

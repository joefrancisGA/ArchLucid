> **Scope:** Copy-paste Composer/Cloud Agent prompts that extend the **existing** Azure extractor so diagrams get more ARM platform wiring, PaaS children, and authorization hops. Internal engineering only. **Prompts only** in this PR — do not implement from the tables.
> **Index:** [`INFRA_EVIDENCE_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS.md). **Feasibility:** [`AZURE_CONNECTION_POINT_DISCOVERY.md`](AZURE_CONNECTION_POINT_DISCOVERY.md). **Hold:** [`../library/AZURE_EXTRACTOR_DIAGRAM_ENRICHMENT_HOLD.md`](../library/AZURE_EXTRACTOR_DIAGRAM_ENRICHMENT_HOLD.md).
> **Paste files:** [`.cursor/prompts/azure-extractor-diagram-enrichment-00-index.md`](../../.cursor/prompts/azure-extractor-diagram-enrichment-00-index.md) (one numbered file per session).

# AX-DE-01–AX-DE-18 — Azure extractor diagram enrichment

**Observed:** ADF Prompt 7 and IE-RF network associations are in the ZIP. Diagrams still miss Event Grid, Logic Apps, Synapse pipelines, remaining ADF connectors, messaging children, NAT/Firewall/Front Door, SQL databases, Databricks-when-present, and **app → store authorization** even though `role-assignments.json` already exists.

**Product framing (locked):** one collector family. Reader + hosted GET-only first. Join existing ZIP facts before new ARM fan-out. Extra-permission `config/list` is last and **Tier 1 only**.

## Diagnosis → prompt

| Class | Prompt | Residual if skipped |
|-------|--------|---------------------|
| New association strings diverge | **AX-DE-01** | PS / hosted / materializer invent labels |
| Diagnostic edges say **connects** | **AX-DE-02** | Observability hops look like NIC wiring |
| Web App authorized to SQL invisible | **AX-DE-03** | Gold pictures missing app→store |
| Cosmos/EH/SB hosts unresolved | **AX-DE-04** | Inferred ADF edges never fire |
| SAP/Oracle/Cosmos stay unsupported | **AX-DE-05** | SN-DF-01 left column empty |
| No trigger causality | **AX-DE-06** | Factory looks idle |
| SHIR / VNet IR missing | **AX-DE-07** | On-prem hop invisible |
| Mapping data flows ignored | **AX-DE-08** | Transform empty despite ADF |
| Synapse has no declared flows | **AX-DE-09** | Cousin of ADF is a box |
| Diagnostics: 4 types, workspace only | **AX-DE-10** | Event Hub dest missing |
| Event Grid destinations unknown | **AX-DE-11** | P0 ARM wiring gap |
| Logic Apps unwired | **AX-DE-12** | Integration diagrams hollow |
| Namespaces without hubs/topics | **AX-DE-13** | Messaging spine missing |
| SQL server without databases | **AX-DE-14** | Data Architecture incomplete |
| NAT/Firewall/VMSS/FD/CA/PE DNS | **AX-DE-15** | Network leftovers |
| Databricks not in Executive/stage | **AX-DE-16** | Transform empty when resource exists |
| Service Connector unused | **AX-DE-17** | Proven edges left on the floor |
| App setting hostnames | **AX-DE-18** | Extra-permission Inferred hop |
| Secrets / Kudu / hosted POST / fake PBI | **AX-DE-HOLD** | Written hold |

## Sequencing

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **AX-DE-01** | First | IE-RF-01 catalog |
| **AX-DE-02–04** | After 01; parallel | Existing ZIP companions |
| **AX-DE-05–09** | After 01; 05 before 08/09 if possible | ADF sanitizer |
| **AX-DE-10** | After 02 | Diagnostic row shape |
| **AX-DE-11–13** | After 01 | Catalog types |
| **AX-DE-14–16** | After 01; 14 ∥ 15 | Type-scoped lists |
| **AX-DE-17** | After 01 | Opportunistic |
| **AX-DE-18** | Last | Trust-center copy |
| **AX-DE-HOLD** | Not implementation | — |

**Run one prompt per chat.** Feature branch per prompt (`cursor/ax-de-<short-name>-80a4` or the Cloud Agent suffix). Name the branch in any commit/push request.

## Shared constraints (every prompt)

- Plane wins. One Azure collector. No `terraform apply` / ARM writes. No second collector. No desktop review tab collapse. Do not reopen GTM **M-90 / M-44 / M-91 / M-92** or closed assurance **TB-135 / TB-136**.
- Working-tree: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<file>'`. Exit 2 → skip and report.
- Hosted stays GET-only. Prefer LINQ, concrete types, null checks, blank line before `if`/`foreach` unless first in method. Each new class in its own file. No `ConfigureAwait(false)` in tests.
- Schema v2 optional siblings. No required schema bump.
- Stage only this prompt’s paths. **No `git add -A`.**
- Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s on compile/test >15s.

### Locked facts (do not re-diagnose)

- ADF `adfReadsFrom` / `adfWritesTo` are declared wiring (`DerivedFact`), not runtime.
- RBAC + MI is **May access**, not traffic.
- Empty Transform/Consumer is correct until Databricks/Fabric/Power BI exist in the snapshot.
- Do not re-implement IE-RF, ADF Prompt 7, or SN-DF as greenfield.

---

# Copy-paste wrappers

Paste **one** block per session. The numbered `.cursor/prompts/azure-extractor-de-NN-*.md` file is the source of *What to build*.

## AX-DE-01 — Association catalog

**Branch:** `cursor/ax-de-association-catalog-80a4` · **Paste:** [`.cursor/prompts/azure-extractor-de-01-association-catalog.md`](../../.cursor/prompts/azure-extractor-de-01-association-catalog.md)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: extend AzureInventoryRelationshipAssociationTypes (and ArmKind + DiagramEdgeLabelHumanizer) with diagnosticToDestination, eventGridToDestination, logicAppConnection, appAuthorizedAccess, synapse*, adfTriggerSource, adfIntegrationRuntime, eventHubCapture, nat/firewall/frontDoor/containerApp/peDns, serviceConnectorLink, hostnameInferredTarget, appToKeyVaultRef. Do not collect Azure payloads. Do not reopen TB-135/TB-136 or GTM M-90/M-44/M-91/M-92.

Read first:
- docs/architecture/AZURE_EXTRACTOR_DIAGRAM_ENRICHMENT_COMPOSER_PROMPTS.md
- .cursor/prompts/azure-extractor-diagram-enrichment-00-index.md
- .cursor/prompts/azure-extractor-de-01-association-catalog.md

Working-tree: pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<file>' (exit 2 → skip).
Implement only What to build. Tests must fail on current master, pass after.
Do not git add -A. Heartbeat every 8s if compile/test >15s.
```

## AX-DE-02 — Diagnostic edges and labels

**Depends on:** 01 · **Branch:** `cursor/ax-de-diagnostic-edges-80a4` · **Paste:** [`.cursor/prompts/azure-extractor-de-02-diagnostic-edges.md`](../../.cursor/prompts/azure-extractor-de-02-diagnostic-edges.md)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: AddDiagnosticEdges uses diagnosticToDestination and label "Sends diagnostics to". Parse storageAccountId / eventHub dest when present. Do not widen collector fan-out (AX-DE-10). Do not reverse Log Analytics AlwaysDispose on Network/Executive.

Read first: .cursor/prompts/azure-extractor-de-02-diagnostic-edges.md
Working-tree script. No git add -A.
```

## AX-DE-03 — App authorized access

**Depends on:** 01 · **Branch:** `cursor/ax-de-app-authorized-access-80a4` · **Paste:** [`.cursor/prompts/azure-extractor-de-03-app-authorized-access.md`](../../.cursor/prompts/azure-extractor-de-03-app-authorized-access.md)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: join system-assigned identity.principalId (and UAMI principalId) on compute to role-assignments.json and emit appAuthorizedAccess compute→scope labeled "May access" (DerivedFact). No Graph. No config/list. Subscription-scoped roles must not explode to every resource.

Read first: .cursor/prompts/azure-extractor-de-03-app-authorized-access.md
Working-tree script. No git add -A.
```

## AX-DE-04 — ADF hostname index

**Depends on:** 01 · **Branch:** `cursor/ax-de-adf-hostname-index-80a4` · **Paste:** [`.cursor/prompts/azure-extractor-de-04-adf-hostname-index.md`](../../.cursor/prompts/azure-extractor-de-04-adf-hostname-index.md)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: AzureInventoryAdfLinkedServiceTargetResolver.ExtractKnownHosts adds Cosmos, PostgreSQL, MySQL, Redis, Event Hub, Service Bus, Databricks, App Service unique FQDNs. No new collection. Unique-host rule stays.

Read first: .cursor/prompts/azure-extractor-de-04-adf-hostname-index.md
Working-tree script. No git add -A.
```

## AX-DE-05 — Remaining ADF connectors

**Depends on:** 01 · **Branch:** `cursor/ax-de-adf-remaining-connectors-80a4` · **Paste:** [`.cursor/prompts/azure-extractor-de-05-adf-remaining-connectors.md`](../../.cursor/prompts/azure-extractor-de-05-adf-remaining-connectors.md)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: sanitize Cosmos, Event Hub, Service Bus, Databricks, Snowflake, SAP, Oracle, FTP/SFTP, REST/HTTP into adf-linked-services.json. PowerShell allow-list must match C# sanitizer. Never persist connection strings. Unknown types stay UnsupportedConnector rows.

Read first: .cursor/prompts/azure-extractor-de-05-adf-remaining-connectors.md
Working-tree script. No git add -A. Heartbeat if Pester >15s.
```

## AX-DE-06 — ADF triggers

**Depends on:** 01 · **Branch:** `cursor/ax-de-adf-triggers-80a4` · **Paste:** [`.cursor/prompts/azure-extractor-de-06-adf-triggers.md`](../../.cursor/prompts/azure-extractor-de-06-adf-triggers.md)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: optional adf-triggers.json from GET …/triggers. Map blob/Event Grid sources to adfTriggerSource. Strip webhook tokens. Fail-soft per factory. Hosted GET-only + PowerShell parity.

Read first: .cursor/prompts/azure-extractor-de-06-adf-triggers.md
Working-tree script. No git add -A.
```

## AX-DE-07 — ADF integration runtimes

**Depends on:** 01 · **Branch:** `cursor/ax-de-adf-integration-runtimes-80a4` · **Paste:** [`.cursor/prompts/azure-extractor-de-07-adf-integration-runtimes.md`](../../.cursor/prompts/azure-extractor-de-07-adf-integration-runtimes.md)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: optional adf-integration-runtimes.json. Factory Runs on Azure IR / SHIR / VNet IR. VNet IR → subnet when present. No SHIR auth keys.

Read first: .cursor/prompts/azure-extractor-de-07-adf-integration-runtimes.md
Working-tree script. No git add -A.
```

## AX-DE-08 — ADF data flows and dataset location

**Depends on:** 01 · **Branch:** `cursor/ax-de-adf-dataflows-80a4` · **Paste:** [`.cursor/prompts/azure-extractor-de-08-adf-dataflows-dataset-location.md`](../../.cursor/prompts/azure-extractor-de-08-adf-dataflows-dataset-location.md)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: collect mapping dataflows; ExecuteDataFlow joins static linked services as adfReadsFrom/adfWritesTo. Dataset companion stores container/folder/table (truncated). Zone names are inference only. No secrets.

Read first: .cursor/prompts/azure-extractor-de-08-adf-dataflows-dataset-location.md
Working-tree script. No git add -A.
```

## AX-DE-09 — Synapse pipelines

**Depends on:** 01 · **Branch:** `cursor/ax-de-synapse-pipelines-80a4` · **Paste:** [`.cursor/prompts/azure-extractor-de-09-synapse-pipelines.md`](../../.cursor/prompts/azure-extractor-de-09-synapse-pipelines.md)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: GET Synapse workspace linked services, datasets, pipelines. Reuse ADF sanitizer/extractor. Emit synapseReadsFrom/synapseWritesTo (or reuse ADF companions with workspace id). No Spark notebook source. Hosted GET-only + PowerShell.

Read first: .cursor/prompts/azure-extractor-de-09-synapse-pipelines.md
Working-tree script. No git add -A.
```

## AX-DE-10 — Diagnostic collection expansion

**Depends on:** 02 · **Branch:** `cursor/ax-de-diagnostic-collection-80a4` · **Paste:** [`.cursor/prompts/azure-extractor-de-10-diagnostic-collection.md`](../../.cursor/prompts/azure-extractor-de-10-diagnostic-collection.md)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: widen diagnostic GET allow-list (ADF, Synapse, Event Hub, Service Bus, Web/sites, AKS, AGW, Firewall, Cosmos) and persist workspace + storage + Event Hub destinations. Do not GET every resource type. Reader only. No log contents.

Read first: .cursor/prompts/azure-extractor-de-10-diagnostic-collection.md
Working-tree script. No git add -A.
```

## AX-DE-11 — Event Grid

**Depends on:** 01 · **Branch:** `cursor/ax-de-event-grid-80a4` · **Paste:** [`.cursor/prompts/azure-extractor-de-11-event-grid.md`](../../.cursor/prompts/azure-extractor-de-11-event-grid.md)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: optional event-grid-subscriptions.json. Topic/domain/system topic + subscription-scope eventSubscriptions. ARM dest = eventGridToDestination ObservedFact. WebHook stores host only (strip token path). GET-only.

Read first: .cursor/prompts/azure-extractor-de-11-event-grid.md
Working-tree script. No git add -A.
```

## AX-DE-12 — Logic Apps

**Depends on:** 01 · **Branch:** `cursor/ax-de-logic-apps-80a4` · **Paste:** [`.cursor/prompts/azure-extractor-de-12-logic-apps.md`](../../.cursor/prompts/azure-extractor-de-12-logic-apps.md)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: Consumption Microsoft.Logic/workflows + Microsoft.Web/connections → logic-app-connections.json and logicAppConnection. Standard workflow apps: fail-soft warning, no Kudu. Redact parameterValues.

Read first: .cursor/prompts/azure-extractor-de-12-logic-apps.md
Working-tree script. No git add -A.
```

## AX-DE-13 — Event Hub and Service Bus

**Depends on:** 01 · **Branch:** `cursor/ax-de-event-hub-service-bus-80a4` · **Paste:** [`.cursor/prompts/azure-extractor-de-13-event-hub-service-bus.md`](../../.cursor/prompts/azure-extractor-de-13-event-hub-service-bus.md)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: type-scoped Event Hub hubs + capture and Service Bus queues/topics. eventHubCapture to storage. No SAS keys. Optional messaging companion.

Read first: .cursor/prompts/azure-extractor-de-13-event-hub-service-bus.md
Working-tree script. No git add -A.
```

## AX-DE-14 — PaaS child lists

**Depends on:** 01 · **Branch:** `cursor/ax-de-paas-child-lists-80a4` · **Paste:** [`.cursor/prompts/azure-extractor-de-14-paas-child-lists.md`](../../.cursor/prompts/azure-extractor-de-14-paas-child-lists.md)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: type-scoped SQL databases, Cosmos database names, storage containers/filesystems (capped), AKS networkProfile/agent pools, identity JSON on Web/VM/VMSS/CA/ADF/AKS. ARG typed projections — not project properties. No GET-every-id.

Read first: .cursor/prompts/azure-extractor-de-14-paas-child-lists.md
Working-tree script. No git add -A.
```

## AX-DE-15 — Network leftovers

**Depends on:** 01 · **Branch:** `cursor/ax-de-network-leftovers-80a4` · **Paste:** [`.cursor/prompts/azure-extractor-de-15-network-leftovers.md`](../../.cursor/prompts/azure-extractor-de-15-network-leftovers.md)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: type-scoped NAT Gateway, Azure Firewall, VMSS, Front Door/AFD, Container Apps + env, PE dnsZoneGroups. Catalog associationTypes from AX-DE-01. Do not re-implement IE-RF-01–11. Do not use dependsOn.

Read first: .cursor/prompts/azure-extractor-de-15-network-leftovers.md
Working-tree script. No git add -A.
```

## AX-DE-16 — Databricks catalogs

**Depends on:** 01 · **Branch:** `cursor/ax-de-databricks-catalogs-80a4` · **Paste:** [`.cursor/prompts/azure-extractor-de-16-databricks-catalogs.md`](../../.cursor/prompts/azure-extractor-de-16-databricks-catalogs.md)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: when Microsoft.Databricks/workspaces exists, collect VNet/subnet/managed RG properties and add Executive/peel/friendly-name (and SN-DF-02 Transform if that resolver exists). Do not mint Databricks/Fabric/Power BI. No PAT.

Read first: .cursor/prompts/azure-extractor-de-16-databricks-catalogs.md
Working-tree script. No git add -A.
```

## AX-DE-17 — Service Connector

**Depends on:** 01 · **Branch:** `cursor/ax-de-service-connector-80a4` · **Paste:** [`.cursor/prompts/azure-extractor-de-17-service-connector.md`](../../.cursor/prompts/azure-extractor-de-17-service-connector.md)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: opportunistic Microsoft.ServiceLinker/linkers on Web/sites and Container Apps → serviceConnectorLink ObservedFact. 404 = empty, not failure. Do not require customers to adopt Service Connector.

Read first: .cursor/prompts/azure-extractor-de-17-service-connector.md
Working-tree script. No git add -A.
```

## AX-DE-18 — App setting hosts (Tier 1)

**Depends on:** 01 · **Branch:** `cursor/ax-de-app-settings-hosts-80a4` · **Paste:** [`.cursor/prompts/azure-extractor-de-18-app-settings-hosts.md`](../../.cursor/prompts/azure-extractor-de-18-app-settings-hosts.md)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: optional PowerShell -IncludeAppSettingsHosts. Persist setting names + parsed hosts + Key Vault URI host/secret name. Never values. Hosted path GET-only with completeness warning. Trust-center + extractor README must stay honest. Ingest test fails if Password= appears in the companion.

Read first: .cursor/prompts/azure-extractor-de-18-app-settings-hosts.md
Working-tree script. No git add -A.
```

## AX-DE-HOLD — not implementation

**Paste:** [`.cursor/prompts/azure-extractor-de-19-hold.md`](../../.cursor/prompts/azure-extractor-de-19-hold.md)

Paste only when a session starts secret harvest, Kudu, hosted POST, diagram-time Azure, fake Fabric/Power BI, or a second collector.

---

## Suggested compile scopes

| IDs | Tests |
|-----|--------|
| **AX-DE-01** | Core.Tests catalog + ArtifactSynthesis humanizer |
| **AX-DE-02–03** | Application.Tests materializer |
| **AX-DE-04–05** | Core.Tests sanitizer/resolver + Pester SecurityInventory |
| **AX-DE-06–10, 11–17** | Integrations.AzureExtractor.Tests + Application mapper + Pester helpers |
| **AX-DE-18** | Pester + redaction ingest test |
| **AX-DE-HOLD** | None |

## Related

| Document | Role |
|----------|------|
| [`AZURE_CONNECTION_POINT_DISCOVERY.md`](AZURE_CONNECTION_POINT_DISCOVERY.md) | P0–P3 feasibility |
| [`SECURENOW_DATA_FLOW_DIAGRAM_COMPOSER_PROMPTS.md`](SECURENOW_DATA_FLOW_DIAGRAM_COMPOSER_PROMPTS.md) | Consume declared ADF wiring; do not re-run |
| [`INFRA_EVIDENCE_RELATIONSHIP_FIRST_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_RELATIONSHIP_FIRST_COMPOSER_PROMPTS.md) | Network associations already shipped |
| [`../library/AZURE_EXTRACTOR.md`](../library/AZURE_EXTRACTOR.md) | Tier 1/2 roles |

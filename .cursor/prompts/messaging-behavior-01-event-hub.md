# MB-EH — Event Hub connections say what the hub is doing

**Wave:** Messaging behavior. **Depends on:** AX-DE-13 and SN-PE-05 on trunk. **Do not** implement MB-SB in this session.

Do not implement from the wave index. Implement only *What to build*.

## Goal

On the Full subscription diagram and on Data Flow, an Event Hub card shows the hub’s job: **May publish**, **May consume**, **Captures to**, and **Sends diagnostics to**. Arrows attach to the namespace card when the child hub is not its own node. Contributor on the same namespace stays **May write**.

## Why

The owner looked at Full subscription and asked for connections to the Event Hub to reflect what it is doing. Capture is filed on `…/eventhubs/{hub}`. Diagnostics often cite an authorization rule or that child id. The humanizer then prints **May write** for both `Azure Event Hubs Data Sender` and `Contributor`. The namespace card looks idle or generically connected.

## Context

- `ArchLucid.Core/AzureExtractor/AzureInventoryMessagingAssociationExtractor.cs` — capture reads `captureDescription.destination.storageAccountResourceId` and does not require `enabled`.
- `ArchLucid.Application/InfraEvidence/AzureInventoryMessagingAssociationEdgeMapper.cs` — capture edge `From` is the child hub id.
- `ArchLucid.Core/AzureExtractor/AzureInventoryDiagnosticDestinationParser.cs` — strips `/authorizationRules/` and can leave `/eventhubs/{name}`.
- `ArchLucid.Application/InfraEvidence/AzureInventoryAppAuthorizedAccessEdgeMapper.cs` — emits `CAN_READ` / `CAN_WRITE` with `inventory-app-authorized-access`.
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramEdgeLabelHumanizer.cs` — `TryResolveAuthorizedAccessLabel` returns **May write** before any stored label.
- `ArchLucid.Application/InfraEvidence/Mermaid/AzureInventorySnapshotSameResourceGroupEdgeHydrator.cs` — `IsDataStore` includes `Microsoft.EventHub`.
- `ArchLucid.Core/AzureExtractor/AzureInventoryDataFlowEvidenceCatalog.cs` — `eventHubCapture` is declared movement; `diagnosticToDestination` is excluded from Data Flow.

## What to build

1. **Active capture only.** In `TryExtractEventHub`, set `CaptureStorageAccountId` only when `properties.captureDescription.enabled` is true and `destination.storageAccountResourceId` is a non-empty string. A disabled capture description does not emit **Captures to**.

2. **Attach capture to the visible card.** When the child hub ARM id is not an inventoried diagram node and the parent namespace is, emit the capture relationship from the namespace and keep the hub name on the label (`{hubName} · Captures to`). When the child hub is its own node, keep the arrow on the child. Provenance stays ObservedFact. Inference source stays `inventory-event-hub-capture`. Do not enumerate consumer groups.

3. **Diagnostics land on that same card.** If the normalized destination is under `Microsoft.EventHub/namespaces/{ns}` and that exact id is not a node, retarget the edge to the namespace node. If the id contains `/eventhubs/{name}`, put that name on the label (`Sends diagnostics to {name}`). Authorization-rule ids stay stripped and are never persisted as keys. Family stays telemetry: Full subscription may draw it; Data Flow still excludes `diagnosticToDestination`.

4. **Broker verbs from the role name, not from `CAN_WRITE`.** When the resolved built-in role is exactly one of these and the attested scope is an Event Hub namespace or `…/eventhubs/{hub}`:

   | Role | Edge | Label |
   |---|---|---|
   | Azure Event Hubs Data Sender | existing write permission | **May publish** |
   | Azure Event Hubs Data Receiver | existing read permission | **May consume** |
   | Azure Event Hubs Data Owner | both | **May publish** and **May consume** |

   Carry the verb on an inference source the humanizer reads *before* the generic **May write** / **May read** branch (for example `inventory-event-hub-may-publish` and `inventory-event-hub-may-consume`). Register those sources on the Data Flow catalog as AuthorizedAccess / Probable with those labels so Data Flow still includes them. `Contributor` and `Owner` on the same namespace keep **May write** / **May access**. A resource-group or subscription assignment does not grow one arrow per hub.

5. **Stop the false Data Factory hop.** Remove `Microsoft.EventHub` from `IsDataStore` in the same-resource-group hydrator. Leave Service Bus for MB-SB. A factory and a hub in the same group get an edge only when a collected linker already names the hub (ADF / Synapse / Event Grid / Service Connector). Do not relabel those linkers in this prompt.

6. **Tests**
   - Enabled capture from a child hub attaches to the namespace when the child is not a node, and stays on the child when it is. Disabled capture emits no capture edge.
   - Diagnostic authorization-rule id and `/eventhubs/{name}` both land on the visible namespace; the hub name is on the label when present.
   - Data Sender → **May publish**. Data Receiver → **May consume**. Data Owner → both. Contributor on the namespace stays **May write**.
   - Resource-group Data Sender does not fan out.
   - A lone Event Hub beside a Data Factory in one resource group does not gain a collocation edge.
   - Data Flow shows capture and **May publish**. Data Flow does not show **Sends diagnostics to**.

## Acceptance criteria

- Full subscription Event Hub card shows publish, consume, and capture when that evidence exists, and diagnostics as telemetry.
- No new ZIP companion. No keys. No invented producer.

## Constraints

- Do not change the Service Bus role rows.
- Do not add a consumer-group list.
- Stage only this prompt’s paths. **No `git add -A`.**

## Verification

```bash
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter 'FullyQualifiedName~MessagingAssociation|FullyQualifiedName~DiagnosticDestination|FullyQualifiedName~RbacDataPlaneRoleMap'
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~MessagingAssociation|FullyQualifiedName~AuthorizedAccess'
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramEdgeLabelHumanizer'
```

Heartbeat every 8s if >15s.

## Done when

An Event Hub namespace with an enabled capture, a Data Sender, and a diagnostic pointing at a child hub shows **May publish**, **{hub} · Captures to**, and **Sends diagnostics to {hub}** on the namespace card. Contributor does not say **May publish**.

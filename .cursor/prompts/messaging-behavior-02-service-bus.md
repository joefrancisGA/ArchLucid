# MB-SB — Service Bus connections say what the namespace is doing

**Wave:** Messaging behavior. **Depends on:** MB-EH (humanizer honors a broker verb before generic **May write**) and AX-DE-13 / SN-PE-05 on trunk.

Do not implement from the wave index. Implement only *What to build*. Do not reopen MB-EH except to consume the humanizer order it added.

## Goal

On the Full subscription diagram and on Data Flow, a Service Bus queue or topic shows **May send**, **May receive**, and **Forwards to** when Azure recorded that. Arrows attach to the namespace card when the queue or topic is not its own node. Contributor stays **May write**.

## Why

Service Bus has no capture blob. The declared job on a queue or topic is `properties.forwardTo` (and, when set, `properties.forwardDeadLetteredMessagesTo`). AX-DE-13 lists queues and topics and drops those properties. Sender/Receiver roles already become **May write** / **May read**, which does not say the namespace is a broker. Same-resource-group hydration can still draw a Data Factory → Service Bus **connects** when the namespace is the only “store” in the group.

## Context

- `ArchLucid.Core/AzureExtractor/AzureInventoryMessagingAssociationExtractor.cs` — `TryExtractServiceBusChild` keeps id, name, and child type only.
- `HostedAzureInventoryMessagingAssociationCollector.CollectServiceBusChildrenAsync` — already lists `queues` and `topics`. Do not add a subscriptions list.
- `AzureInventoryMessagingAssociationRow` — add a forward target only if the existing row shape can hold it without a new companion file. Prefer optional fields on this row over a new JSON file.
- `AzureInventoryAppAuthorizedAccessEdgeMapper` and `DiagramEdgeLabelHumanizer` — MB-EH teaches the humanizer to prefer a broker inference source over generic **May write**.
- `AzureInventorySnapshotSameResourceGroupEdgeHydrator.IsDataStore` — still includes `Microsoft.ServiceBus` after MB-EH.
- Diagnostic settings do not target Service Bus. A namespace that *emits* diagnostics stays **Sends diagnostics to**. Do not relabel that as message send.

## What to build

1. **Read forward targets from payloads already listed.** On each queue and topic object the collector already fetches, read `properties.forwardTo` and `properties.forwardDeadLetteredMessagesTo`. Ignore empty and whitespace. Do not list topic subscriptions. Do not persist authorization rules or keys.

2. **Resolve the target inside the same namespace.** `forwardTo` is often an entity name, not an ARM id. Attach a declared edge only when the name matches a queue or topic already in that namespace’s messaging rows, or the value is an ARM id of such a child in the snapshot. An unresolved name emits no edge and no warning spam. Label **Forwards to** for `forwardTo` and **Forwards dead-letter to** for the dead-letter property. Provenance ObservedFact. New association types `serviceBusForwardTo` and `serviceBusForwardDeadLetterTo`, graph edge `CONNECTS_TO`, inference sources `inventory-service-bus-forward-to` and `inventory-service-bus-forward-dead-letter`. Data Flow catalog: DeclaredMovement, Confirmed, label as above, included on Data Flow.

3. **Attach the arrow to the visible card.** When the source queue or topic is not a diagram node and the namespace is, emit the edge from the namespace and keep the entity name on the label (`{queueName} · Forwards to {targetName}`). When both children are nodes, draw child → child.

4. **Broker verbs from the role name.** When the resolved built-in role is exactly one of these and the attested scope is a Service Bus namespace, queue, or topic:

   | Role | Edge | Label |
   |---|---|---|
   | Azure Service Bus Data Sender | existing write permission | **May send** |
   | Azure Service Bus Data Receiver | existing read permission | **May receive** |
   | Azure Service Bus Data Owner | both | **May send** and **May receive** |

   Use inference sources the humanizer reads before generic **May write** / **May read** (`inventory-service-bus-may-send`, `inventory-service-bus-may-receive`). Register them as AuthorizedAccess / Probable on the Data Flow catalog. `Contributor` and `Owner` stay **May write** / **May access**. A resource-group or subscription assignment does not fan out onto every queue. Do not change the Event Hub verb sources from MB-EH.

5. **Stop the false Data Factory hop.** Remove `Microsoft.ServiceBus` from `IsDataStore`. Leave the Event Hub removal from MB-EH in place.

6. **Tests**
   - Queue `forwardTo` naming a topic in the same namespace emits **Forwards to**. A name that matches nothing emits nothing.
   - `forwardDeadLetteredMessagesTo` emits **Forwards dead-letter to** under the same resolver.
   - Forward from a queue that is not a node attaches to the namespace with the queue name on the label.
   - Data Sender → **May send**. Data Receiver → **May receive**. Data Owner → both. Contributor stays **May write**.
   - Resource-group Data Sender does not fan out.
   - A lone Service Bus namespace beside a Data Factory does not gain a collocation edge.
   - Event Hub **May publish** / capture tests from MB-EH still pass.
   - Data Flow shows **Forwards to** and **May send**. A diagnostic edge from the namespace is not relabeled as send.

## Acceptance criteria

- No subscription list. No new ZIP file. No invented sender.
- Forwarding is declared movement. Send/receive stay authorization.

## Constraints

- Do not call Graph. Hosted stays GET-only; this prompt does not add ARM calls (the queue and topic lists already exist).
- Stage only this prompt’s paths. **No `git add -A`.**

## Verification

```bash
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter 'FullyQualifiedName~MessagingAssociation|FullyQualifiedName~RbacDataPlaneRoleMap'
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~MessagingAssociation|FullyQualifiedName~AuthorizedAccess'
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramEdgeLabelHumanizer'
```

Heartbeat every 8s if >15s.

## Done when

A namespace whose queue forwards to a topic in that namespace, with a Data Sender on the queue, shows **{queue} · Forwards to {topic}** and **May send** on the visible card. A queue with no forward and no role match gains no producer arrow.

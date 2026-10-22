# AX-DE-13 — Event Hub and Service Bus children

**Wave:** AX-DE. **Depends on:** AX-DE-01.

Follow [`.cursor/prompts/azure-extractor-diagram-enrichment-00-index.md`](azure-extractor-diagram-enrichment-00-index.md) global constraints.

## Goal

List Event Hub namespaces → hubs (and capture) and Service Bus namespaces → queues/topics as optional `messaging-associations.json` (or two files) so messaging is a diagram spine, not a single namespace box.

## Why

Subscription `/resources` often has the namespace only. Capture-to-storage is a proven data-flow edge. Topics/queues are repositories for Data Architecture.

## Context

- ARM list: `Microsoft.EventHub/namespaces/eventhubs`, capture `destination.storageAccountResourceId`
- Service Bus: queues, topics (skip subscription rules / SAS keys)
- Peel: do not AlwaysDispose hubs

## What to build

1. Type-scoped child lists (hosted + ARG projection on Tier 1 if cheaper). Rows: `parentResourceId`, `childResourceId`, `childType`, `associationType` (`contains` via existing CONTAINS_RESOURCE or new `messagingChild`).
2. Event Hub capture → `eventHubCapture` hub → storage ObservedFact.
3. Do not enumerate every consumer group unless needed for an edge (default skip).
4. Never persist authorization rules / keys.
5. Tests: hub capture to storage; topic under namespace; empty namespace fail-soft.

## Acceptance criteria

- Optional companion. Reader.
- Data Architecture can list hubs/topics as repositories if SN-DF-06 stage catalog is extended **only if** those ARM types are in the snapshot — add stage mapping in this prompt **or** leave a TODO comment pointing at SN-DF-02 (prefer a small stage-catalog addition: Event Hub / Service Bus → Storage or a new Messaging stage — **do not invent a new DiagramMode**). If stage catalog change is too large, store children only.

## Constraints

- Compile Integrations + Core + optional KnowledgeGraph stage tests if you touch the catalog.

## Done when

Namespace + hub + capture appears as namespace contains hub and hub **Captures to** storage.

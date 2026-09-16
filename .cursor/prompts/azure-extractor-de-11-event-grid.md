# AX-DE-11 — Event Grid subscriptions

**Wave:** AX-DE. **Depends on:** AX-DE-01.

Follow [`.cursor/prompts/azure-extractor-diagram-enrichment-00-index.md`](azure-extractor-diagram-enrichment-00-index.md) global constraints.

## Goal

Collect Event Grid subscriptions (topics, domains, system topics, and subscription-scope event subscriptions) into optional `event-grid-subscriptions.json` and emit `eventGridToDestination` (**Publishes to**).

## Why

ARM destination ids on Event Grid subscriptions are proven platform wiring (connection-point P0). They are not in `network-associations.json` today.

## Context

- Type-scoped lists: `Microsoft.EventGrid/topics`, `domains`, `systemTopics`
- Child: `…/eventSubscriptions?api-version=2022-06-15` (or current stable — document the version)
- Subscription-scope: `GET /subscriptions/{id}/providers/Microsoft.EventGrid/eventSubscriptions`

## What to build

1. Row: `sourceResourceId` (topic/domain/system topic or `/subscriptions/{id}`), `subscriptionName`, `destinationResourceId?`, `destinationHost?`, `destinationKind` (EventHub, ServiceBus, StorageQueue, WebHook, HybridConnection, AzureFunction, …), `collectionStatus`.
2. WebHook: store **host only** (strip path/query — often contains tokens). Never persist full callback URL.
3. Map ARM dest → ObservedFact `eventGridToDestination`. Host-only webhook → DeterministicInference + external node only if SN-DF-01-style helper already exists; otherwise store host and skip node (warning `eventgrid-webhook-host-only`).
4. Hosted GET-only + PowerShell. Type-scoped lists, not GET-every-id.
5. Tests: topic → Function ARM id; webhook `https://hooks.example.com/a?token=x` persists host `hooks.example.com` only; repeating nextLink guarded like ADF.

## Acceptance criteria

- Reader. No event **payloads**.
- Optional companion.

## Constraints

- Compile Integrations + Application mapper tests.
- Do not use Event Grid data-plane (publish).

## Done when

A topic subscription to an Event Hub namespace/hub in inventory draws **Publishes to**.

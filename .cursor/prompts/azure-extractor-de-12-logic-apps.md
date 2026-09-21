# AX-DE-12 — Logic App connections

**Wave:** AX-DE. **Depends on:** AX-DE-01.

Follow [`.cursor/prompts/azure-extractor-diagram-enrichment-00-index.md`](azure-extractor-diagram-enrichment-00-index.md) global constraints.

## Goal

Collect Consumption `Microsoft.Logic/workflows` connection references and `Microsoft.Web/connections` into optional `logic-app-connections.json` and emit `logicAppConnection`.

## Why

Logic Apps are the ADF cousin for **app integration**. Connection resources often hold ARM ids or typed hosts for SQL, Blob, Service Bus.

## Context

- Hosted type lists do not include Logic today
- Standard Logic Apps (`Microsoft.Web/sites` kind `workflowapp`) need extra child GETs — **fail-soft** with warning `logic-app-standard-not-collected`; do not Kudu into `wwwroot`

## What to build

1. Type-scoped list `Microsoft.Logic/workflows` + `Microsoft.Web/connections`.
2. From workflow `properties.parameters.$connections` / `definition.actions` extract **static** connection names and `id` ARM ids. Skip expressions.
3. From `Microsoft.Web/connections` `properties.api.id` + sanitized host/displayName. Redact `parameterValues`.
4. Map workflow → connection ARM id `logicAppConnection` (DerivedFact). If connection maps to an inventoried SQL/storage ARM id, also workflow → that resource (Probable / DerivedFact). Host-only → Inferred.
5. Tests: Consumption workflow → Azure Blob connection ARM id; parameterValues with connectionString not persisted; Standard site warning without crash.

## Acceptance criteria

- GET only. No run history / trigger payloads.
- Optional companion.

## Constraints

- Compile Integrations + Pester if you add a helper.
- Do not implement Standard designer JSON from SCM.

## Done when

A Consumption Logic App connected to SQL shows **Connected to** the connection and, when resolvable, the SQL server.

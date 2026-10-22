# IE-RF-10 — Optional effective NSG and effective routes (fail-soft)

Follow [`.cursor/prompts/infra-evidence-relationship-first-00-index.md`](infra-evidence-relationship-first-00-index.md) global constraints. **Depends on IE-RF-07**. Optional; must not block RF-01–IE-RF-09.

## Goal

Add **optional** GET-only collection of NIC `effectiveNetworkSecurityGroups` and `effectiveRouteTable` for intended-reachability / Security diagram mode. Fail soft when the API is missing, the NIC is gone, or Reader is denied. Never use these as ObservedFact architecture edges on Executive/Network default.

## Why

Declared NSG association ≠ effective rules after inheritance, Azure defaults, and Azure Firewall / UDR. SA-05 needs effective controls when present, labeled DeterministicInference.

## Context

- ARM GET `{nicId}/effectiveNetworkSecurityGroups?api-version=…`
- ARM GET `{nicId}/effectiveRouteTable?api-version=…`
- `GetOnlyHostedAzureArmReadClient` GET-only
- PowerShell `Invoke-AzRestMethod` already used for PIM/federated credentials
- SA-05 intended reachability (do not re-implement the engine; only collect evidence)

## What to build

1. New optional ZIP sibling **or** bounded property bag on the NIC resource, e.g. `effective-network-controls.json`. Prefer one sibling array: `{ nicResourceId, kind: effectiveNsg|effectiveRoutes, payloadRef/hash, collectionStatus }`. Redact nothing secret; still never dump Key Vault secrets.
2. Gate: only NICs already in inventory. Cap count (document, e.g. 200 NICs) with warning `effective-controls-capped`.
3. Hosted + Tier 1. Missing API → `CollectionStatus=Skipped` + warning, ZIP still Succeeded/Partial.
4. Materialize **Security-mode / reachability** edges as DeterministicInference `ROUTES_TO` / `APPLIES_TO` citing the sibling file — **or** store properties only and leave engine wiring to a follow-on SA-05 slice. This prompt must **not** add ObservedFact “packets allowed.”
5. Do **not** call Network Watcher `topology` in this prompt (watcher often absent). If you add a stub, it must be skipped with warning, not a second graph source.
6. Tests: 403/404 → skip; fixture effective NSG JSON → DeterministicInference not ObservedFact; Executive mermaid compile does not require these rows.

## Acceptance criteria

- Reader-only. No new roles.
- Default Executive/Network diagrams unchanged if the sibling is absent.

## Constraints

- Do not enable flow logs.
- Compile: Integrations.AzureExtractor.Tests + Application.Tests materializer if you map edges.

## Done when

A NIC with an effective NSG fixture produces a non-observed control edge **or** a stored sibling row with status Succeeded, and a 404 produces Skipped without failing ingest.

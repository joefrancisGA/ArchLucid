# SA-19 — Federated CI identity adapter

**Do not** block Azure-spine engines if GitHub/ADO evidence is absent. Follow [`.cursor/prompts/securenow-architect-00-index.md`](securenow-architect-00-index.md) global constraints.

## Goal

Optional evidence for federated credentials (GitHub Actions / Azure DevOps OIDC → Entra app → Azure RBAC) as snapshot sibling JSON or a small ingest API. When present, SA-03 privilege paths may include `FEDERATES_AS` hops. When absent, completeness warning + no invented edges.

## Why

Developer → repo admin → workflow → federated identity → Contributor is transitive production authority without Azure RBAC on the human. It is the highest-value path family after Azure RBAC+network, and a **separate collector**.

## Context

- Plane §10 adapters
- IE-02 ZIP schema upgrader (extend optional sibling; do not add a second collector family)
- `scripts/azure/Get-ArchLucidAzurePackage.ps1` — only if you can collect federated identity **via ARM/Graph already in Reader scope**; otherwise document customer-supplied `federated-credentials.json` in the ZIP
- No GitHub App that writes workflows

## What to build

1. Schema: issuer, subject, appId, Azure principal id, evidence hashes. Provenance ObservedFact only for rows from ARM `federatedIdentityCredentials` GET you actually add to the **existing** extractor, else HumanAssertion/customer file labeled as such.
2. SA-02 edge `FEDERATES_AS` when both principal and credential rows exist.
3. Privilege engine: human/repo identity is **not** required in V1 if you only have the Entra federated credential + Azure role. Title should say “federated deployment identity” not “this developer” unless GitHub admin evidence exists (out of scope unless a file is supplied).
4. Tests: missing file → no edge, warning; present credential + Contributor → privilege path; no secrets in fixtures.

## Acceptance criteria

- Hosted path does not request GitHub org admin or Entra Global Reader.
- Fail soft.

## Constraints

- Compile: extractor tests and/or Application tests as touched. Prefer `ArchLucid.Integrations.AzureExtractor.Tests` if the ZIP schema changes.

## Done when

A fixture ZIP with federated credentials extends privilege paths; empty ZIP still runs SA-03.

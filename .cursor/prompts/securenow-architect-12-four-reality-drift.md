# SA-12 — Four-reality path drift

**Do not** treat diagram/IaC/Azure mismatch as a generic CIS miss. Follow [`.cursor/prompts/securenow-architect-00-index.md`](securenow-architect-00-index.md) global constraints.

## Goal

When a privilege or reachability hop depends on a control (public access, PE, NSG, role), compare **observed snapshot** to advisory Terraform mapping (IE-05), diagram reconciliation (IE-19), and prior snapshot (IE-06). Emit `PathKind=FourRealityDrift` when observed Azure re-opens or widens a path the other realities said was closed.

## Why

“Diagram says App → PE → SQL; Azure re-enabled public network access” is design-control failure, not “storage public = HIGH.”

## Context

- Plane §5 FourRealityDrift
- IE-05 mapping; IE-06 change types (`NetworkExposureChanged`, `PermissionChanged`); IE-19 reconcile if present
- SA-03/SA-05 paths on snapshot B

## What to build

1. Join path hops’ `CloudResourceId` to diff rows and TF mapping public-access properties.
2. Finding copy names the four realities that disagree. Provenance: observed hop ObservedFact; “TF intended private” DerivedFact from mapping; diagram edge DeterministicInference or HumanAssertion per IE-19 labels — **do not relabel**.
3. If TF/diagram absent, still compare historical vs current (temporal). Missing diagram ≠ invent a firewall.
4. Tests: TF mapping public=false + snapshot public=true + privilege path → drift finding; identical realities → none; no diagram file → temporal-only still works.

## Acceptance criteria

- Drift finding cites PathId **and** ChangeId when a diff exists.

## Constraints

- AI must not write change rows (IE-08 invariant).
- Compile: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'`

## Done when

Public-access re-enable on a pathed resource is a drift path, not only a property diff.

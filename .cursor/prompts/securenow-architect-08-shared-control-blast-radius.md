# SA-08 — Shared-control blast radius

**Do not** treat centralization as inherently safe. Follow [`.cursor/prompts/securenow-architect-00-index.md`](securenow-architect-00-index.md) global constraints.

## Goal

Compute fan-out of shared security controls: shared managed identity, role assignments at subscription/MG scope, policy assignment at root/MG, central Key Vault used by many resources. Persist `PathKind=SharedControlBlastRadius` and a finding that names the control and the count of dependents.

## Why

A misconfigured central firewall, root policy, or shared MI can affect thousands of resources. Scanners score the VM. Architects score the choke-point control.

## Context

- Plane §5 SharedControlBlastRadius
- SA-02 edges; snapshot policy/identity tables
- IE-15 blast-radius field (string today) — do not replace IE-15; paths are the record

## What to build

1. Identify shared controls: same MI on ≥ N resources (config, default 2); assignment scope subscription or management group; Key Vault with ≥ N access policies/role assignments; policy assignment not at RG.
2. Path: control node → dependents (ObservedFact assignments). Finding includes `dependentCount` in metadata table (not unbounded JSON blob).
3. Copy: “centralization improves consistency and increases correlated failure.” Do not say “centralization is unsafe” as a universal.
4. Tests: one MI on 3 storage accounts → finding; unique MI per resource → no shared finding; MG policy assignment counted.

## Acceptance criteria

- Fan-out is a count of cited snapshot rows, not an LLM estimate.

## Constraints

- No apply to split identities.
- Compile: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'`

## Done when

Shared MI and root-scope policy show larger radius than a single VM public IP.

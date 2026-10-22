# SA-10 — Cut-point analysis

**Do not** recommend a theoretical min-cut that ignores operational cost. Follow [`.cursor/prompts/securenow-architect-00-index.md`](securenow-architect-00-index.md) global constraints.

## Goal

Given ranked paths on a snapshot, identify nodes/edges whose removal would collapse the most paths, weighted by a coarse operational-cost class. Persist `SecurityEvidenceCutPoint` and surface it on path GET / ranked list.

## Why

Fixing one federated deploy identity can collapse 150 paths. Naive min-cut without cost recommends the politically impossible change and never ships.

## Context

- Plane §7 cut points
- SA-09 ranks
- Remediation patterns (IE-10) — optional join by resource type; do not auto ExactMatch via AI

## What to build

1. Cost classes (documented enum): `IdentityFederation`, `RoleAssignment`, `NetworkNsG`, `PrivateEndpointDns`, `PublicAccessProperty`, `Unknown`. Default weights: cheaper class preferred when path-collapse counts are close (document the formula).
2. Cut point record: node/edge id, pathsCollapsed count, cost class, `LeverageScore` (deterministic), evidence refs.
3. Do not execute. Optional: suggest pattern keys already Approved that match the cut resource type (IE-11 matcher), Conflicts fail closed.
4. Tests: 3 paths sharing one MI vs 3 disjoint public IPs — MI wins if collapse count dominates; cost class tie-break unit test; empty snapshot no crash.

## Acceptance criteria

- Cut points cite path ids.
- No apply.

## Constraints

- Compile: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'`

## Done when

The factory can show “fix this identity, collapse N paths” as advisory work.

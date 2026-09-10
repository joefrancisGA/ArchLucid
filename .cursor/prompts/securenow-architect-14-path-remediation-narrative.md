# SA-14 — Path-aware advisory remediation

**Do not** mutate customer Azure. Follow [`.cursor/prompts/securenow-architect-00-index.md`](securenow-architect-00-index.md) global constraints.

## Goal

When a remediation instance (IE-13) is created from a finding that cites a `PathId`, persist an architect narrative: problem, why it matters, exposure, affected dependencies, recommended change, preconditions, blast-radius warning, safe rollout steps, verification queries against the **next** snapshot.

## Why

“HIGH: public storage account” is a scanner. An architect says what path breaks, what might break operationally, and how to prove the path is gone.

## Context

- Plane §8
- `docs/library/REMEDIATION_INSTANCE_WORKFLOW.md`
- IE-10 pattern execution definition (verification queries)
- SA-10 cut points (prefer cut as recommended change when present)

## What to build

1. `RemediationPathNarrative` (or columns on instance): structured fields, not one LLM blob as source of truth. Optional AiInference **summary** that cites those fields (SA-17 can fill later; this prompt may use deterministic templates only).
2. Rollout template for public-access cuts: create PE → validate DNS → canary → migrate → disable public. Other cuts get generic preflight + verify.
3. Verification: reuse IE-13 `property:key=value` / resource presence against **later** snapshot; add path-hash-absent as a verification kind if cheap.
4. Tests: instance without PathId still works (IE-13 regression); with PathId, narrative required fields present; execute still `result=emitted` advisory; grep no `terraform apply`.

## Acceptance criteria

- Blast-radius warning lists dependent CloudResourceIds from the path, not “may affect systems.”

## Constraints

- Compile: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'`

## Done when

A public-storage path instance explains PE-first rollout and independent verify.

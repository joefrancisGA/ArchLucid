# DR-04 — Working career path cannot hide a disabled pre-commit gate

**Do not weaken** Staging/Production `AgentOutput.QualityGate` PilotStrict (already on). **Do not fork** quality-gate floors (DR-05). This prompt is the **governance pre-finalize** switch.

## Goal

`ArchLucid:Governance:PreCommitGateEnabled` defaults **false**, so commits skip policy-pack / severity blocking unless an operator opts in (`PRE_COMMIT_GOVERNANCE_GATE.md`). For Working **production-like** hosts, enable the gate (Staging/Production appsettings + Terraform/config lint). For local/dev where the gate stays off, Working career export and finalize **cannot** present Ready: a persistent banner “Pre-finalize governance gate is off — this seal is not career-complete” and DR-01-style export block.

Do not enable the gate on Guided sample-mode if that would break teaching fixtures — label those seals sample.

## Why

A livelihood-critical desk does not treat governance blocking as an optional lab flag. Fail-open commit is an evaluator default.

## Context

- `PreCommitGovernanceGateOptions.cs`
- `docs/library/PRE_COMMIT_GOVERNANCE_GATE.md`
- `ArchLucid.Api/appsettings.json` vs `appsettings.Staging.json` / `appsettings.Production.json`
- `docs/runbooks/CI_GOVERNANCE_GATE.md`

## What to build

1. Production-like hosted profile: `PreCommitGateEnabled: true` (or document why Terraform already sets it and pin the lint).
2. Working UI reads gate enabled from a safe config/status endpoint already used by health/readiness — if missing, add a narrow field, not a new product.
3. Banner + career-export block when disabled on Working.
4. Tests: gate off → Working finalize honesty + export blocked; gate on → existing block-on-critical behavior.

## Acceptance criteria

- A reviewer cannot screenshot Working Ready while the pre-commit gate is off.
- PilotStrict quality settings on Staging/Production are untouched.

## Constraints

- Buyer-facing name stays **pre-finalize**; API key names stay pre-commit.
- No GTM cohort work.

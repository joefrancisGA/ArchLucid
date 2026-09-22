# V12-03 — Full `ci.yml` matrix triage (QR-35 carry)

**Wave:** v12 quality-ROI (**V12-03**). **Cluster:** runtime / CI honesty. **Depends on:** V12-02 (trunk at wave 22).

Do not implement from the index. Implement only *What to build*.

## Goal

Dispatch or inspect the latest full `.github/workflows/ci.yml` matrix on current `master` and fix only cheap, in-contract reds that still fail on that SHA.

## Why

v12 Runtime score stays **77** while OpenAPI fail-fast is green. Full matrix last dispatched **2026-08-28** (failure). PR-lane reds on docs link integrity, pre-corset guards, and Azure extractor Pester are not the OpenAPI snapshot.

## Context

- `.github/workflows/ci.yml`
- `gh run list --workflow ci.yml --branch master --limit 8`
- `docs/architecture/V11_QUALITY_ROI_COMPOSER_PROMPTS.md` QR-35 (same intent)
- Do **not** re-do QR-13 emission golden work

## What to build

1. Confirm wave 22 is on trunk (after V12-02). If not, stop and say merge first.

2. Inspect or dispatch full matrix if environment allows `workflow_dispatch`. Do not watch indefinitely.

3. Classify each red job:
   - **(a)** cheap docs/guard/script fix → fix in this PR
   - **(b)** known flake → document with run id
   - **(c)** owner/infra blocked → write hold note with log link

4. Fix only **(a)**. Do not disable required checks. Do not skip Suite=Core to go green.

5. Add a short triage note under `docs/engineering/` or PR description listing job name, root cause, fix or hold.

## Acceptance criteria

- Each failing job on the inspected SHA is either fixed, documented flake, or owner-blocked with evidence link.
- No claim that green typecheck == green full matrix unless matrix actually ran green.

## Constraints

- **Do not** start DX-77 or new engines.
- **Do not** fake Gate 1 or G-REAL-06.
- **Do not** enable merge queue (owner).
- One scoped compile if C# fixes: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath '…'`.

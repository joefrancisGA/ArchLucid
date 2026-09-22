# V12-04 — Gate 1 staging checklist (owner-assisted)

**Wave:** v12 quality-ROI (**V12-04**). **Cluster:** validation / proof-of-ROI. **Owner executes the run.**

Do not implement from the index. Implement only *What to build*.

## Goal

Produce a repeatable owner runbook for Gate 1 (first review create → execute → commit → manifest + artifact) **with a bound inventory snapshot**, and verify `archlucid pilot ship-gate-evidence --run-id <guid>` wiring — without faking PASS.

## Why

Gate 1 is the only **UNKNOWN** numbered ship gate. v12 Proof-of-ROI stays **76** with G4 0/3 until a real run exists. Bind now changes execute — the gate must include a snapshot.

## Context

- `docs/assessments/LATEST_GPT55-v12-post-wave22.md` §4 Gate 1
- `archlucid pilot ship-gate-evidence` CLI (TB-409+ shipped)
- AS-050 execute merge + AS-048 attach on branch/trunk after merge

## What to build

1. Read existing ship-gate docs and CLI help. Document prerequisites: staging tenant, scope, architecture with **bound snapshot**, Real or Career door as owner directs (no host Mode flip).

2. Step-by-step runbook (markdown under `docs/engineering/` or `docs/go-to-market/` — pick existing ship-gate doc location if one exists; extend, do not duplicate).

3. Verify locally that CLI parses `--run-id` and emits Gate 1 section structure (can use a fixture run id only to test **UNKNOWN** path — do **not** commit a fake PASS).

4. Checklist item: after owner run, archive evidence under `artifacts/ship-gate-evidence/{runId}/` per TB-418.

## Acceptance criteria

- Owner can follow the runbook without asking which bind step was added in AS-050.
- Composer did not mark Gate 1 PASS without a real staging run id from the owner.
- Runbook explicitly says two-pack compare is **G-REAL-06**, not Gate 1.

## Constraints

- **Do not** flip `AgentExecution:Mode` default.
- **Do not** fabricate pilot transcripts or G4 rows.
- **Do not** run destructive staging mutations without owner scope.
- Docs-only prompt unless CLI has a genuine bug blocking `--run-id` parsing.

# LP-18 — Pre-commit gate Working honesty (DR-04 leftover)

Do **not** re-implement DR-04. Do not weaken Staging/Production PilotStrict. Do not enable the gate on every local Simulator.

## Goal

Verify [`defensible-record-04-precommit-gate-working-default.md`](defensible-record-04-precommit-gate-working-default.md). If Working can still screenshot **Ready** / career-complete while `PreCommitGateEnabled` is false on a production-like host, finish:

1. Production-like hosted profile keeps `PreCommitGateEnabled: true` (already in Production/Staging appsettings — pin lint if missing).
2. Working finalize/export **blocked** with named copy when the gate is off (local/dev).
3. Root `appsettings.json` may stay false for unit tests — then Working UI must not claim a fully governed sealed record.

## Why

Livelihood desk + fail-open commit is an evaluator default. DR-04 named it; Production JSON is not the whole story if the UI still says Ready.

## Context

- `PRE_COMMIT_GOVERNANCE_GATE.md`
- `ArchLucid.Api/appsettings.json` vs `appsettings.Production.json`
- ADR 0078 Ready/status tags

## What to build

1. Grep Working Ready + gate-off; add banner + export block if missing.
2. Config lint or test: Production/Staging true.
3. Do not flip local default to true if that breaks Simulator teaching fixtures — honesty instead.

## Acceptance criteria

- Working cannot present career-complete Ready while pre-commit is off.
- DR-04 file is not pasted as a second implementation.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- **Do not** rewrite ADR 0067–0081 bodies except Related pointers. This wave **adds ADR 0082** and **ADR 0083**.
- **Do not** change `DeterministicInsightDensityGate` demotion predicate. **Do not** add a 40th coverage engine or fake frontier transcripts.
- **Do not** invent per-architecture ACL, live presence avatars, or finding-comment chat (ADR 0037).
- **Do not** flip `AgentExecution:Mode` default from Simulator to Real. No G-REAL-06.
- **Do not** re-run WS-01–24, SY, FC, DR, DX, PC, LK except as a named leftover. Implement only *What to build*.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary. Sentence case. **TB-2005** form validation.
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- New ADRs need **Trade-offs**, **Constraints**, and **Expected impact** (include security). SQL stays in the single DDL file per database plus a numbered migration if schema changes.

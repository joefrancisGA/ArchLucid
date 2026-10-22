# FP-03 — Seed inspect hook with the current-pointer token

Do not POST yet (FP-04/05). Pass the value into the dispositions hook and keep it updated on `reload()`.

## Goal

Thread `latestDispositionRowVersionBase64` from the inspect page payload into `useFindingInspectGovernanceStickiness` → `useFindingInspectGovernanceStickinessDispositions`.

After `listFindingDispositions` reload, prefer `history[0]?.currentDispositionRowVersionBase64` via the FP-02 helper.

Hold the resolved token in hook state (`expectedCurrentDispositionRowVersionBase64: string | null`).

`FindingInspectView.tsx` already reads `payload.latestDispositionRowVersionBase64` for ITSM divergence (~L198). Pass that same field into the stickiness panel props. Do not fetch a second inspect document.

## Why

The inspect page already has the pointer token for divergence banners. The save path never sees it.

## Context

- `FindingInspectView.tsx`
- `FindingInspectGovernanceStickinessPanel.tsx` / `use-finding-inspect-governance-stickiness.ts`
- `use-finding-inspect-governance-stickiness-dispositions.ts` (`reload` already loads history)
- FP-02 helper

## What to build

1. Add optional `latestDispositionRowVersionBase64` to panel/hook props.
2. Seed + refresh on reload using FP-02.
3. Export the current expected token from the dispositions hook (tests/later prompts).
4. Vitest or existing panel test: after mock history with `currentDispositionRowVersionBase64: "AAA="`, hook state is `"AAA="`.

## Acceptance criteria

- Empty history + missing payload → token is `null`/`undefined`.
- History wins over stale inspect payload after reload.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- **Do not** rewrite ADR 0076 body except Related pointers. Do **not** add a new ADR. FP-22 may correct the stale PA table in `docs/library/FINDING_CONCURRENT_DISPOSITION_CONFLICT_CONTRACT.md`.
- **Do not** implement LP-19 (401 resume / idempotency replay) or LP-20. This wave only attaches the CAS token and 409 recovery.
- **Do not** invent per-architecture ACL, live presence avatars, or finding-comment chat (ADR 0037).
- **Do not** flip `AgentExecution:Mode` default from Simulator to Real. No G-REAL-06.
- **Do not** re-run WS-01–24, SY, FC, DR, DX, PC, LK, LP except as a named leftover. Implement only *What to build*.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary. Sentence case. **TB-2005** form validation.
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- Prefer **no schema change** — `RowVersionStamp` already exists on `dbo.FindingCurrentDispositions`. SQL stays in the single DDL file per database plus a numbered migration only if a schema change is unavoidable.

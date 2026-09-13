# IP-015 — Close audit: inhabit post-IR leftovers

**Wave:** inhabit post-IR leftovers (**IP**). **Not wave 35.** **Cluster:** close. **Depends on:** IP-001–014 product rows.

Do not implement from the post-IR index. Implement only *What to build*.

## Goal

After product post-IR IPs, write a short close note: which inventory booleans flipped, which skips stayed, ADR 0100 still Accepted, wave 35 not started, G-REAL-06 not shipped.

## Why

Remain close claimed IR shipped while inspector landings still leaked. Post-IR needs an explicit close so the next diagnosis does not restart an 80-prompt pack.

## Context

- `INHABIT_REMAIN_ACCEPTANCE_2026-09-13.md` pattern · `WORKING_ARCHITECT_DIAGNOSIS_2026-09-13_POST_IR.md`

Leftover owners named in Depends on — do not re-run those bodies.

## What to build

1. Add `docs/architecture/INHABIT_POST_IR_ACCEPTANCE_2026-09-13.md` listing IP-002–011 shipped, IP-012 skip, IP-013 inventories match TS, IP-014 test green. Point the post-IR diagnosis at this acceptance. Do not mark G-REAL-06 shipped.
2. Do not implement leftover product in the close-audit session if post-IR inventories still show open product rows — stop and name the open IP.
3. This prompt-set PR must **not** claim product post-IR IPs shipped.

## Acceptance criteria

Done when *What to build* is true and any tests named there pass. Working vs Guided split holds unless this prompt says otherwise. Nested review workspace tabs stay a full strip. Emit LLM judge stays default off. Real finalize judge stays default on unless this prompt is an explicit skip. Host Mode stays Simulator. 300s undo stays 300s.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`). Nested review chrome keeps the full strip when a job is open.
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records (ADR 0039).
- **Do not** change `DeterministicInsightDensityGate` `typed-engine-protected`. **Do not** add a 40th coverage engine.
- **Do not** invent live presence avatars, cursors, occupancy heartbeats, or finding-comment chat.
- **Do not** flip `AgentExecution:Mode` host default from Simulator to Real. No G-REAL-06.
- **Do not** reopen **TB-135 / TB-136**. No GTM **M-90 / M-44 / M-91 / M-92**.
- **Do not** lengthen `MUTATION_UNDO_WINDOW_SECONDS = 300`.
- **Do not** restore system-wide breadcrumbs (**TB-2090**).
- Emit `ArchLucid:Findings:SemanticSupportBand:EnableLlmJudge` stays **false** unless this prompt's *What to build* says otherwise.
- TB-645 vocabulary. Sentence case. **TB-2005** form validation. Visible-boundary `Button` (no ghost/link).
- User-facing execute labels are **Record** / **Practice** (ADR **0097**). Stored tokens stay `"career"` / `"rehearsal"`. Do not resurrect **Career blocked**.
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- New ADRs need **Trade-offs**, **Constraints**, and **Expected impact** (include security). SQL stays in the single DDL file per database (`ArchLucid.Persistence/Scripts/ArchLucid.sql`) plus a numbered migration if schema changes.
- OpenAPI snapshot + generated TS types when wire contracts change (`docs/library/API_CONTRACTS.md`).
- **Do not** re-run SG-001–081, LY-001–120, CG, SN, LN, LW, MG, DI, CE, DW, RP, **IH-001–080**, or **IR-001–018** product bodies except as a numbered leftover named in Context. **Do not** remount the CE Sketch runner. **Do not** invent `GET /v1/runs/{runId}/progress`. **Do not** draft-diff Compare.
- **Do not** start wave 35 or paste an 80-prompt pack. This file is one inhabit-post leftover (**IP**).
- Leftover owner: named in Context. **Do not re-implement that file.** Implement only *What to build*.
- If mounting start-honesty wrappers, do **not** call `useWorkspaceMode()` inside a wrapper that must render null without a provider (`WorkingExecuteStartHonestyNotices` pattern).
- Nested review-detail stays a **job inspector** (ADR 0098). Do not make it Monday morning. Peer `/governance/findings` stays peer (**IR-015**).

> **Scope:** Copy-paste Composer prompts — Daytime-wait Composer prompts (DW-001–DW-024). Internal engineering only — not buyer-facing copy.
> **Spine:** [`START_HERE.md`](../START_HERE.md) · **Founding contract:** [`ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md`](../ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md) R4 / R13 · **UI standard:** [`../library/UI_DESIGN_SYSTEM.md`](../library/UI_DESIGN_SYSTEM.md)
> **Paste-ready files:** [`.cursor/prompts/daytime-wait-00-index.md`](../../.cursor/prompts/daytime-wait-00-index.md) (**DW-001–DW-024**)
> **Predecessor:** [`CHEAP_EXPLORATION_COMPOSER_PROMPTS.md`](CHEAP_EXPLORATION_COMPOSER_PROMPTS.md).
> **Successor overlay:** [`RECORD_PRACTICE_COMPOSER_PROMPTS.md`](RECORD_PRACTICE_COMPOSER_PROMPTS.md) (**RP-001–024**, wave 31). Family close remains [`LIVELIHOOD_GRAVITY_COMPOSER_PROMPTS.md`](LIVELIHOOD_GRAVITY_COMPOSER_PROMPTS.md).

# Daytime-wait Composer prompts (DW-001–DW-024)

**Created:** 2026-09-11 · **Status:** shipped (DW-024 close audit [`DAYTIME_WAIT_ACCEPTANCE_2026-09-12.md`](DAYTIME_WAIT_ACCEPTANCE_2026-09-12.md)) · **Do not re-run** prior waves except as a numbered leftover.

ArchLucid is a working-architect tool: people will sit in it much of the day, and their livelihoods may depend on the sealed record.

Paste **one** `.cursor/prompts/daytime-wait-NNN-*.md` file per Composer session. Do not implement from this document’s tables.

## The problem these prompts solve

Real-mode execute can exceed edge proxy ceilings. Sync wait owns the tab. Fake % and missing `GET /v1/runs/{id}/progress` lie. ADR **0096**: Career Real never owns the tab; operations poll only; Simulator sync sibling stays labeled.

### Done test

After this wave:

1. Working Career Real uses 202 + operations, not the missing progress URL.
2. No stay-on-this-page on Working.
3. No fake percentComplete.
4. Cancel confirm remains.
5. Simulator fast-complete is labeled rehearsal.

## Diagnosis → prompt

| Class | Prompts |
|-------|---------|
| ADR + inventory + 202 | **DW-001–012** |
| Ratchets / skips / close | **DW-013–024** |

## Sequencing

See [`.cursor/prompts/daytime-wait-00-index.md`](../../.cursor/prompts/daytime-wait-00-index.md).

Load-bearing ADRs: **0096**; TB-2072 contract not replaced.

## Intentional — do not “fix”

- Desktop review **workspace tabs** stay a full strip (no **More** menu).
- 300-second silent Undo toast stays 300s.
- ADR 0068 two kernels and two SQL tables stay.
- Sealed records stay immutable.
- Guided / demo / trial **remain** eval sessions.
- `AgentExecution:Mode` host default **Simulator** stays; Career vs Rehearsal is chrome + stamp (no G-REAL-06).
- No live presence / finding-comment chat / per-architecture ACL beyond RestrictToShares (0087).
- No 40th coverage engine.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.

## Global constraints

See the index. Working-tree safety; TB-645; TB-2005; focused tests; scoped compile; OpenAPI when wire changes.

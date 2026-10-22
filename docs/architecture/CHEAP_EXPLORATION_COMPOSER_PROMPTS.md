> **Scope:** Copy-paste Composer prompts — Cheap-exploration Composer prompts (CE-001–CE-040). Internal engineering only — not buyer-facing copy.
> **Spine:** [`START_HERE.md`](../START_HERE.md) · **Founding contract:** [`ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md`](../ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md) R4 / R13 · **UI standard:** [`../library/UI_DESIGN_SYSTEM.md`](../library/UI_DESIGN_SYSTEM.md)
> **Paste-ready files:** [`.cursor/prompts/cheap-exploration-00-index.md`](../../.cursor/prompts/cheap-exploration-00-index.md) (**CE-001–CE-040**)
> **Predecessor:** [`DESK_IA_COMPOSER_PROMPTS.md`](DESK_IA_COMPOSER_PROMPTS.md) · SN ADR **0092**.
> **Successor:** [`DAYTIME_WAIT_COMPOSER_PROMPTS.md`](DAYTIME_WAIT_COMPOSER_PROMPTS.md).

# Cheap-exploration Composer prompts (CE-001–CE-040)

**Created:** 2026-09-11 · **Status:** shipped (CE-040 close audit [`CHEAP_EXPLORATION_ACCEPTANCE_2026-09-12.md`](CHEAP_EXPLORATION_ACCEPTANCE_2026-09-12.md)) · **Do not re-run** prior waves except as a numbered leftover.

ArchLucid is a working-architect tool: people will sit in it much of the day, and their livelihoods may depend on the sealed record.

Paste **one** `.cursor/prompts/cheap-exploration-NNN-*.md` file per Composer session. Do not implement from this document’s tables.

## The problem these prompts solve

Exploration and collab are second-class. R12 full-run what-if is too expensive for daily sketches. Chat and live presence stay forbidden. This wave **mounts** the labeled cheap envelope (default Rehearsal), Compare after commit, shares/lease/dispositions as collab substitutes.

### Done test

After this wave:

1. Working Sketch CTA exists and defaults Rehearsal.
2. Compare after envelope commit.
3. No draft-diff, chat, or presence.
4. Parent seal immutable.
5. Guided need not mount the CTA.

## Diagnosis → prompt

| Class | Prompts |
|-------|---------|
| Runner + Compare + collab substitutes | **CE-001–016** |
| Skips / ratches / close | **CE-017–040** |

## Sequencing

See [`.cursor/prompts/cheap-exploration-00-index.md`](../../.cursor/prompts/cheap-exploration-00-index.md).

Load-bearing ADRs: **0092** (owned by SN); this wave implements the runner.

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

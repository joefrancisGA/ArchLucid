> **Scope:** Copy-paste Composer prompts — Mode-gravity Composer prompts (MG-001–MG-024). Internal engineering only — not buyer-facing copy.
> **Spine:** [`START_HERE.md`](../START_HERE.md) · **Founding contract:** [`ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md`](../ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md) R4 / R13 · **UI standard:** [`../library/UI_DESIGN_SYSTEM.md`](../library/UI_DESIGN_SYSTEM.md)
> **Paste-ready files:** [`.cursor/prompts/mode-gravity-00-index.md`](../../.cursor/prompts/mode-gravity-00-index.md) (**MG-001–MG-024**)
> **Predecessor:** [`LIVELIHOOD_GRADE_NO_COMPOSER_PROMPTS.md`](LIVELIHOOD_GRADE_NO_COMPOSER_PROMPTS.md).
> **Successor:** [`DESK_IA_COMPOSER_PROMPTS.md`](DESK_IA_COMPOSER_PROMPTS.md).

# Mode-gravity Composer prompts (MG-001–MG-024)

**Created:** 2026-09-11 · **Status:** shipped (wave 27 — MG-001–MG-024) · Close audit: [`MODE_GRAVITY_ACCEPTANCE_2026-09-11.md`](MODE_GRAVITY_ACCEPTANCE_2026-09-11.md) · **Do not re-run** prior waves except as a numbered leftover.

ArchLucid is a working-architect tool: people will sit in it much of the day, and their livelihoods may depend on the sealed record.

Paste **one** `.cursor/prompts/mode-gravity-NNN-*.md` file per Composer session. Do not implement from this document’s tables.

## The problem these prompts solve

Working / Guided / Career / Rehearsal / demo / trial / operator-experience / product-line is too many modes for an instrument. ADR **0094**: Working has one execute gravity; operator-experience is density not Mode; Guided stays a second product.

### Done test

After this wave:

1. Working eval chrome remains false.
2. Two customer controls: workspace mode vs door.
3. operator-experience not treated as Mode.
4. Guided/demo/trial still eval.
5. Host Mode default unchanged.

## Diagnosis → prompt

| Class | Prompts |
|-------|---------|
| ADR + inventory + story | **MG-001–012** |
| Skips / ratchets / close | **MG-013–024** |

## Sequencing

See [`.cursor/prompts/mode-gravity-00-index.md`](../../.cursor/prompts/mode-gravity-00-index.md).

Load-bearing ADRs: **0094**; 0080/0086/0091 not rewritten.

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

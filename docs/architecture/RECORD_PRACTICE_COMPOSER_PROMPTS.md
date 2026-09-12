> **Scope:** Copy-paste Composer prompts — Record-practice copy overlay (RP-001–RP-024). Internal engineering only — not buyer-facing copy.
> **Spine:** [`START_HERE.md`](../START_HERE.md) · **Founding contract:** [`ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md`](../ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md) R4 / R13 · **UI standard:** [`../library/UI_DESIGN_SYSTEM.md`](../library/UI_DESIGN_SYSTEM.md)
> **Paste-ready files:** [`.cursor/prompts/record-practice-00-index.md`](../../.cursor/prompts/record-practice-00-index.md) (**RP-001–RP-024**)
> **Predecessor:** [`CAREER_GRAVITY_COMPOSER_PROMPTS.md`](CAREER_GRAVITY_COMPOSER_PROMPTS.md) (**CG-001–100**, shipped). Do **not** re-run CG.
> **Family:** [`LIVELIHOOD_GRAVITY_COMPOSER_PROMPTS.md`](LIVELIHOOD_GRAVITY_COMPOSER_PROMPTS.md) (waves 24–30). This overlay is livelihood UX **wave 31**.

# Record-practice Composer prompts (RP-001–RP-024)

**Created:** 2026-09-12 · **Status:** shipped (close audit [`RECORD_PRACTICE_ACCEPTANCE_2026-09-12.md`](RECORD_PRACTICE_ACCEPTANCE_2026-09-12.md)) · **Do not re-run** CG / AS-076–085 bodies except as a numbered leftover.

ArchLucid is a working-architect tool: people will sit in it much of the day, and their livelihoods may depend on the sealed record.

Paste **one** `.cursor/prompts/record-practice-NNN-*.md` file per Composer session. Do not implement from this document’s tables.

## The problem these prompts solve

ADR 0086 / 0091 shipped **Career** vs **Rehearsal** as Working execute chrome. The honesty model is right: Simulator must not screenshot as unlabeled sealed-record proof. The **word** is wrong. A human reading **Career** in the top bar, then **Career blocked** in a dialog, hears a verdict on their job if the tool makes a mistake.

Owner 2026-09-12: user-facing labels are **Record** and **Practice**. Stored tokens stay `"career"` / `"rehearsal"`. ADR **0097** records the label split. Honesty gates stay.

### Done test

After this wave:

1. Working top bar shows **Record | Practice**, not Career | Rehearsal.
2. No user-visible **Career blocked** / **Career door blocked** / **Career execute stays blocked**.
3. Help H1 and CLI help say Record / Practice. Old help slugs remain aliases.
4. Stored token `"career"` / `"rehearsal"` unchanged. Host Mode default unchanged. Guided still hides the chooser.
5. Career+Simulator finalize/export still blocked or watermarked (CG). The rename must not weaken gates.
6. Duplicate Practice chip does not sit next to the Practice segment on Simulator clones.

## Diagnosis → prompt

| Class | Prompts |
|-------|---------|
| ADR + inventory + central labels | **RP-001–003** |
| Chrome + blocked-state (P0 threat) | **RP-004–006**, **RP-010** |
| Honesty / help / CLI / outbound copy | **RP-007–016**, **RP-019–020** |
| Ratchets / skips / close | **RP-017–024** |

## Sequencing

See [`.cursor/prompts/record-practice-00-index.md`](../../.cursor/prompts/record-practice-00-index.md).

Load-bearing ADR: **0097** (this wave). **0086** / **0091** / **0078** not rewritten.

## Intentional — do not “fix”

- Desktop review **workspace tabs** stay a full strip (no **More** menu).
- 300-second silent Undo toast stays 300s.
- ADR 0068 two kernels and two SQL tables stay.
- Sealed records stay immutable.
- Guided / demo / trial **remain** eval sessions.
- `AgentExecution:Mode` host default **Simulator** stays; Record vs Practice is chrome + stamp (no G-REAL-06).
- Stored door tokens stay `"career"` / `"rehearsal"` (RP-022).
- Engineering family names (`career-gravity`, `CareerGravityCg*`) stay (RP-023).
- No live presence / finding-comment chat / per-architecture ACL beyond RestrictToShares (0087).
- No 40th coverage engine.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.

## Global constraints

See the index. Working-tree safety; TB-645; TB-2005; focused tests; scoped compile; OpenAPI when wire changes (this wave should not need wire changes).

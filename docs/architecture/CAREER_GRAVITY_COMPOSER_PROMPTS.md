> **Scope:** Copy-paste Composer prompts — Career-gravity Composer prompts (CG-001–CG-100). Internal engineering only — not buyer-facing copy.
> **Spine:** [`START_HERE.md`](../START_HERE.md) · **Founding contract:** [`ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md`](../ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md) R4 / R13 · **UI standard:** [`../library/UI_DESIGN_SYSTEM.md`](../library/UI_DESIGN_SYSTEM.md)
> **Paste-ready files:** [`.cursor/prompts/career-gravity-00-index.md`](../../.cursor/prompts/career-gravity-00-index.md) (**CG-001–CG-100**)
> **Predecessor:** [`LOST_WRITE_COMPOSER_PROMPTS.md`](LOST_WRITE_COMPOSER_PROMPTS.md) (**LW-001–LW-100**, issue 4). **Do not re-run LW.** Architecture-spine AS-076–085 shipped Career/Rehearsal **doors**; this wave owns leftover **gravity** (unlabeled Simulator as Career).
> **Successor:** [`SYSTEM_NOT_JOB_COMPOSER_PROMPTS.md`](SYSTEM_NOT_JOB_COMPOSER_PROMPTS.md) (**SN-001–040**).

# Career-gravity Composer prompts (CG-001–CG-100)

**Created:** 2026-09-11 · **Status:** shipped · **Close audit:** [`CAREER_GRAVITY_ACCEPTANCE_2026-09-11.md`](CAREER_GRAVITY_ACCEPTANCE_2026-09-11.md) · **Do not re-run** prior waves except as a numbered leftover.

ArchLucid is a working-architect tool: people will sit in it much of the day, and their livelihoods may depend on the sealed record.

Paste **one** `.cursor/prompts/career-gravity-NNN-*.md` file per Composer session. Do not implement from this document’s tables.

## The problem these prompts solve

AS-076–085 shipped chooser chrome. Working can still **look like Career** while structural `AgentExecution:Mode` is Simulator: Ready labels, badges, sponsor PDF, CLI, palettes, nested Ask/Compare, outbound ITSM/email. Livelihood packets borrow authority the run did not earn. Host Mode default stays Simulator (no G-REAL-06). ADR **0091** makes Career the Working **default day**; Rehearsal is explicit; run **stamp** is what exports read.

### Done test

After this wave:

1. Working Career + Simulator cannot finalize or export as Career-complete.
2. Rehearsal watermarks/flags on remaining packet surfaces.
3. Run stamp (Mode + door) is what artifacts read, not the live chooser.
4. Guided/demo/trial still teach Simulator.
5. Host Mode default unchanged.

## Diagnosis → prompt

| Class | Prompts |
|-------|---------|
| Contract + inventories | **CG-001–010** |
| Door persist / stamp | **CG-011–020** |
| Career gates | **CG-021–040** |
| Watermarks | **CG-041–055** |
| Nested tools inherit | **CG-056–070** |
| Ratchets / remaining surfaces / close | **CG-071–100** |

## Sequencing

See [`.cursor/prompts/career-gravity-00-index.md`](../../.cursor/prompts/career-gravity-00-index.md).

Load-bearing ADRs: **0091** (this wave); **0086** doors not rewritten.

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

## Prompt inventory (CG-099)

Vitest ratchet: `archlucid-ui/src/lib/career-gravity-prompt-inventory.test.ts` — expects `career-gravity-00-index.md` and **100** numbered `career-gravity-NNN-*.md` files with no numbering gaps or duplicate test files. Confirm with `npm run test -- --run src/lib/career-gravity-prompt-inventory.test.ts`.

## Out-of-wave residuals

Explicit skips recorded for **CG-100** close audit — **do not pretend shipped**. See [`CAREER_GRAVITY_OUT_OF_WAVE_RESIDUALS.md`](CAREER_GRAVITY_OUT_OF_WAVE_RESIDUALS.md) (ratchet: `career-gravity-out-of-wave-residuals.ts`). **CG-098:** in-app changelog / What's new remains product backlog (LW-100 residual).

## Global constraints

See the index. Working-tree safety; TB-645; TB-2005; focused tests; scoped compile; OpenAPI when wire changes.

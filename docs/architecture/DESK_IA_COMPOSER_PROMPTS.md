> **Scope:** Copy-paste Composer prompts — Desk-IA Composer prompts (DI-001–DI-024). Internal engineering only — not buyer-facing copy.
> **Spine:** [`START_HERE.md`](../START_HERE.md) · **Founding contract:** [`ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md`](../ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md) R4 / R13 · **UI standard:** [`../library/UI_DESIGN_SYSTEM.md`](../library/UI_DESIGN_SYSTEM.md)
> **Paste-ready files:** [`.cursor/prompts/desk-ia-00-index.md`](../../.cursor/prompts/desk-ia-00-index.md) (**DI-001–DI-024**)
> **Predecessor:** [`MODE_GRAVITY_COMPOSER_PROMPTS.md`](MODE_GRAVITY_COMPOSER_PROMPTS.md).
> **Successor:** [`CHEAP_EXPLORATION_COMPOSER_PROMPTS.md`](CHEAP_EXPLORATION_COMPOSER_PROMPTS.md).

# Desk-IA Composer prompts (DI-001–DI-024)

**Created:** 2026-09-11 · **Status:** ready to run · **Do not re-run** prior waves except as a numbered leftover.

ArchLucid is a working-architect tool: people will sit in it much of the day, and their livelihoods may depend on the sealed record.

Paste **one** `.cursor/prompts/desk-ia-NNN-*.md` file per Composer session. Do not implement from this document’s tables.

## The problem these prompts solve

The IA is still a platform console with a desk bolted on: sealed record 404 parent, stranded drafts, palette vs sidebar, four evidence names, dual start leftovers. ADR **0095** gives sealed records a Governance inventory without making them Monday morning and without collapsing review tabs.

### Done test

After this wave:

1. Sealed list is not 404.
2. Working Governance nav includes the ledger.
3. Desktop tabs not behind More.
4. Working Home not two peer products.
5. Ask/pattern empty-states honest.

## Diagnosis → prompt

| Class | Prompts |
|-------|---------|
| ADR + list + leftovers | **DI-001–018** |
| Skips / close | **DI-019–024** |

## Sequencing

See [`.cursor/prompts/desk-ia-00-index.md`](../../.cursor/prompts/desk-ia-00-index.md).

Load-bearing ADRs: **0095**; no-collapse rule unchanged.

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

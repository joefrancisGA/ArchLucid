> **Scope:** Copy-paste Composer prompts that make **Architecture the Working locator** and demote Review to a nested job. Internal engineering only — not buyer-facing copy.
> **Spine:** [`START_HERE.md`](../START_HERE.md) · **Founding contract:** [`ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md`](../ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md) R4 / R13 · **UI standard:** [`../library/UI_DESIGN_SYSTEM.md`](../library/UI_DESIGN_SYSTEM.md)
> **Paste-ready files:** [`.cursor/prompts/architecture-object-00-index.md`](../../.cursor/prompts/architecture-object-00-index.md) (**AO-01–50**)
> **Wave 16:** [`DEFENSIBLE_RECORD_COMPOSER_PROMPTS.md`](DEFENSIBLE_RECORD_COMPOSER_PROMPTS.md) (**DR-01–16**) — fail-closed leftovers; do not paste DR unless a row names pin/room nest
> **Wave 14:** [`CUSTOMER_ARCHITECTURE_COMPOSER_PROMPTS.md`](CUSTOMER_ARCHITECTURE_COMPOSER_PROMPTS.md) (**CA-01–50**) — named identity; this set supersedes CA’s “keep ADR 0072 review-as-canonical-URL” for Working

# Architecture-object Composer prompts (AO-01–AO-50)

**Created:** 2026-09-07 · **Status:** ready to run · **Do not re-run** CA, DA, PC, DR, LK, or overlay waves except as an AO row names a leftover. **Do not paste this wave to “fix” insight density, dual skin, or what-if cost** — those are later issues.

ArchLucid is a working-architect tool: people will sit in it much of the day, and their livelihoods may depend on the sealed record. **Issue #1** is that the work object is still a **pipeline**. Persistence has `dbo.Architectures`. The paying desk still **lives in** `/architecture/reviews/{id}` after spawn (`resolveWorkingStartHref` returns `reviewDetailPath` first).

Wave 14 (**CA-01–50**) created the parent noun. Wave 12 (**ADR 0072**) correctly forbade a second live draft editor after spawn — and incorrectly made the **review** the remaining instrument. **This set is fifty sessions** to change that locator without merging `DraftRequests` and `Runs`.

Paste **one** `.cursor/prompts/architecture-object-NN-*.md` file per Composer session. Do not implement from this document’s tables.

## The problem these prompts solve

Casual tools optimize first-run success, a reviews hub as Home, wait-on-this-tab, and a package URL that becomes the product.

Livelihood tools optimize a **named architecture you reopen all week**, **reviews as jobs of that system**, **Start/Alt+N that never exile you to a run id**, and Guided teaching that **may keep** a linear review URL.

## Diagnosis → prompt (summary)

| Class | Prompts | Residual after CA + 0072 |
|-------|---------|----------------------------|
| Contract | **AO-01–03** | ADR 0077; nested taxonomy; review is a verb |
| Nested URLs | **AO-04–12** | App Router nest, redirects, share/CLI, Guided split |
| Monday desk | **AO-13–25** | Home, nav, Start, recents, palette, desk shell, spawn parented |
| Bind tools | **AO-26–32** | Inbox hub, governance return, findings/compare/Ask/graph/search scope |
| Stay on the desk | **AO-33–38** | Nested workspace, sticky identity, finalize/clone/pin/room |
| Ratchet | **AO-39–50** | 142-route roles, nav/palette gates, help/keyboard/back, CI, acceptance |

## Sequencing

See [`.cursor/prompts/architecture-object-00-index.md`](../../.cursor/prompts/architecture-object-00-index.md). **ADR → nested routes → Start/Home → desk → bind → chrome → CI.**

Load-bearing pair: **AO-01** (contract) and **AO-15** (resolver). Without 15, Home chrome is theater.

## Intentional — do not “fix”

- Desktop review **workspace tabs** stay a full strip (no **More** menu).
- 300-second silent Undo toast stays 300s.
- ADR 0068 two kernels and two SQL tables stay. **Do not merge** `DraftRequests` and `Runs`.
- Sealed records stay immutable.
- Guided / demo / trial remain eval sessions and may keep peer review URLs.
- Spawn-locked drafts stay read-only (0072 intent); only the **destination** of handoff changes.
- BFF session stays LK-05–07.
- Density gate / trail gate / disposition 409 stay.
- No live presence / finding-comment chat / per-architecture ACL.
- No 40th coverage engine.
- No system-wide breadcrumbs (**TB-2090**). Identity header is not a crumb trail.

## Do not re-run

- **CA-01–50 / DA-01–12** — identity exists; this set changes the **locator**
- **DR-01–16** — fail-closed; AO-37/38 nest only
- **PC-01–13 / LK / IS / LS / SD / CR / FD / AD / CD / WA / RS / LD / LI / PT / WD / DD**

> **Scope:** Copy-paste Composer prompts that make the **named architecture the Monday-morning object** — the desk you work *on*, not a launch pad to a review job. Internal engineering only — not buyer-facing copy.
> **Spine:** [`START_HERE.md`](../START_HERE.md) · **Founding contract:** [`ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md`](../ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md) R4 / R13 · **UI standard:** [`../library/UI_DESIGN_SYSTEM.md`](../library/UI_DESIGN_SYSTEM.md)
> **Paste-ready files:** [`.cursor/prompts/system-desk-00-index.md`](../../.cursor/prompts/system-desk-00-index.md) (**SY-01–SY-100**)
> **Predecessor (wave 17 — locator):** [`ARCHITECTURE_OBJECT_COMPOSER_PROMPTS.md`](ARCHITECTURE_OBJECT_COMPOSER_PROMPTS.md) (**AO-01–50**) — nested review URLs and Start-on-architecture. **Do not re-run AO.** This set owns leftovers AO-50 did not ratchet: Alt+R → inbox, peer Insights tools, remaining `reviewDetailPath` mints.

# System-desk Composer prompts (SY-01–SY-100)

**Created:** 2026-09-07 · **Status:** ready to run · **Do not re-run** AO, CA, DA, PC, DR, FC, LK, or overlay waves except as an SY row names a leftover. **Do not paste this wave to “fix” insight density, dual skin, career-export honesty, or what-if cost.**

ArchLucid is a working-architect tool: people will sit in it much of the day, and their livelihoods may depend on the sealed record. **The Monday-morning object is still a job, not a system.** Wave 17 made architecture the **locator** (`resolveWorkingStartHref` → identity path; nested `/architectures/{id}/reviews/{id}`). The paying desk still **does the day’s work** in peer products: Alt+R opens `/architecture/reviews`, Ask/Compare/Graph live under `/insights/*`, and many call sites still mint `reviewDetailPath`.

**AO bound tools with query params. Binding a peer app is not the same as the system being the object.** This set nests Ask, Compare, Graph, Search, and Findings **on** the architecture, remaps the keyboard atlas, and ratchets so Monday muscle memory cannot open a job list as Home.

Paste **one** `.cursor/prompts/system-desk-NN-*.md` file per Composer session. Do not implement from this document’s tables.

## The problem these prompts solve

Casual tools optimize a reviews hub as Home, Insights as sibling products, and a package URL you bookmark.

Livelihood tools optimize a **named architecture you reopen all week**, **reviews as jobs of that system**, **Ask/Compare/Graph as verbs on that desk**, and an **inbox** you open on purpose — never via Start, Home, or Alt+R.

### Done test (stronger than AO-50)

Working seat, after this wave:

1. Start / Alt+N / last-open / restore → architecture desk or portfolio — never `/architecture/reviews` or `/architecture/reviews/{id}`.
2. Alt+R → open architecture desk (or portfolio if none) — **never** the reviews hub.
3. Alt+C / Alt+A / Alt+Y / Alt+G → nested tools under `/architecture/architectures/{id}/…` (or desk until that nest exists).
4. Working production modules do not import `reviewDetailPath` when `ArchitectureId` is known (`resolveArchitectureReviewHref`).
5. Browser tab, share, CLI, email, recents, and notifications name the **architecture**.
6. Guided / demo / trial may keep peer review and Insights URLs.

## Diagnosis → prompt

| Class | Prompts | Residual after AO |
|-------|---------|-------------------|
| Contract | **SY-01–06** | Accept 0077; ADR 0079 desk-as-work-surface; done-test; inventory; Guided split |
| Keyboard atlas | **SY-07–15** | Alt+R is still Packages; Alt+C/A/Y/G are Insights peers |
| Mint sweep | **SY-16–35** | `reviewDetailPath` leftovers (guide, share, room, pin, invite, copy parents) |
| Nested tools | **SY-36–50** | Ask/Compare/Graph/Search/Findings still `/insights/*` products |
| Inbox demotion | **SY-51–58** | Hub still competes as Home in copy/nav/heroes |
| Desk as shell | **SY-59–70** | Identity page is a launch pad; wait/finalize/sponsor still run-centric |
| Teaching | **SY-71–76** | Help, onboarding, screenshots, glossary still teach the job |
| Ratchet | **SY-77–80** | AO-50 does not fail Alt+R → hub |
| Satellites | **SY-81–100** | Notifications, search ranking, recents, CLI, E2E, wave close |

## Sequencing

See [`.cursor/prompts/system-desk-00-index.md`](../../.cursor/prompts/system-desk-00-index.md). **ADR → inventory → keyboard → mint sweep → nested routes → redirects → desk chrome → ratchet.**

Load-bearing: **SY-02** (0079) and **SY-07** (Alt+R). Nested Ask (**SY-36**) is the first tool URL that proves 0079. Without **SY-80**, overlays will restore the inbox as Home.

## Intentional — do not “fix”

- Desktop review **workspace tabs** stay a full strip (no **More** menu). A desk command bar is not that menu.
- 300-second silent Undo toast stays 300s.
- ADR 0068 two kernels and two SQL tables stay. **Do not merge** `DraftRequests` and `Runs`.
- Sealed records stay immutable.
- Guided / demo / trial remain eval sessions and may keep peer URLs.
- BFF session stays LK-05–07.
- Density gate / trail gate / disposition 409 / career-artifact honesty (FC) stay in their waves.
- No live presence / finding-comment chat / per-architecture ACL.
- No 40th coverage engine.
- No system-wide breadcrumbs (**TB-2090**).

## Do not re-run

- **AO-01–50** — locator shipped; this set owns work-surface leftovers
- **CA / DA / PC / DR / FC / LK** except named leftovers
- Overlay waves (LI…FD, PT, WD, DD)

> **Scope:** Paste-ready prompts for the SecureNow Home review of 2026-10-12. Internal engineering only. Prompts only — do not implement from this index. Run every prompt on Composer 2.5 slow (`composer-2.5`), not a fast-tier slug.
> **Paste-ready files:** [`.cursor/prompts/securenow-home-00-index.md`](../../.cursor/prompts/securenow-home-00-index.md)

# SecureNow Home work summary — Luna prompts

**Created:** 2026-10-12 · **Status:** ready to paste · **Audience:** Composer 2.5 slow (`composer-2.5`)

SecureNow Home is a directory. The title area does not say which environment is in scope or how fresh the collection is. The lead still talks about inventory workbenches, then claims all seven destinations are on the hub. The hub shows five groups and many links. Row labels disagree with the sidebar, and "Ask about your environment" is cut off. Several summaries describe the machinery ("advisory-only execute honesty", "explainable correspondence rows", "effective ARC-AMPE rules").

Paste **one** prompt per session. Do not implement from this index.

## Comments from the review

| # | Comment | Decision | Prompt |
|---|---------|----------|--------|
| 1 | Put assigned findings, highest-priority issues, recent changes, and remediation awaiting verification at the top, with counts | Agree | **SN-HOME-03** |
| 2 | Show workspace, subscription scope, latest collection time, and collection gaps near the title | Agree | **SN-HOME-02** |
| 3 | Replace the introductory paragraphs with one useful description | Agree, and keep a short honesty sentence | **SN-HOME-01** |
| 4 | Three prominent actions above the directory: Review my findings, Explore resources, Track remediation | Disagree | — |
| 5 | Rewrite descriptions around what the person can do | Agree | **SN-HOME-04** |
| 6 | Make navigation labels consistent and fully visible | Agree | **SN-HOME-05** |
| 7 | The "All seven destinations" sentence is false on this page | Agree | **SN-HOME-01** |
| 8 | Stronger primary actions, 14–16px body, shorter descriptions, stop repeating Destination / Summary | Agree on the directory chrome. Disagree on a new type size | **SN-HOME-06** (headers and body token). Shorter descriptions are **SN-HOME-04**. Primary actions are **SN-HOME-03** |

## Why two comments are not prompts

**Three extra actions.** The same review says the useful page is a compact work summary followed by this directory. Review my findings, Explore resources, and Track remediation are already the counted links in **SN-HOME-03** and the first rows of Findings, Environment, and Remediation. A second row of those three links is another directory.

**14–16px body.** Operator body type is 13px (`OPERATOR_TYPE_SCALE.body`, TB-119). A Home-only 14–16px size would fork that scale. **SN-HOME-06** uses the body token for directory summaries and removes the repeated column headers. It does not edit the scale.

## Prompts

| ID | Prompt | Depends on | Intent |
|----|--------|------------|--------|
| **SN-HOME-01** | [securenow-home-01-short-lead.md](../../.cursor/prompts/securenow-home-01-short-lead.md) | — | Short description. Honesty sentence stays, in plain words. Seven-destinations sentence leaves SecureNow Home only |
| **SN-HOME-02** | [securenow-home-02-environment-context.md](../../.cursor/prompts/securenow-home-02-environment-context.md) | — | Workspace, subscription, latest collection, collection gap. Existing snapshot list only |
| **SN-HOME-03** | [securenow-home-03-work-summary.md](../../.cursor/prompts/securenow-home-03-work-summary.md) | SN-HOME-02 for placement | Four counted work links, then the directory |
| **SN-HOME-04** | [securenow-home-04-outcome-copy.md](../../.cursor/prompts/securenow-home-04-outcome-copy.md) | — | Sidebar labels on Home rows. Outcome summaries. Advisory honesty in plain words |
| **SN-HOME-05** | [securenow-home-05-visible-labels.md](../../.cursor/prompts/securenow-home-05-visible-labels.md) | — | Sidebar labels wrap. SecureNow titles match. Architecture titles stay |
| **SN-HOME-06** | [securenow-home-06-compact-directory.md](../../.cursor/prompts/securenow-home-06-compact-directory.md) | — | Repeated Destination / Summary headers leave the visual page. Summaries use the body token |
| **SN-HOME-HOLD** | [securenow-home-hold.md](../../.cursor/prompts/securenow-home-hold.md) | — | Forbidden scope |

**SN-HOME-02** before **SN-HOME-03**. Every other prompt can run alone.

## Settled reading

- SecureNow Home keeps the five groups in sidebar order. These prompts add a context line and a work list above that directory.
- Counts come from calls the product already makes: assigned-to-me count, remediation factory summary, snapshot list, and the newest snapshot's diff list. No new API.
- `criticalExposureCount` is already on the factory summary response. The UI mapper drops it today. **SN-HOME-03** passes it through. It does not invent a Critical-plus-High total.
- Awaiting verification is `ChangeImplemented`. `VerificationFailed` is a clause on the same row. `Executed` is not included.
- The seven-destinations sentence stays on the Architecture infrastructure overview, which lists seven workbench rows.
- Generic SecureNow Home does not say ARC-AMPE. A `uhg` edition may name it on Frameworks when that edition module is already present.
- SN-MENU-04's three posture tiles are replaced by **SN-HOME-02** and **SN-HOME-03**. Do not build both.
- Tenant name stays off this page. Snapshot summaries identify a subscription, not a tenant.

## Do not pull into these sessions

- The three extra action buttons
- A body size other than `OPERATOR_TYPOGRAPHY.body`
- A new endpoint, table, or collector
- Architecture shell labels or Architecture Home
- Hiding a sidebar group or a review workspace tab
- Azure writes, terraform apply, or a second collector

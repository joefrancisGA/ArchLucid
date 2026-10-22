> **Scope:** Paste-ready prompts for the SecureNow Home review of 2026-10-12. Internal engineering only. Prompt archive — **SN-HOME-01–06** are **shipped** on trunk; do not greenfield from this index. Run every prompt on Composer 2.5 slow (`composer-2.5`), not a fast-tier slug.
> **Paste-ready files:** [`.cursor/prompts/securenow-home-00-index.md`](../../.cursor/prompts/securenow-home-00-index.md)

# SecureNow Home work summary — Luna prompts

**Created:** 2026-10-12 · **Updated:** 2026-10-15 · **Status:** **SN-HOME-01–06 shipped** on trunk (prompt files remain for regression reference). **Audience:** Composer 2.5 slow (`composer-2.5`)

SecureNow Home (`InfrastructureOverviewClient` with `secureNowHome`) now opens with a short lead, an environment context line, a **Your work** count strip, then the five grouped directory sections. Use scoped bugfix rows only; do not re-run this set as greenfield.

## Trunk implementation (where to look)

| ID | Primary UI / lib |
|----|------------------|
| **SN-HOME-01** | `governance-infrastructure-copy.ts` (`SECURENOW_HOME_PAGE_LEAD`, `SECURENOW_HOME_CLAIM_DISCIPLINE`); `InfrastructureOverviewClient.tsx` |
| **SN-HOME-02** | `SecureNowHomeEnvironmentContext.tsx` |
| **SN-HOME-03** | `SecureNowHomeWorkSummary.tsx` |
| **SN-HOME-04** | `securenow-*-home-copy.ts`; `securenow-home-outcome-copy.test.ts` |
| **SN-HOME-05** | `SidebarNavLink.tsx`; `route-titles.ts` |
| **SN-HOME-06** | `SecureNowHomeDestinationSection.tsx` |

Vitest: `InfrastructureOverviewClient.securenow.test.tsx`, `InfrastructureOverviewClient.home-context.test.tsx`, `SecureNowHomeEnvironmentContext.test.tsx`, `SecureNowHomeWorkSummary.test.tsx`, `SecureNowHomeDestinationSection.test.tsx`, `route-titles.test.ts`, `SidebarNavLink.test.tsx`.

## Shipped deltas vs original prompt text

- **SN-HOME-03:** Trunk appends `· {n} checks failed` on the **Awaiting verification** row **and** adds a separate **Checks failed** link row to `/security/remediation-instances?status=VerificationFailed` (handoff-style deep link). The prompt described only the suffix.
- **SN-HOME-01:** **UHG** edition omits the generic claim-discipline sentence on SecureNow Home (`InfrastructureOverviewClient.securenow.test.tsx`).

## Comments from the review (historical)

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

## Prompt archive

| ID | Prompt | Depends on | Intent |
|----|--------|------------|--------|
| **SN-HOME-01** | [securenow-home-01-short-lead.md](../../.cursor/prompts/securenow-home-01-short-lead.md) | — | Short description. Honesty sentence stays, in plain words. Seven-destinations sentence leaves SecureNow Home only |
| **SN-HOME-02** | [securenow-home-02-environment-context.md](../../.cursor/prompts/securenow-home-02-environment-context.md) | — | Workspace, subscription, latest collection, collection gap. Existing snapshot list only |
| **SN-HOME-03** | [securenow-home-03-work-summary.md](../../.cursor/prompts/securenow-home-03-work-summary.md) | SN-HOME-02 for placement | Four counted work links, then the directory |
| **SN-HOME-04** | [securenow-home-04-outcome-copy.md](../../.cursor/prompts/securenow-home-04-outcome-copy.md) | — | Sidebar labels on Home rows. Outcome summaries. Advisory honesty in plain words |
| **SN-HOME-05** | [securenow-home-05-visible-labels.md](../../.cursor/prompts/securenow-home-05-visible-labels.md) | — | Sidebar labels wrap. SecureNow titles match. Architecture titles stay |
| **SN-HOME-06** | [securenow-home-06-compact-directory.md](../../.cursor/prompts/securenow-home-06-compact-directory.md) | — | Repeated Destination / Summary headers leave the visual page. Summaries use the body token |
| **SN-HOME-HOLD** | [securenow-home-hold.md](../../.cursor/prompts/securenow-home-hold.md) | — | Forbidden scope |

## Settled reading (unchanged intent)

- SecureNow Home keeps the five groups in sidebar order. These prompts add a context line and a work list above that directory.
- Counts come from calls the product already makes: assigned-to-me count, remediation factory summary, snapshot list, and the newest snapshot's diff list. No new API.
- The seven-destinations sentence stays on the Architecture infrastructure overview, which lists seven workbench rows.
- SN-MENU-04's three posture tiles are replaced by **SN-HOME-02** and **SN-HOME-03**. Do not build both.
- Tenant name stays off this page. Snapshot summaries identify a subscription, not a tenant.

## Do not pull into these sessions

- The three extra action buttons
- A body size other than `OPERATOR_TYPOGRAPHY.body`
- A new endpoint, table, or collector
- Architecture shell labels or Architecture Home
- Hiding a sidebar group or a review workspace tab
- Azure writes, terraform apply, or a second collector

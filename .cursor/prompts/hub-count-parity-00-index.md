<!-- Hub-count-parity Composer prompts — paste one prompt per session.
     Origin: 2026-09-05 owner follow-up after HOM al-ui-rate (#1539 / #1550 / #1563).
     Diagnosis: Home counting/resume contract should apply to sibling hubs, not as a
     copy of Home layout. Do not implement from this index. -->

# Hub count parity — Composer prompt set (HCP-01–HCP-05)

**Status:** **Shipped** in PR [#1689](https://github.com/joefrancisGA/ArchLucid/pull/1689) (implementation) and [#1694](https://github.com/joefrancisGA/ArchLucid/pull/1694) (RunsPageView attention tests + doc closure). **Do not re-run this set.**

Home (`/`, workbook **HOM**) already has a counting and resume contract from the 2026-09-04 `/al-ui-rate HOM` passes:

- One tenant-scoped counting snapshot (`deriveOperatorHomeTenantCountingSnapshot`)
- Self-describing metrics (`SelfDescribingMetricCount`: count + noun + scope + href)
- One filled resume CTA (`resolveOperatorHomeResumeAffordancePlan`)
- Attention chips suppress kinds already shown as a primary zone
- Showcase/demo rows do not inflate live totals

HCP-01–05 applied that contract to Reviews hub, sponsor KPIs, and remaining governance metric strips — not the Home layout.

**Do not implement from this index.** Archive reference only.

**Do not treat this set as a V1 assessment scorecard.** Do not add GTM cohort work (**M-90**, **M-44**, **M-91**, **M-92**) or closed assurance programs (**TB-135** / **TB-136**). **TB-645** vocabulary stays. Do not create new `TB-###` rows unless the owner asks.

## What this set does *not* change

Keep: Home composition (Your work / Recent / Working desk); help-topic buyer-polish (`/al-ui-rate` skip link + claim discipline + Where to go next); Wave 38 filter URL sync; leaf “Continue last viewed” rows on lists that have only **one** resume affordance (alerts, webhooks, policy packs, findings queue pin, etc.); findings-queue header metrics (already `SelfDescribingMetricCount`).

Do **not** copy Home section order onto Reviews hub or Sponsor dashboard. Do **not** hide desktop review workspace tabs. Do **not** auto-switch Guided. Do **not** re-run LS-08 / IS-02 / AD-07 / CD-11 — implement only the leftover named in *What to build*.

## Relationship to prior work

| Set / PR | Role | Status |
|----------|------|--------|
| HOM `#1539` `#1550` `#1563` | Home counting, resume collapse, KPI cards, chips | **Shipped** — reuse helpers, do not fork |
| **LS-08** | One resume primary on Working Home | **Shipped** — Reviews hub parity in **HCP-01** |
| **CD-11** | Home last-open package | Do not fork |
| **AD-07** | Reviews hub sticky identity columns | Do not fork — this set does not change table columns |
| Findings queue header | Already `SelfDescribingMetricCount` | **Do not re-open** |
| **HCP-01–05** | Hub parity leftovers | **Shipped** `#1689` / `#1694` — do not re-run |

## Diagnosis classes

| Class | Failure | Prompts |
|-------|---------|---------|
| **Two resume primaries** | Reviews hub Continue strip and Continue last viewed can both be filled for the same package | HCP-01 |
| **Duplicate chrome** | Attention chips restated unfinished work already on the continue strip / inventory | HCP-02 |
| **Disagreeing counts** | Hub summary mixes showcase spine counts; metrics lack scope labels | HCP-03 |
| **Unscoped sponsor KPIs** | Sponsor cards show raw numbers instead of count · noun · scope · href | HCP-04 |
| **Bare remaining strips** | Policy packs / audit tiles / standards summary are numbers without scoped drill-through | HCP-05 |

## Run order

**01** first (resume). Then **02** (chips; depends on knowing which continue zone is visible). Then **03** (counting contract + summary row). Then **04** (sponsor). Then **05** (remaining strips; independent of 04).

**01** must not delete drafts or the inventory table. **03** must reuse `metric-count-presentation.ts` — do not invent a second scope vocabulary. **04** must keep sponsor drill-through hrefs honest (open vs stale vs needs-decision). **05** only converts counts that are queues or filters, not decorative totals.

| # | Prompt file | Flaw it mitigates | Owner (do not fork) |
|---|----------------|-------------------|---------------------|
| 01 | `hub-count-parity-01-reviews-hub-one-resume.md` | Continue review strip + Continue last viewed both primary | LS-08 / CD-11 leftover on **RE** |
| 02 | `hub-count-parity-02-reviews-hub-attention-suppress.md` | Compact attention strip has no `suppressKinds` | HOM `#1493` leftover on hub |
| 03 | `hub-count-parity-03-reviews-hub-counting-contract.md` | Unscoped summary row; showcase in live totals | HOM counting contract leftover |
| 04 | `hub-count-parity-04-sponsor-self-describing-kpis.md` | Sponsor KPI cards are custom counts, not `SelfDescribingMetricCount` | HOM `#1563` leftover on **ARE** |
| 05 | `hub-count-parity-05-remaining-metric-strips.md` | Policy packs / audit / standards bare numbers | HOM metric leftover (light) |

## Already shipped — do not re-open

| Item | Evidence |
|------|----------|
| Home resume collapse | `resolveOperatorHomeResumeAffordancePlan` |
| Home tenant counting | `deriveOperatorHomeTenantCountingSnapshot` |
| Self-describing metric primitive | `SelfDescribingMetricCount` + `metric-count-presentation.ts` |
| Home attention suppress | `OperatorAttentionKindStrip` `suppressKinds` on Home |
| Reviews hub resume collapse | `resolveReviewsHubResumeAffordancePlan` |
| Reviews hub attention suppress | `resolveReviewsHubAttentionSuppressKinds` on **RE** |
| Reviews hub tenant counting | `filterTenantOverviewRuns` in `deriveReviewsWorkspaceSummary` |
| Sponsor queue KPI contract | `sponsor-queue-metric-presentations.ts` + `SelfDescribingMetricCount` `executive` variant |
| Audit buyer header drill-through | `audit-buyer-header-metric-hrefs.ts` |
| Findings queue header metrics | `GovernanceFindingsQueueHeader.tsx` |
| Reviews hub sticky title/status | AD-07 / `ReviewsHubInventoryTable.tsx` |
| Filter chip URL sync | Wave 38 |

## Global constraints (every prompt)

- Working-tree safety: `.\scripts\agent\check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** / overflow (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- Claim discipline: `docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md`. **TB-645** vocabulary (package, finding, sealed review record).
- Reuse `metric-count-presentation.ts` / `SelfDescribingMetricCount`. Do not add a parallel “KPI label” helper.
- Verification: focused Vitest from `archlucid-ui/` named in the prompt. No full-solution builds, no dev servers unless the prompt says so.
- UI: Carbon density, sentence case, no ghost/link `Button`, form validation **TB-2005**.
- C#: one class per file; no `ConfigureAwait(false)` in tests; blank line before `if` / `foreach` unless first in method; check nulls; prefer LINQ and concrete types.

## After each prompt

Summarize: files changed, tests run, residual risk, whether Home helpers stayed canonical, Guided vs Working behavior, and whether help-topic buyer-polish / leaf continue-last rows were left alone. Do not mark HOM, LS-08, AD-07, or CD-11 as undone.

<!-- Working-architect Composer prompts — paste one prompt per session.
     Origin: 2026-09-04 owner follow-on: chrome-spine leftovers after LD+RS,
     staged so the product spine (create → evidence → review → seal) stays intact.
     Wave 4 after LI-01–15 (#1397), LD-01–15 (#1421/#1439), RS-01–15 (#1457).
     Do not implement from this index. -->

# Working-architect mitigations — Composer prompt set (WA-01–WA-24)

ArchLucid sells a **seat for a repeat professional** (`docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R4 / R13; ADR 0052). People will sit in it much of the day; livelihoods may depend on the sealed record.

**LI, LD, RS, and this set shipped** on `master` (#1496). Do not re-run. Wave 5 unique leftovers: [`career-desk-00-index.md`](career-desk-00-index.md) (**CD-01–15**). Wave 6: [`all-day-desk-00-index.md`](all-day-desk-00-index.md) (**AD-01–12**).

This is **iterative**. These 24 will not perfect the working-architect paradigm. They close the next predicted residuals without rewriting the product spine.

**Do not implement from this index.** Paste one numbered file per Composer session.

**Do not treat this set as a V1 assessment scorecard.** Do not add GTM cohort work (**M-90**, **M-44**, **M-91**, **M-92**) or closed assurance programs (**TB-135** / **TB-136**). **TB-645** vocabulary stays.

## What this set does *not* change (product spine)

Keep: architecture review (`Run`) → sealed record; create → intake → execute → Finalize; tenant isolation; sealed-manifest immutability; Guided / demo / trial eval chrome; `typed-engine-protected`. Do **not** merge draft+review in the database, collapse desktop review tabs, auto-switch stored Guided users, or require `NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator` for density.

The leftover is the **chrome-decision spine** (eval vs desk) plus a few **edges** (new version after spawn, seal-reason copy, optional what-if). Stage D items can refuse a stamp or a post-spawn draft edit — call that out in the PR, do not surprise CLI users.

## Relationship to prior sets

| Set | Role | Status |
|-----|------|--------|
| **DD / PT / WD** | Earlier waves | Do not re-run / do not fork |
| **LI-01–15** | 2026-09-03 residuals | **Shipped** #1397 |
| **LD-01–15** | 2026-09-04 desk residuals | **Shipped** #1421 / #1439 — do not re-run |
| **RS-01–15** | Wave 3 unique leftovers | **Shipped** #1457 — do not re-run |
| **WA-01–24** | **This set** — wave 4 predicted leftovers | **Shipped** #1496 — do not re-run |
| **CD-01–15** | Wave 5 unique leftovers | [`career-desk-00-index.md`](career-desk-00-index.md) |
| **AD-01–12** | Wave 6 all-day desk leftovers | [`all-day-desk-00-index.md`](all-day-desk-00-index.md) |

If a WA row lists an LD/RS/LI/PT/WD owner, **do not fork** that file. Implement only the leftover in *What to build*.

## Staging (safe order)

| Stage | Prompts | Disruption |
|-------|---------|------------|
| **A** Chrome decision | WA-01 | Low — CI + call-site class; Guided/demo unchanged |
| **B** Working chrome leftovers | WA-02–WA-06 | Low — nav/help/copy; wizard stays on Guided |
| **C** Honesty beyond shipped desks | WA-07–WA-09 | Low — Ask/sponsor/Compare copy; engines unchanged |
| **D** Stamp / version edges | WA-10–WA-13 | **Medium** — new-version CTA; seal-reason on CLI; receipt placement |
| **E** Continuity | WA-14–WA-17 | Low — prefs/restore/autosave/keepalive |
| **F** Throughput + meeting | WA-18–WA-24 | Low — additive keys, search default, what-if entry, presenter quiet, a11y |

Prefer **01** first (so later chrome work has one switch). **10** after confirming RS-04 lock still holds. **12** before treating CLI seal as done. **20** after RS-08 compare-from-review hrefs. Independent after **01** except **08** after **07** if both run, and **21** after confirming LD-13/LI-14 presenter still exists.

**02 / 10** must not reintroduce a desktop **More** menu. **07 / 08 / 09** must not change `typed-engine-protected`.

| # | Prompt file | Flaw it mitigates | Owner (do not fork) |
|---|----------------|-------------------|---------------------|
| 01 | `working-architect-01-chrome-resolver-ci-inventory.md` | Eval chrome still keys off buyer-polish; no CI when new sites skip the resolver | LD-01 leftover platform |
| 02 | `working-architect-02-working-nav-one-lifecycle.md` | Working nav/palette still present Create architecture and Start review as peer products | LD-06 home; WD-10 |
| 03 | `working-architect-03-engineer-chrome-not-working.md` | COGS / LLM budget / RAG health can still ride Working density | LD-01 engineer-widget class; LD-10 |
| 04 | `working-architect-04-help-is-desk-not-first-session.md` | Working help still teaches first-review theater as the job | LD-15 teaching inventory |
| 05 | `working-architect-05-ask-compare-need-open-package.md` | Ask / Compare / graph from nav still empty when no package is open | RS-08 leftover empty, not keyboard |
| 06 | `working-architect-06-authority-rank-names-not-customer.md` | `AdminAuthority` / `ExecuteAuthority` still leak on customer forbidden states | WD-09 leftover copy |
| 07 | `working-architect-07-ask-honesty-with-coverage.md` | Ask can sound certain when engines were quiet or MUST skipped | LD-03; RS-01 |
| 08 | `working-architect-08-sponsor-packet-honesty.md` | Sponsor KPI / ROI export can screenshot as all-clear | LD-03 leftover sponsor |
| 09 | `working-architect-09-compare-assumption-delta.md` | Compare hides asserted vs inferred divergence (R12) | RS-08 hrefs; R12 |
| 10 | `working-architect-10-new-draft-from-snapshot.md` | After spawn lock, no legal new-object path from the old draft | RS-04 leftover secondary CTA |
| 11 | `working-architect-11-correction-after-undo-window.md` | After 300s undo, livelihood writes look irreversible | LI-05; LD-05 mounts |
| 12 | `working-architect-12-seal-blocked-reason-one-sentence.md` | UI / API / CLI refuse skipped MUST with different sentences | LD-04 leftover copy |
| 13 | `working-architect-13-decision-receipt-at-stamp.md` | Yes and no receipts still live in appendix chrome | LI-02; PT-16 |
| 14 | `working-architect-14-remaining-seat-prefs.md` | hide-generic / findings density still URL-or-browser only | RS-10 leftover (ROI shipped) |
| 15 | `working-architect-15-restore-workspace-context.md` | Refresh loses workbench column, filters, scroll | PT-14 leftover after `findingId` URL |
| 16 | `working-architect-16-autosave-last-saved.md` | Remaining livelihood fields save without last-saved / retry | LI-12 draft truth leftover |
| 17 | `working-architect-17-keepalive-on-finalize-export.md` | OIDC can kill a long Finalize / export the way it killed projectors | LI-14 leftover non-presenter |
| 18 | `working-architect-18-finding-disposition-from-list.md` | Working list still requires inspect to dispose | LI-07; RS-14 list cue |
| 19 | `working-architect-19-search-defaults-to-package.md` | Global search is tenant-wide when a package is open | — unique |
| 20 | `working-architect-20-what-if-this-invariant.md` | What-if still means empty Compare, not ceteris-paribus from this review | R12; RS-08 |
| 21 | `working-architect-21-presenter-quiet-alerts.md` | Toasts / ops banners steal the projector | LD-13 leftover; RS-06 |
| 22 | `working-architect-22-activity-discrete-not-percent.md` | Activity still implies a fake progress bar | RS-05 leftover |
| 23 | `working-architect-23-evidence-surface-names.md` | Trail / graph / provenance still used interchangeably | TB-2097 leftover |
| 24 | `working-architect-24-eight-hour-zoom-motion.md` | Review-detail fails 200% zoom / reduced motion | WD-12 leftover after LD-14 |

## Already shipped — do not re-open

| Item | Evidence |
|------|----------|
| LI-01–15 / LD-01–15 / RS-01–15 | `master` #1397, #1421/#1439, #1457 |
| Working default / buyer-polish false / 300s undo / 4h idle | workspace-mode, demo-ui-env, mutation registry, session-idle-timeout |
| `resolveProductionDeskChrome()` | `production-desk-chrome.ts` — **migrate call sites in WA-01**; do not invent a thirteenth flag |
| Skipped-MUST commit gate | `AuthorityCommitSkippedMustGate` — **copy consistency in WA-12**; do not re-implement the gate |
| Spawn editor lock (no localStorage ack) | `architecture-draft-handoff-gate.ts` — **new-object CTA in WA-10**; do not resurrect “edit anyway” |
| Record correction API | `POST /v1/governance/mutation-corrections` |
| Finding `findingId` URL restore | `REVIEW_DETAIL_FINDING_PARAM` |
| Compare-from-review href | `buildCompareTwoReviewsHref` |
| ROI hourly cost account prefs | RS-10 — do not re-do that field |
| Dirty-guard CI inventory | RS-07 — do not fork; WA-01 is the **chrome-resolver** analogue |

## Global constraints (every prompt)

- Working-tree safety: `.\scripts\agent\check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** / overflow (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** change `DeterministicInsightDensityGate` `typed-engine-protected` (owner decision).
- Claim discipline: `docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md`. **TB-645** vocabulary (package, finding, sealed review record).
- Verification: focused Vitest from `archlucid-ui/`. Scoped `.\scripts\ci\agent-compile-check.ps1` only when C# changes. No full-solution builds, no dev servers unless the prompt says so.
- UI: Carbon density, sentence case, no ghost/link `Button`, form validation **TB-2005**.
- C#: one class per file; no `ConfigureAwait(false)` in tests; blank line before `if` / `foreach` unless first in method; check nulls.

## After each prompt

Summarize: files changed, tests run, residual risk, Working vs Guided behavior, whether the **product spine** (create → execute → seal) still works without that prompt. Do not mark LI, LD, or RS as undone.

**Wave 5 (do not implement from this paragraph):** [`career-desk-00-index.md`](career-desk-00-index.md) (**CD-01–15**). Do not fork WA; CD implements only leftovers WA does not own.
**Wave 6:** [`all-day-desk-00-index.md`](all-day-desk-00-index.md) (**AD-01–12**).

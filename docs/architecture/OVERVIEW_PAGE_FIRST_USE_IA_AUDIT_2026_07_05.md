> **Scope:** Adversarial product/UX audit of the ArchLucid Overview page (`/`) — whether the many overlapping "first review" / onboarding / first-use elements should be streamlined to one dominant path. Decision memo only; no code changes made. Audience: product, engineering, and design contributors.
>
> **Assessment date:** 2026-07-05
> **Related:** [`PRODUCT_UX_IMPLEMENTATION_LEAKAGE_AUDIT_2026_06_15.md`](PRODUCT_UX_IMPLEMENTATION_LEAKAGE_AUDIT_2026_06_15.md) (implementation vocabulary leaking into the UI — same root cause pattern); [`TECH_BACKLOG.md`](../library/TECH_BACKLOG.md) (TB-337–344 onboarding narrative realignment; pilot UX backlog absorbed); [`UI-Enterprise-Design-Standard.mdc`](../../.cursor/rules/UI-Enterprise-Design-Standard.mdc)

# Overview page first-use information-architecture audit

## Recommendation up front

**Yes, streamline.** The Overview page already contains the correct dominant path (`PilotCommandCenterCard`, heading "Start your first review", state-aware single primary CTA). The problem is that it is surrounded by **nine other named first-use constructs**, including **six different step-sequence enumerations of the same journey** (3, 4, 4, 4, 5, and 6 steps — and they disagree with each other on both count and order). This is accreted product scaffolding, not intentional design. Most of it should be deleted or moved to Help, not reorganized.

Target user: a principal architect, enterprise architect, security architect, or governance lead who wants to quickly understand what ArchLucid does and either (1) open a completed sample package, (2) start their own architecture review, or (3) finish setup only when setup is actually needed. ArchLucid should feel like an architecture workspace, not a tutorial maze.

---

## 1. Current-state diagnosis

What actually renders on `/` for a first-run tenant (standard architect workspace — `OperatorHomePageView` → `OperatorHomePageBody`), top to bottom:

| # | Visible label | Component | Job it claims | Verdict |
| --- | --- | --- | --- | --- |
| 0 | Welcome modal + tour | `OperatorWelcomeOnboarding` | First-visit orientation overlay | **Keep** (dismissible, out of layout) |
| 1 | **"Start your first review"** | `PilotCommandCenterCard` | The dominant path: primary "Open completed sample", secondary "Start your own review", 3-step preview, "Optional setup: Connect cloud / Invite reviewer" | **Keep — this is the winner.** Minor trim (see §3) |
| 2 | "Try a sample review" | `OperatorHomeSampleReviewPreview` | Shows 3 sample findings + "Run sample review" CTA | **Merge/demote.** Second sample concept ~100px below the first |
| 3 | "Continue setup" | `OperatorHomeContinueSetupSlot` / `OperatorHomeContinueSetupCard` | Link to `/onboarding` while setup incomplete | **Merge** with the hero's "Optional setup" row into one Setup readiness section |
| 4 | **"First-hour path"** | `OperatorFirstHourJourneyStrip` (injected *inside* the Workspace activity section by `RunsDashboardPanelClient`) | 4-step pill path, "Pilot first, Operate later" | **Remove from Overview.** Internal phase language leaking; duplicates the hero stepper |
| 5 | "Workspace activity" | `OperatorHomeRunsPanel` / `RunsDashboardPanelClient` | Recent packages, attention, outcomes | **Keep.** Its empty state repeats "Start your first review or open the example architecture package" — a third repetition of the hero CTAs |
| 6 | "Workspace metrics and status" | `OperatorHomeWorkspaceContextDisclosure` | 5 metrics incl. "Setup readiness" | **Gate.** Before any review exists this is a row of zeros — empty dashboard noise |
| 7 | "Setup and walkthroughs" (collapsed) | `OperatorHomeAdvancedGuidanceSection` | Container for everything below | **Rename + gut** |
| 7a | "First review progress" tri-tab hub (Operating path / Checklist / Readiness) | `UnifiedFirstPilotProgressPanel` | Progress hub | **Remove the hub;** keep at most one checklist |
| 7b | **"First-value lane"** | `FirstValueLanePanel` | 4-phase status lane, "sponsor-usable artifact", "advanced branches stay out of lane" | **Remove.** Pure internal GTM vocabulary in customer-facing UI |
| 7c | **"Full operating path"** | `FirstPilotOperatingRail` | 6-step rail, collapsed-inside-collapsed | **Remove from Overview** (Help at most) |
| 7d | **"First-run evidence checklist"** | `InProductEvidenceChecklist` | Live health/config checks; links to `/docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md` | **Move** signals to `/health` or Setup readiness; a runbook link is scaffolding leakage |
| 7e | **"First review checklist"** | `CorePilotChecklist` | 5-step localStorage checklist | **Keep one of {7e, 7g};** collapsed |
| 7f | "Workspace readiness" cockpit + status legend | `FirstPilotReadinessCockpit`, `StatusVocabularyLegend` | Diagnostics + vocabulary glossary | **Move** to `/health` and Help respectively |
| 7g | **"Fast path to first architecture package"** | `PilotStartHereStrip` | Another 4-step path, plus CLI commands (`archlucid pilot proof-packet`, `collect-first-pilot-proof.ps1`) and the sentence "…commercial next step. Operate, V1.1 connectors, and MCP stay optional after first finalize." | **Remove.** The single worst offender: CLI, PowerShell, roadmap ("V1.1"), protocol names ("MCP"), and sales-stage language ("commercial next step") on a customer Overview |
| 7h | **"Recommended first session path"** | `FirstWeekRouteGuidance` (`variant="home"`) | Prose guidance + "Start new review" button | **Remove from Overview** (its copy is fine on `/onboarding`) |
| 7i | "First review progress — X of 5 steps" | `CorePilotProgressTrackerBanner` | Duplicate of 7e reading the same localStorage keys | **Remove** (redundant with 7e) |

**Overlap analysis.** Items 1, 4, 7b, 7c, 7e, 7g are six enumerations of the *same funnel* with different step counts and different step orderings (some start at "Platform ready", some at "Start with a design or evidence"). A serious evaluator will notice they disagree and conclude the product doesn't know its own workflow. Items 1 (optional setup row), 3, 6 (setup readiness metric), 7d, and the "Open setup guide" / "20-minute setup guide" links are **five separate setup surfaces**.

**User-facing vs. leaked scaffolding.** User-facing and defensible: items 1, 2, 3, 5, 6. Internal scaffolding leaked into the UI: "First-value lane", "Full operating path", "Fast path", "Pilot first, Operate later", "Core pilot steps" (aria-label), CLI/PowerShell commands, `/docs/runbooks/…` link, "MCP", "V1.1 connectors", "sponsor-usable artifact", "commercial next step". Several components carry comments like `assessment improvement #9` / `assessment #4` — these sections exist because an assessment told someone to add coaching, and each wave was added *next to* the previous wave instead of replacing it. This mirrors the root-cause pattern already documented in [`PRODUCT_UX_IMPLEMENTATION_LEAKAGE_AUDIT_2026_06_15.md`](PRODUCT_UX_IMPLEMENTATION_LEAKAGE_AUDIT_2026_06_15.md): the machinery to do the right thing exists, but nothing forces convergence on one canonical surface.

**Dead code found:** `OperatorHomeFirstReviewSection`, `OperatorHomeFirstReviewPathStrip`, `OperatorHomeFirstReviewProgressCard` are referenced only by their own tests — a third, abandoned "First-hour path" implementation that never got wired into the live page tree. Delete.

---

## 2. User mental model

The target model is:

1. **See what a finished review looks like** (open the completed sample).
2. **Start my own review** (upload a diagram/brief).
3. **Finish setup only when something requires it** (cloud connection, second reviewer).

One challenge worth stating: "Open a completed sample" and "Run a sample review" are genuinely different capabilities (static finished package vs. executing the pipeline on template input). But a new evaluator cannot tell them apart from labels, and offering both at the same level creates a fake fork. Resolution: the *completed sample* is the Overview-level concept; "run the sample yourself" becomes an action *inside* the sample package page or the new-review flow (it already exists there as "Start with an example"). Do not present it as a third path on Overview.

There should be **zero** journey-stepper diagrams competing with the hero. The hero's 3-step preview ("Start with a design or evidence → Review findings and add supporting evidence → Finalize architecture package") is the only sequence the page needs.

---

## 3. Recommended streamlined structure

- **Top — Start your first review** (existing `PilotCommandCenterCard`, nearly unchanged): primary "Open completed sample", secondary "Start your own review", 3-step preview. **Remove** the "Optional setup" button row from the hero — setup gets exactly one home (below).
- **Workspace activity** (existing runs panel): remove the injected "First-hour path" strip; simplify the empty state to one line ("Your architecture packages will appear here") since the hero directly above already carries both CTAs.
- **Setup readiness** (current "Continue setup" absorbing the hero's Connect cloud / Invite reviewer buttons and the live checks from `InProductEvidenceChecklist`): visible while incomplete, one line + "Open setup guide"; hidden when complete (the existing `resolveOperatorHomeContinueSetupPlacement` logic already supports this).
- **Workspace metrics** — render only when ≥1 finalized review exists (the `useNavCommittedArchitectureReview` gate already used by `OperatorHomeExecutiveRoiStrip` is the right switch). A grid of zeros earns no trust.
- **How ArchLucid works** (collapsed; replaces "Setup and walkthroughs"): at most one checklist (the 5-step "First review checklist", renamed — see §4) and two or three links into Help. Everything else in the current drawer is deleted or moved.

---

## 4. Naming cleanup

| Term | Decision |
| --- | --- |
| First-hour path | **Remove** (strip removed; a help topic can survive under a plain name) |
| First-value lane | **Remove** — "lane" and "first value" are GTM-internal |
| First-run evidence checklist | **Remove name;** surviving signals fold into "Setup readiness" |
| Recommended first session path | **Remove** from Overview |
| First review checklist | **Rename** to "Review walkthrough" (survives, collapsed, as the only checklist) |
| Fast path to first architecture package | **Remove** entirely |
| Full operating path | **Remove;** "operating path" never appears in user-facing UI |

Final page vocabulary — exactly one "first" phrase: **"Start your first review"**, **"Workspace activity"**, **"Setup readiness"**, **"How ArchLucid works"**. Banned on Overview: *lane, rail, runbook, operating path, fast path, first-hour, first-value, session path, core pilot, MCP, V1.1, commercial next step*.

---

## 5. Overview vs. Help placement

- **Stays on Overview (visible):** hero, workspace activity, setup readiness (when incomplete).
- **Stays collapsed on Overview:** "Review walkthrough" checklist + Help links.
- **Moves to Getting Started (`/onboarding`):** `FirstWeekRouteGuidance` prose (already renders there natively), the 6-step detail from the operating rail if product wants to preserve it.
- **Moves to Help:** status vocabulary legend, "what the sample includes" education, CLI/script content (developer docs, not Help, ideally).
- **Removed entirely:** First-value lane, Fast path strip, duplicate progress banner, First-hour path strip, the tri-tab progress hub, and the dead `OperatorHomeFirstReview*` components.

---

## 6. Expert-efficiency check — the 7:30 AM principal architect

- *Can they immediately see what to do?* Yes — the hero is genuinely good. Then the page immediately undermines it with "Try a sample review" (didn't I just see a sample button?), "Continue setup" (do I need setup or not?), and "First-hour path" (is this different from the 3 steps above?).
- *Too many paths?* Six step-sequences with inconsistent step counts. That is not education; it is homework.
- *Teaching before needed?* Yes — status vocabulary legends, evidence checklists, and operating-path theory before the user has run anything.
- *Setup visible but not dominant?* Setup currently appears five times. Under the new structure: once.
- *Does the page earn trust through clarity?* The current page reads like an internal pilot-operations console. A principal architect with one diagram and a 9:00 meeting needs: one sample to judge output quality, one button to start, and silence otherwise.

---

## 7. Recommended final page hierarchy

**ARCHITECTURE OVERVIEW**

1. **Start your first review**
   - Purpose: single dominant first-use path, state-aware (becomes "Recent activity" heading + "View executive summary" / "Continue review" after commit, as today).
   - CTAs: primary "Open completed sample"; secondary "Start your own review".
   - Keep / change / remove: **keep** `PilotCommandCenterCard`; **remove** its optional-setup button row; optionally absorb one compact line from the sample preview ("Sample includes: PHI exposure finding, …").

2. **Workspace activity**
   - Purpose: latest architecture packages, attention items, outcomes.
   - CTAs: open package, open full reviews list.
   - Keep / change / remove: **keep** panel; **remove** embedded "First-hour path" strip; simplify empty state to one sentence.

3. **Setup readiness**
   - Purpose: the only setup surface; shown while incomplete.
   - CTAs: "Connect cloud", "Invite reviewer", "Open setup guide".
   - Keep / change / remove: **change** — merge Continue setup card + hero setup buttons + live readiness checks; hidden when complete.

4. **Workspace metrics**
   - Purpose: counts once there is activity.
   - CTAs: "View details" disclosure.
   - Keep / change / remove: **change** — render only after first finalized review.

5. **Help and walkthroughs** (collapsed)
   - Purpose: optional orientation.
   - CTAs: "Review walkthrough" checklist, links to Getting started and Help.
   - Keep / change / remove: **change** — replaces "Setup and walkthroughs"; delete lane/rail/fast-path/session-path/progress-banner contents.

---

## 8. Implementation recommendation (not yet approved / not implemented)

- **Components affected:** delete `PilotStartHereStrip`, `FirstValueLanePanel`, `CorePilotProgressTrackerBanner` usage on home, `UnifiedFirstPilotProgressPanel` (home usage), `OperatorFirstHourJourneyStrip` usage in `RunsDashboardPanelClient`, and the dead `OperatorHomeFirstReview*` trio. Edit `OperatorHomeAdvancedGuidanceSection`, `PilotCommandCenterCard`, `OperatorHomeContinueSetupCard`, `OperatorHomeSampleReviewPreview`, `OperatorHomeWorkspaceContextDisclosure` (commit gate), `buyer-polish-copy.ts`. Move `FirstPilotReadinessCockpit` and `InProductEvidenceChecklist` logic toward `/health` / setup readiness.
- **Copy changes:** rename "Setup and walkthroughs" → "How ArchLucid works"; "First review checklist" → "Review walkthrough"; delete the seven banned terms from `buyer-polish-copy.ts`, `first-value-lane.ts`, `first-week-route-guidance.ts`, `first-pilot-operating-rail-copy.ts` (Overview usages).
- **Section removals/merges:** see §7 mapping; net effect is nine named first-use constructs collapsing into the five sections in §7.
- **Test updates:** `OperatorHomePageView.test.tsx` + `.progressive-disclosure.test.ts`, `adoption-friction-ui.test.tsx`, `operator-home-help-affordances.test.tsx`, per-component tests of deleted components (delete alongside them), `(operator)/page.test.tsx` snapshots, terminology-guard tests (`review-terminology-surfaces.ts`), and e2e specs (`live-api-why-archlucid`, `live-api-email-run-to-sponsor`) that reference removed test ids.
- **Risks:** onboarding tour anchors (`data-onboarding="tour-runs-dashboard"` survives; verify no tour step targets a deleted element); orphaned localStorage disclosure keys (harmless); First Load JS budget (TB-573) will shift down — refresh the baseline intentionally; help slugs (`first-pilot-path`, `first-hour-operator-path`, `first-value-20-minutes`) must remain routable since other pages still link to them.
- **Rollback approach:** ship as one focused, UI-only PR with no route/API/permission changes — rollback is a plain `git revert`. No feature flag needed; the deleted components have no data dependencies. Optionally split into two waves: wave 1 = deletions/merges (low risk), wave 2 = metrics gating + setup consolidation (touches readiness hooks).

Scoping note: this audit covers the standard architect workspace (`OperatorHomePageBody`). The buyer-polished shell variant (`BuyerPolishedHomePageBody`) is already closer to the target structure and would inherit most of the cleanup for free.

---

## 9. Acceptance criteria for eventual implementation

1. Overview page has exactly one dominant first-use path visible above the fold: "Start your first review" with one primary and one secondary CTA.
2. At most one step-sequence rendered anywhere on Overview (the hero's 3-step preview).
3. Internal terms — "lane", "rail", "runbook", "operating path", "fast path", "first-hour", "first-value", "session path", "MCP", "V1.1", CLI commands, `.ps1` filenames — do not appear in user-facing Overview UI (assert via a terminology-guard test extension).
4. Setup remains visible when incomplete but does not dominate — it appears in exactly one section, hidden when complete.
5. Sample review (completed package) and own review are presented as one clearly distinct primary/secondary pair, not parallel cards.
6. Workspace metrics render only when the tenant has ≥1 finalized review — no empty-dashboard noise before activity.
7. Walkthrough content is collapsed or moved to Getting Started / Help; Overview contains no prose paragraphs of coaching outside the collapsed section.
8. Unit, snapshot, and e2e suites pass.
9. No route, permission, backend, upload, or review-package behavior changes — this is IA/copy/component-composition only.

---

## Code anchors (evidence)

| Surface | Path |
| --- | --- |
| Overview route entry | `archlucid-ui/src/app/(operator)/page.tsx` |
| Page composition (standard + buyer-polished bodies) | `archlucid-ui/src/app/(operator)/_sections/OperatorHomePageView.tsx` |
| Dominant hero / primary CTA | `archlucid-ui/src/components/usability/PilotCommandCenterCard.tsx` |
| Next-best-action resolution | `archlucid-ui/src/lib/resolve-pilot-next-best-action.ts` |
| "Try a sample review" card | `archlucid-ui/src/components/operator-home/OperatorHomeSampleReviewPreview.tsx` |
| Continue setup card + placement gate | `archlucid-ui/src/components/operator-home/OperatorHomeContinueSetupCard.tsx`, `OperatorHomeContinueSetupSlot.tsx`, `archlucid-ui/src/lib/resolve-operator-home-continue-setup-placement.ts` |
| First-hour path strip (injected into runs panel) | `archlucid-ui/src/components/OperatorFirstHourJourneyStrip.tsx`, `archlucid-ui/src/components/operator-home/RunsDashboardPanelClient.tsx` |
| Workspace metrics / status disclosure | `archlucid-ui/src/components/operator-home/OperatorHomeWorkspaceContextDisclosure.tsx`, `OperatorHomeWorkspaceMetricsSummary.tsx` |
| Collapsed "Setup and walkthroughs" container | `archlucid-ui/src/components/operator-home/OperatorHomeAdvancedGuidancePanel.tsx`, `OperatorHomeAdvancedGuidanceSection.tsx` |
| Tri-tab progress hub | `archlucid-ui/src/components/usability/UnifiedFirstPilotProgressPanel.tsx` |
| First-value lane | `archlucid-ui/src/components/usability/FirstValueLanePanel.tsx`, `archlucid-ui/src/lib/first-value-lane.ts` |
| Full operating path rail | `archlucid-ui/src/components/FirstPilotOperatingRail.tsx`, `archlucid-ui/src/lib/first-pilot-operating-rail-copy.ts` |
| First-run evidence checklist | `archlucid-ui/src/components/usability/InProductEvidenceChecklist.tsx` |
| First review checklist | `archlucid-ui/src/components/CorePilotChecklist.tsx` |
| Fast path to first architecture package | `archlucid-ui/src/components/operator-home/PilotStartHereStrip.tsx` |
| Recommended first session path | `archlucid-ui/src/components/FirstWeekRouteGuidance.tsx`, `archlucid-ui/src/lib/first-week-route-guidance.ts` |
| Duplicate progress banner | `archlucid-ui/src/components/usability/CorePilotProgressTrackerBanner.tsx` |
| Dead first-hour path implementation | `archlucid-ui/src/components/operator-home/OperatorHomeFirstReviewSection.tsx`, `OperatorHomeFirstReviewPathStrip.tsx`, `OperatorHomeFirstReviewProgressCard.tsx` |
| Shared Overview copy constants | `archlucid-ui/src/lib/buyer/buyer-polish-copy.ts` |

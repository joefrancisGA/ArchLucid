> **Scope:** Copy-paste Composer/agent prompts implementing the decision memo below. Each prompt is self-contained (restates relevant context) so it can be run in a fresh Composer session with no prior chat history. Run in order 1→7, reviewing the diff after each before starting the next.
>
> **Assessment date:** 2026-07-05
> **Source decision memo:** [`OVERVIEW_PAGE_FIRST_USE_IA_AUDIT_2026_07_05.md`](OVERVIEW_PAGE_FIRST_USE_IA_AUDIT_2026_07_05.md) — read this first; it contains the full diagnosis, rationale, and acceptance criteria that these prompts implement. Nothing in this repo has been changed yet — these prompts are not-yet-executed instructions.

# Overview page first-use IA cleanup — implementation prompts

Each prompt below creates its own branch off `master`. Per repo convention, review and test after each prompt before proceeding to the next; do not merge/push without explicit approval.

---

## Prompt 1 — Branch setup + dead-code removal (zero risk)

```
Read docs/architecture/OVERVIEW_PAGE_FIRST_USE_IA_AUDIT_2026_07_05.md in full for context before starting.

Create a new branch off master named `ui/overview-ia-cleanup-1-dead-code`.

Task: remove the abandoned "First-hour path" implementation that is never rendered in the live component tree (confirmed dead — only referenced by their own tests):

- archlucid-ui/src/components/operator-home/OperatorHomeFirstReviewSection.tsx (+ .test.tsx if present)
- archlucid-ui/src/components/operator-home/OperatorHomeFirstReviewPathStrip.tsx + OperatorHomeFirstReviewPathStrip.test.tsx
- archlucid-ui/src/components/operator-home/OperatorHomeFirstReviewProgressCard.tsx + OperatorHomeFirstReviewProgressCard.test.tsx

Before deleting, grep the codebase to confirm none of these three components are imported anywhere outside their own test files. If any live import is found, stop and report it instead of deleting.

Also remove now-orphaned copy constants only if they become unused after deletion (check archlucid-ui/src/lib/buyer-polish-copy.ts for OPERATOR_HOME_FIRST_REVIEW_SECTION_TITLE and OPERATOR_HOME_PILOT_FIRST_OPERATE_LATER_HEADING / OPERATOR_HOME_PILOT_FIRST_OPERATE_LATER_BODY — confirm no other consumer before removing).

Do not touch any other component. Do not touch routes, permissions, or backend code.

Run the relevant Vitest suite for archlucid-ui/src/components/operator-home/ and fix any resulting failures caused directly by this deletion.

Stop and report: files deleted, constants removed, test result.
```

---

## Prompt 2 — Gut the "Setup and walkthroughs" drawer

```
Read docs/architecture/OVERVIEW_PAGE_FIRST_USE_IA_AUDIT_2026_07_05.md in full for context before starting.

Branch off master (or continue on ui/overview-ia-cleanup-1-dead-code if still open) as `ui/overview-ia-cleanup-2-drawer`.

The collapsed "Setup and walkthroughs" section on the Overview page (rendered by archlucid-ui/src/components/operator-home/OperatorHomeAdvancedGuidanceSection.tsx) currently renders six overlapping first-use constructs. Per the audit's §1 and §5, reduce it to ONE checklist plus help links:

1. In OperatorHomeAdvancedGuidanceSection.tsx, remove these children entirely:
   - <UnifiedFirstPilotProgressPanel checklistVariant={checklistVariant} embedded /> — this tri-tab hub wraps FirstValueLanePanel, FirstPilotOperatingRail, and InProductEvidenceChecklist. Do NOT keep the tri-tab wrapper. Instead render <CorePilotChecklist variant={checklistVariant} /> directly in its place (this is the only checklist that survives — see step 3).
   - <PilotStartHereStrip /> ("Fast path to first review package") — delete this render call.
   - <CorePilotProgressTrackerBanner compact /> — delete this render call (duplicate of the checklist it sits next to).
   - <FirstWeekRouteGuidance variant="home" /> — delete this render call ("Recommended first session path" — this component's other variants like "onboarding" are used elsewhere and must NOT be touched).

2. Delete the now-unused component files (confirm no other importers first):
   - archlucid-ui/src/components/usability/FirstValueLanePanel.tsx (+ test, + archlucid-ui/src/lib/first-value-lane.ts + test)
   - archlucid-ui/src/components/FirstPilotOperatingRail.tsx (+ test, + archlucid-ui/src/lib/first-pilot-operating-rail-copy.ts if it becomes fully unused — check first-pilot-operating-rail-copy.test.tsx usage before deleting the lib file)
   - archlucid-ui/src/components/operator-home/PilotStartHereStrip.tsx (+ test)
   - archlucid-ui/src/components/usability/CorePilotProgressTrackerBanner.tsx (+ test)
   - archlucid-ui/src/components/usability/UnifiedFirstPilotProgressPanel.tsx (+ test) — only if nothing else references it (check onboarding page usage with checklistOnly prop before deleting; if /onboarding uses it with checklistOnly, keep the file but remove the "path"/"readiness" tabs and simplify it to render only the checklist, OR replace the onboarding usage with a direct <CorePilotChecklist> render and then delete the file — pick whichever is the smaller diff and report which you chose)
   - archlucid-ui/src/components/FirstPilotReadinessCockpit.tsx and archlucid-ui/src/components/usability/StatusVocabularyLegend.tsx — only delete if they become fully unused after removing UnifiedFirstPilotProgressPanel; otherwise leave them for a future "move to /health and Help" pass and note this in your report.
   - archlucid-ui/src/components/usability/InProductEvidenceChecklist.tsx — do NOT delete yet, this is handled in Prompt 4 (setup consolidation). Just remove its render call from OperatorHomeAdvancedGuidanceSection if it was rendered there directly (it currently is not — it's nested inside UnifiedFirstPilotProgressPanel's "path" tab, so removing that tab handles it).

3. Rename the section title: in archlucid-ui/src/lib/buyer-polish-copy.ts, change:
   - OPERATOR_HOME_ADVANCED_GUIDANCE_TITLE from "Setup and walkthroughs" to "How ArchLucid works"
   - OPERATOR_HOME_ADVANCED_GUIDANCE_COLLAPSED_SUMMARY from "Checklists, operating path, walkthroughs, and optional setup." to something like "Review walkthrough and help links."
   Also rename the CorePilotChecklist heading from "First review checklist" to "Review walkthrough" (archlucid-ui/src/components/CorePilotChecklist.tsx, both title="First review checklist" occurrences and the titleId if it encodes the old name — keep titleId stable if other code/tests reference it by id, only change the visible text).

4. Update or delete tests referencing removed components/copy: OperatorHomeAdvancedGuidanceSection tests, adoption-friction-ui.test.tsx, operator-home-help-affordances.test.tsx, any snapshot tests under archlucid-ui/src/app/(operator)/page.test.tsx or __snapshots__ that assert the old heading text or removed test ids.

Do not change anything on the /onboarding page's own guidance content except as required by the UnifiedFirstPilotProgressPanel decision in step 2.

Run the affected Vitest suites and fix failures.

Stop and report: which files were deleted vs. kept, the UnifiedFirstPilotProgressPanel decision and why, and test results.
```

---

## Prompt 3 — Remove the injected "First-hour path" strip from Workspace activity

```
Read docs/architecture/OVERVIEW_PAGE_FIRST_USE_IA_AUDIT_2026_07_05.md for context, specifically item #4 in the diagnosis table.

Branch off master as `ui/overview-ia-cleanup-3-first-hour-strip`.

archlucid-ui/src/components/operator-home/RunsDashboardPanelClient.tsx renders <OperatorFirstHourJourneyStrip /> above the runs dashboard card when !buyerPolishedShell (around the `!buyerPolishedShell ? (...) : null` block). This strip duplicates the hero's 3-step preview with a different 4-step sequence and internal "Pilot first, Operate later" language.

1. Remove the <OperatorFirstHourJourneyStrip /> render and its wrapping <div className={OPERATOR_LAYOUT.sectionStack}> from RunsDashboardPanelClient.tsx.
2. Remove the now-unused import of OperatorFirstHourJourneyStrip.
3. Delete archlucid-ui/src/components/OperatorFirstHourJourneyStrip.tsx and OperatorFirstHourJourneyStrip.test.tsx.
4. Check archlucid-ui/src/lib/operator-first-hour-journey-nav.ts and its test — delete only if OperatorFirstHourJourneyStrip was its sole consumer; otherwise leave it and report what else uses it.
5. Check archlucid-ui/src/app/(operator)/help/HelpTopicFirstHourCanonicalGuide.test.tsx — this help topic can remain (help content is out of scope for Overview cleanup), but remove any test assertions that specifically depend on the deleted OperatorFirstHourJourneyStrip component; do not delete the help topic page itself.
6. Simplify the runs dashboard empty-state copy: if there's a distinct empty state string that duplicates "Start your first review or open the example review package" (already defined as OPERATOR_HOME_WORKSPACE_EMPTY_BODY in buyer-polish-copy.ts), shorten it to something like "Your review packages will appear here." since the hero above already carries both CTAs. Locate the empty-state component (likely OperatorHomeWorkspaceEmptyState.tsx or RunsDashboardRecentTab.tsx) and update accordingly — do not remove the empty state's structure, only the redundant CTA copy/buttons if they duplicate the hero.

Update any tests that assert on the removed strip's test ids (data-testid="operator-first-hour-journey-strip", "operator-first-hour-step-*", "operator-first-hour-next-guidance") in RunsDashboardPanelClient.test.tsx or similar.

Run the affected Vitest suites and fix failures.

Stop and report: files deleted, empty-state copy change made, test results.
```

---

## Prompt 4 — Consolidate setup into one "Setup readiness" surface

```
Read docs/architecture/OVERVIEW_PAGE_FIRST_USE_IA_AUDIT_2026_07_05.md for context, specifically §3 and §7 item 3 ("Setup readiness").

Branch off master as `ui/overview-ia-cleanup-4-setup-consolidation`.

Currently setup appears in multiple places on Overview: (a) PilotCommandCenterCard's inline "Optional setup: Connect cloud / Invite reviewer" row, (b) OperatorHomeContinueSetupCard ("Continue setup"), (c) live health/config checks in InProductEvidenceChecklist. Consolidate into ONE section.

1. In archlucid-ui/src/components/usability/PilotCommandCenterCard.tsx, remove the entire "heroOptionalSetup" block (the `<div className="heroOptionalSetup mt-2 space-y-2" data-testid="pilot-command-center-optional-setup">...</div>` containing the "Connect cloud" and "Invite reviewer" buttons and the PILOT_COMMAND_CENTER_OPTIONAL_SETUP_LABEL). Keep the primary/secondary CTA row and the 3-step preview stepper unchanged.

2. In archlucid-ui/src/components/operator-home/OperatorHomeContinueSetupCard.tsx, add "Connect cloud" and "Invite reviewer" as additional secondary action links alongside the existing "Open setup guide" link, using the same hrefs currently in PilotCommandCenterCard (CLOUD_CONNECTIONS_PATH from @/lib/integrations-nav-paths, INVITE_REVIEWER_PATH from @/lib/invite-reviewer-flow). Keep the existing "Open setup guide" -> /onboarding link as the primary action. Match the existing card's visual style (do not introduce new colors/pastel fills — see .cursor/rules/UI-Enterprise-Design-Standard.mdc).

3. Remove now-unused copy constants from archlucid-ui/src/lib/buyer-polish-copy.ts if PilotCommandCenterCard no longer references them: PILOT_COMMAND_CENTER_CONNECT_AZURE, PILOT_COMMAND_CENTER_INVITE_REVIEWER, PILOT_COMMAND_CENTER_OPTIONAL_SETUP_LABEL — but only remove if OperatorHomeContinueSetupCard doesn't need the same labels (reuse them there instead of introducing duplicates if the label text still fits).

4. For InProductEvidenceChecklist.tsx ("First-run evidence checklist"): this component is not currently rendered on Overview after Prompt 2's changes (it was only reachable via the deleted UnifiedFirstPilotProgressPanel "path" tab). Confirm it has no remaining Overview render path. If confirmed orphaned from Overview, leave the component file in place for now (it may still be useful on /health or a future setup page) but delete its Overview-specific "First-run evidence checklist" heading test coverage that asserts it renders on the home page. Do not delete the file itself in this prompt — that's a separate future task, note this in your report.

5. Update archlucid-ui/src/lib/resolve-operator-home-continue-setup-placement.ts and its test only if the placement logic needs adjustment to account for the newly-merged actions (it likely does not — verify and report).

6. Update tests: PilotCommandCenterCard.test.tsx (or wherever "pilot-command-center-optional-setup", "pilot-command-center-connect-azure", "pilot-command-center-invite-reviewer" test ids are asserted) and OperatorHomeContinueSetupCard.test.tsx to reflect the moved buttons.

Run the affected Vitest suites and fix failures.

Stop and report: final button layout on both cards, which copy constants were reused vs. removed, test results.
```

---

## Prompt 5 — Gate Workspace metrics behind first commit

```
Read docs/architecture/OVERVIEW_PAGE_FIRST_USE_IA_AUDIT_2026_07_05.md for context, specifically §3 and §7 item 4 ("Workspace metrics").

Branch off master as `ui/overview-ia-cleanup-5-metrics-gate`.

archlucid-ui/src/components/operator-home/OperatorHomeWorkspaceContextDisclosure.tsx ("Workspace metrics and status") currently always renders, showing a grid of zeros before the tenant has any committed review. Gate it the same way archlucid-ui/src/components/operator-home/OperatorHomeExecutiveRoiStrip.tsx already gates itself: using the useNavCommittedArchitectureReview() hook from @/components/OperatorNavAuthorityProvider.

1. In OperatorHomeWorkspaceContextDisclosure.tsx, import useNavCommittedArchitectureReview and return null early if hasCommittedArchitectureReview is false — mirror the pattern in OperatorHomeExecutiveRoiStrip.tsx exactly (same hook, same early-return style).
2. Verify this doesn't break the buyer-polished shell body in OperatorHomePageView.tsx, which currently passes showWorkspaceStatus={false} to this component in the buyer-polished path and showWorkspaceStatus={fullOperatorShell} in the standard path — the new gate is orthogonal to showWorkspaceStatus (that prop controls a nested sub-panel, not the whole section), confirm this and report if there's any conflict.
3. Update OperatorHomeWorkspaceContextDisclosure.test.tsx to add a test case asserting the section does not render when there is no committed architecture review, alongside existing cases.
4. Update OperatorHomePageView.test.tsx and OperatorHomePageView.progressive-disclosure.test.ts if they assert this section is always present for a no-activity tenant.

Do not change the section's rendered content when it IS visible (post-commit) — only add the gate.

Run the affected Vitest suites and fix failures.

Stop and report: test results and confirmation the gate matches the ROI strip pattern.
```

---

## Prompt 6 — Terminology guard + final naming sweep

```
Read docs/architecture/OVERVIEW_PAGE_FIRST_USE_IA_AUDIT_2026_07_05.md for context, specifically §4 (naming cleanup) and acceptance criterion #3.

Branch off master as `ui/overview-ia-cleanup-6-terminology-guard`.

This is the final pass after Prompts 1-5 have removed the components carrying banned vocabulary. Now enforce it stays gone.

1. Search archlucid-ui/src for any remaining occurrences (case-insensitive) of these banned terms in files that render on the Overview page tree (archlucid-ui/src/app/(operator)/page.tsx, OperatorHomePageView.tsx, and everything transitively imported by OperatorHomePageBody / BuyerPolishedHomePageBody):
   - "lane" (as in First-value lane)
   - "operating path" / "Full operating path"
   - "fast path"
   - "first-hour"
   - "first-value" (as a UI-visible label, not internal var names — variable/file names like first-value-lane.ts that were already deleted in Prompt 2 don't count; only check remaining live copy)
   - "session path"
   - "runbook"
   - "MCP"
   - "V1.1"
   - "commercial next step"
   Report every remaining hit with file:line. For each, either remove/rename per the audit's naming table, or if it's legitimately outside the Overview render tree (e.g. an admin page), leave it and note why.

2. Look at archlucid-ui/src/lib/review-terminology-surfaces.ts and review-terminology-guard.test.ts — these already enforce buyer-facing vocabulary rewrites. Add a new guard (either extend the existing test file or add a focused new test archlucid-ui/src/app/(operator)/_sections/OperatorHomePageView.overview-vocabulary.test.tsx) that renders OperatorHomePageView (both buyerPolishedShell states) and asserts the rendered output does NOT contain any of the banned terms listed above. Follow the existing terminology-guard test's structure/conventions for consistency.

3. Confirm the final vocabulary is limited to exactly: "Start your first review", "Workspace activity" (or "Recent activity"/OPERATOR_HOME_RECENT_REVIEWS_HEADING as already canonical), "Setup readiness" (rename OperatorHomeContinueSetupCard's heading from "Continue setup" to "Setup readiness" per the audit's final vocabulary — update copy, test ids can stay as-is if changing them is high-risk, but update the visible text and any test assertions on visible text), "How ArchLucid works" (already done in Prompt 2).

4. Run npm run lint if available and the full archlucid-ui Vitest suite for the operator-home directory plus the new guard test.

Stop and report: final list of any remaining flagged terms and why they were kept (if any), and full test results.
```

---

## Prompt 7 — Full verification pass and First Load JS baseline refresh

```
Read docs/architecture/OVERVIEW_PAGE_FIRST_USE_IA_AUDIT_2026_07_05.md §9 (acceptance criteria) before starting.

This should run after Prompts 1-6 are merged (or squashed onto one integration branch off master, e.g. `ui/overview-ia-cleanup-final`).

1. Run the full archlucid-ui Vitest suite (not just scoped directories this time) and fix any remaining failures caused by the Overview cleanup.
2. Run the Playwright e2e specs that touch Overview or the removed components if they can run in this environment (check archlucid-ui/e2e/live-api-why-archlucid.spec.ts and live-api-email-run-to-sponsor.spec.ts for references to removed test ids — update selectors as needed; skip if these require live API and cannot run locally, but still fix any hardcoded selectors referencing deleted components).
3. Walk through acceptance criteria from the audit doc one by one and confirm each is met by inspecting the current OperatorHomePageView.tsx render tree:
   - One dominant first-use path above the fold
   - At most one step-sequence on the page
   - No banned terminology in user-facing Overview UI
   - Setup visible only in one place, hidden when complete
   - Sample review vs. own review clearly distinct (not parallel cards)
   - Workspace metrics gated to post-commit
   - Walkthrough content collapsed/moved
   - No route, permission, backend, upload, or review-package behavior changes (diff the API client calls / hrefs to confirm nothing besides UI composition changed)
4. If archlucid-ui/performance/first-load-js-baseline.v1.json exists and this repo has the `npm run build` + `npm run check:first-load-js` / `npm run write:first-load-js-baseline` scripts referenced in archlucid-ui/AGENTS.md, run a build and refresh the First Load JS baseline since bundle size should have decreased from the deletions — do NOT run this if it requires a full production build outside your allowed scope; instead flag it for a human to run.
5. Produce a short before/after summary: list of components removed (with line-count reduction if easy to compute), sections consolidated, and the final 5-section page outline as implemented.

Do not touch anything outside archlucid-ui/. Do not modify backend/.NET code, database DDL, or Terraform.

Stop and report the full verification summary.
```

---

## Usage notes

- Each prompt assumes it starts fresh in Composer with no memory of prior conversation — that's why each restates the relevant memo section instead of referencing "our discussion."
- Run in dependency order: dead code → drawer contents → injected strip → setup merge → metrics gate → terminology enforcement → final verification.
- Per this repo's branch-naming convention, no commits should be made without the user naming the target branch in the same request; each prompt instructs the agent to create its own working branch off `master` but does not push or open a PR — that remains a separate, explicit step.
- If a single combined implementation session is preferred instead of seven separate branches, collapse Prompts 1–6 into one session on a single branch (e.g. `ui/overview-ia-cleanup`) and run Prompt 7 at the end unchanged.

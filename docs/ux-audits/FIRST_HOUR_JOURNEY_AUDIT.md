# First-hour user journey audit

**Date:** 2026-06-28  
**Scope:** Home · Onboarding · Review templates · New review flow · Evidence upload · Review package · Invite reviewer  
**Audience audited for:** Senior IT leaders, enterprise architects, governance and security reviewers, platform owners, customer admins  
**Constraint:** No new features. No code changes beyond copy, IA restructure, and minor styling. Prefer minimal fixes.  
**Backlog cross-reference:** TB-431 – TB-455 (all Open, see `docs/library/TECH_BACKLOG.md`)

---

## Summary

| Severity | Count | Description |
|----------|-------|-------------|
| P0 | 3 | Stop / trust loss — raw debug copy, internal toast labels, pipeline diagnostics on primary surface |
| P1 | 7 | First-hour friction — jargon page titles, collapsed deliverables, CTA inconsistency, "Sponsor Export" |
| P2 | 9 | Confusion, recoverable — pilot mode toggle, CLI tools in onboarding, undefined terms, "intake" vocabulary |
| P3 | 6 | Polish — low-contrast CTAs, "architecture request" wording, navigation meta-copy |
| **Total** | **25** | |

**Dominant issue class:** Internal product-builder vocabulary ("pilot," "commit," "manifest," "artifacts," "traceability bundle," "intake," "operator path") surfacing verbatim in copy that enterprise governance reviewers read.

**Fix types:** 19 copy-only · 4 IA change · 1 styling · 1 copy+IA

---

## P0 — Stop / trust loss

### F01 · `/reviews` · RunsPageView — malformed error state (TB-431)

**Current issue**  
> "The HTTP call may have succeeded, but the JSON did not match the expected paged review summary shape. This is distinct from an empty project (zero reviews)."

**Why it matters**  
Raw API diagnostic copy exposed verbatim to enterprise governance reviewers. Immediately signals an unstable product to any senior IT leader who hits this state.

**Recommended fix**  
> "Review packages could not be loaded. Try reloading the page. If this continues, contact support."

**Fix type:** Copy only

---

### F02 · `/reviews/new` · FirstPilotIntakeWizard — error toast category (TB-432)

**Current issue**  
Submit-error toast is titled "First-pilot intake" — an internal product label visible to customers in production.

**Why it matters**  
"Pilot" signals evaluation/pre-release status to a buying enterprise customer. Destroys confidence at the exact moment of first submission failure.

**Recommended fix**  
Change toast category to "New review" or omit the category title entirely.

**Fix type:** Copy only

---

### F03 · `/reviews/[runId]` · RunDetailRunActionsSection — pipeline diagnostics link (TB-433)

**Current issue**  
"Pipeline diagnostics — optional detail for operators troubleshooting pipeline steps." is rendered inline in the Actions card visible to all users.

**Why it matters**  
Enterprise IT leaders and governance reviewers open the review detail to review outputs. Seeing pipeline troubleshooting tools inline signals an unfinished, developer-facing product.

**Recommended fix**  
Move behind a collapsed disclosure (e.g. "Technical details") or remove from the primary Actions card entirely. If retained, label it "Review pipeline log (technical detail)."

**Fix type:** IA change

---

## P1 — First-hour friction

### F04 · `/onboarding` · OnboardingPageView — page title and lead (TB-434)

**Current issue**  
Page title is "Onboarding". Lead copy says "...from intake to committed package."

**Why it matters**  
"Onboarding" is how internal teams describe the process, not how customers navigate a product. "Committed package" is git/software jargon. A senior IT leader expects "Getting started" and "approved review" or "finalized review."

**Recommended fix**  
Title → "Getting started". Lead → "Create and finalize your first architecture package."

**Fix type:** Copy only

---

### F05 · `/onboarding` · OnboardingPageView — help link label (TB-435)

**Current issue**  
InAppHelpLink renders "First-pilot operator path — full walkthrough" as a visible link in the progress section.

**Why it matters**  
"First-pilot operator path" reads as an internal test-plan document title. Enterprise architects do not self-identify as "pilot operators." Reduces confidence in product maturity.

**Recommended fix**  
"Architecture review walkthrough" or "Full setup guide."

**Fix type:** Copy only

---

### F06 · `/reviews/[runId]` · RunDetailArtifactsExportsSection — section title (TB-436)

**Current issue**  
Operator shell shows "Artifacts & exports" for the deliverables section. The section is also collapsed by default (`defaultOpen={!buyerPolishedArtifactTable}`).

**Why it matters**  
"Artifacts" is software pipeline jargon. The key outputs of a governance review are collapsed by default for the enterprise architect workspace — the audience most likely to need them immediately.

**Recommended fix**  
Title → "Deliverables". Set `defaultOpen=true` for the architect workspace.

**Fix type:** Copy only

---

### F07 · `/reviews/new` · FirstPilotIntakeWizard — submit CTA (TB-437)

**Current issue**  
Primary submit button reads "Start analysis". The same action on the reviews list reads "Start architecture review."

**Why it matters**  
"Start analysis" implies a data pipeline process, not a governed review workflow. Inconsistency across the first-hour journey makes it unclear what the user is creating.

**Recommended fix**  
Unify to "Start architecture review" across home, wizard, and reviews list.

**Fix type:** Copy only

---

### F08 · `/reviews/[runId]` · RunDetailArtifactsExportsSection — primary download button (TB-438)

**Current issue**  
"Download Sponsor Export (DOCX)" is the primary button in the operator Artifacts section.

**Why it matters**  
"Sponsor Export" is ambiguous — who is the sponsor? Enterprise governance reviewers want to know what the document _is_, not who it is for. The buyer shell uses "Download evidence package" which is clearer.

**Recommended fix**  
"Download architecture review report (DOCX)."

**Fix type:** Copy only

---

### F09 · `/reviews/[runId]` · RunDetailArtifactsExportsSection — empty state (TB-439)

**Current issue**  
Empty state reads "No artifacts generated yet. Wait for the review to commit."

**Why it matters**  
"Commit" is git jargon. Users expecting a finalized governance review do not recognize "commit" as the action that produces outputs. Creates a dead-end feeling with no actionable path.

**Recommended fix**  
"No deliverables yet. They will appear here once the review is finalized." + Retry button.

**Fix type:** Copy only

---

### F10 · `/reviews/new` · ReviewsNewPathSwitcher — path descriptions (TB-440)

**Current issue**  
Page lead: "Use Quick start when you already have an architecture brief or evidence file. Use Guided intake when you want ArchLucid to walk you through the context."

**Why it matters**  
This is meta-copy about the UI rather than outcome-oriented copy. A first-time senior IT leader must decode it. "Architecture brief" and "Guided intake" are product-specific terms without prior definition.

**Recommended fix**  
"Start with a diagram or document (Quick start) or let ArchLucid guide you through what to include (Guided)."

**Fix type:** Copy only

---

## P2 — Confusion, recoverable

### F11 · `/reviews/new` · FirstPilotIntakeWizard — advanced accordion (TB-441)

**Current issue**  
"Advanced configuration (optional)" accordion contains a "Focused pilot mode" toggle.

**Why it matters**  
"Pilot mode" suggests a demo or test state. Enterprise customers paying for a production product should not see a "pilot mode" toggle. Creates doubt about what mode they are in.

**Recommended fix**  
Rename toggle to "Focused review scope". Rename accordion label to "Review scope (optional)."

**Fix type:** Copy only

---

### F12 · `/onboarding` · OnboardingOptionalSetupSection — CLI tools sub-section (TB-442)

**Current issue**  
"Developer / CLI tools" with collapsed summary "Terminal workflow for evaluators who prefer the CLI." is visible in the Onboarding optional setup section.

**Why it matters**  
Senior IT leaders and governance reviewers arrive at Onboarding to set up their first review. Seeing "Developer / CLI tools" signals this is a developer product, not a governance platform. "Evaluators" reinforces a pre-sales, pilot feel.

**Recommended fix**  
Rename to "Command-line access (advanced)" and collapse into a nested disclosure only accessible from a Settings route, not the primary Onboarding page.

**Fix type:** IA change

---

### F13 · `/` · OperatorHomeContinueSetupCard — card body (TB-443)

**Current issue**  
"Continue setup" card description reads "Finish workspace setup, evidence checklist, and optional integrations."

**Why it matters**  
"Evidence checklist" is product-internal vocabulary. A customer admin reading this does not know what evidence they need to supply or why it is part of workspace setup.

**Recommended fix**  
"Finish workspace setup, reviewer access, and optional cloud connections." CTA → "Continue getting started."

**Fix type:** Copy only

---

### F14 · `/reviews/new` · NewRunPage — help link in page header (TB-444)

**Current issue**  
"Full pilot guidance" is rendered as a text link next to the "New Architecture Review" page title.

**Why it matters**  
"Pilot guidance" in a product navigation link suggests the product is in evaluation mode. Customers who are paying for a production service would find this disconcerting.

**Recommended fix**  
"Review guide" or "Setup guide."

**Fix type:** Copy only

---

### F15 · `/reviews/[runId]` · RunDetailArtifactsExportsSection — description (TB-445)

**Current issue**  
"Review the manifest's decisions, findings, and structured metadata."

**Why it matters**  
"Manifest" is an internal product term. To an enterprise architect, a "manifest" means a deployment file or a shipping document — not a governance record.

**Recommended fix**  
"Review the decisions, findings, and supporting evidence for this architecture package."

**Fix type:** Copy only

---

### F16 · `/reviews/[runId]` · RunDetailRunActionsSection — traceability bundle (TB-446)

**Current issue**  
"Download traceability bundle (ZIP)" is the secondary download CTA in the Actions card.

**Why it matters**  
"Traceability bundle" is technical audit/provenance vocabulary that governance reviewers and IT leaders would not use to describe what they need. They want an "evidence package" or "audit export."

**Recommended fix**  
"Download evidence package (ZIP)."

**Fix type:** Copy only

---

### F17 · `/settings/roles/invite-reviewer` · InviteReviewerPageView — footer copy (TB-447)

**Current issue**  
"Need to manage existing users, custom roles, or API keys? Open Users and roles."

**Why it matters**  
"API keys" in the footer of an Invite Reviewer page is developer-facing language that a governance reviewer or customer admin would not expect on this surface. It signals a technical product, not a governance workflow.

**Recommended fix**  
Remove "or API keys" from this footer. Keep "Need to manage users or permissions?"

**Fix type:** Copy only

---

### F18 · `/` · PilotCommandCenterCard — path preview step 2 (TB-448)

**Current issue**  
Step label reads "Review findings and missing evidence."

**Why it matters**  
"Missing evidence" sounds like an error condition, not a normal step in a governance workflow. A first-time user may interpret this as meaning their review will have gaps regardless of what they submit.

**Recommended fix**  
"Review findings and add supporting evidence" or "Review findings and evidence."

**Fix type:** Copy only

---

### F19 · `/reviews` · RunsPageView — subtitle (TB-449)

**Current issue**  
Page subtitle: "Finalized architecture reviews with findings, evidence, sealed review records, and exports."

**Why it matters**  
Users with in-progress (non-finalized) reviews land on this page and the subtitle implies they will only see completed reviews. A first-time user may not find their in-progress work and assume the review failed.

**Recommended fix**  
"Architecture packages — in progress, finalized, and ready for export."

**Fix type:** Copy only

---

### F20 · `/reviews/new` · ReviewsNewPathSwitcher — first-run banner (TB-450)

**Current issue**  
"Streamlined first review — upload one diagram to start. Evaluation standards apply automatically." + "More intake options" button.

**Why it matters**  
"Evaluation standards" is an undefined term on first contact. "More intake options" uses "intake" — a healthcare/clinical term that is common internally but unfamiliar to platform owners and security reviewers.

**Recommended fix**  
Banner → "Quick path: upload one diagram to start. Review scope is pre-configured." Button → "More options."

**Fix type:** Copy only

---

## P3 — Polish

### F21 · `/` · OperatorHomeSampleReviewPreview — lead copy (TB-451)

**Current issue**  
"See how ArchLucid turns an architecture request into findings, evidence, governance actions, and a completed architecture package."

**Why it matters**  
"Architecture request" is the internal API payload name, not how a customer describes their input. Customers submit "architecture proposals," "design documents," or "initiative briefs."

**Recommended fix**  
"See how ArchLucid turns an architecture document into findings, governance decisions, and a completed architecture package."

**Fix type:** Copy only

---

### F22 · `/reviews/[runId]` · RunDetailRunActionsSection — actions card description (TB-452)

**Current issue**  
"Exports and sponsor-facing bundles sit in Deliverables & exports above. Use this card for scorecard generation and traceability ZIP, and optional compare shortcuts."

**Why it matters**  
"Scorecard generation" and "traceability ZIP" are internal product terms. The card description is navigation meta-copy that tells users where things are, not what to do next.

**Recommended fix**  
Remove the description paragraph. Let the action buttons speak for themselves.

**Fix type:** Copy only

---

### F23 · `/reviews/new` · FirstPilotIntakeWizard — validation error toast (TB-453)

**Current issue**  
"Enter a review title and attach at least one evidence file or a complete brief." is shown as a toast on submit attempt.

**Why it matters**  
The toast is clear but "evidence file" and "complete brief" are undefined terms on first contact. A customer uploading an architecture diagram may not know that is an "evidence file."

**Recommended fix**  
"Add a review title and upload at least one architecture document or fill in the description below."

**Fix type:** Copy only

---

### F24 · `/` · PilotCommandCenterCard — optional setup links (TB-454)

**Current issue**  
"Optional setup: Connect Azure · Invite reviewer" rendered at low contrast (`text-al-text-secondary/80`) — near-invisible tertiary text.

**Why it matters**  
"Invite reviewer" is a key action in the first-hour journey. Rendering it at low contrast in a footnote-like row means users with normal aging vision may not see it as clickable.

**Recommended fix**  
Render "Invite reviewer" and "Connect Azure" as outline badge-links or secondary buttons, not plain-text anchors below the fold of the hero card.

**Fix type:** Styling only

---

### F25 · `/reviews/[runId]` · RunDetailPage — not-found with fromGeneration (TB-455)

**Current issue**  
Error heading: "Review generation — Could not open generated package."

**Why it matters**  
"Review generation" is internal pipeline vocabulary. A user who just submitted a new review and arrives here will not understand what "generation" means in this context.

**Recommended fix**  
"Architecture review — package could not be opened. It may still be processing."

**Fix type:** Copy only

---

## Terminology quick-reference

| Internal / current term | Where it appears | Recommended customer-facing term |
|------------------------|-----------------|----------------------------------|
| commit (verb) | Onboarding lead, progress steps, empty state | finalize |
| committed package | Onboarding page lead copy | finalized architecture package |
| artifacts | "Artifacts & exports" section title, architect workspace | deliverables |
| manifest | "Review the manifest's decisions…" in artifact section description | architecture package / sealed record |
| pilot mode / pilot guidance / first-pilot | New review help link, advanced toggle, error toast | review / setup guide / focused scope |
| traceability bundle | Actions card download CTA | evidence package |
| Sponsor Export (DOCX) | Primary download button | Architecture review report (DOCX) |
| architecture request | Sample review preview lead copy | architecture document / design proposal |
| intake | "More intake options" button, "Guided intake" tab | options / guided path |
| evaluation standards | New review banner copy | review scope |
| Pipeline diagnostics | Inline link on review detail Actions card | move to collapsed technical disclosure |

---

## Route-by-route summary

| Route | P0 | P1 | P2 | P3 | Top risk |
|-------|----|----|----|----|----------|
| `/reviews` | 1 | — | 1 | — | Debug API error message shown verbatim to customers |
| `/reviews/new` | 1 | 2 | 2 | 2 | "First-pilot intake" toast + "Start analysis" CTA mismatch |
| `/reviews/[runId]` | 1 | 3 | — | 2 | Pipeline diagnostics inline; "Artifacts & exports" collapsed; "manifest" in copy |
| `/onboarding` | — | 2 | 1 | — | "First-pilot operator path" help link; CLI tools in onboarding |
| `/` (home) | — | — | 2 | 2 | Low-contrast invite CTA; "missing evidence" step label |
| `/settings/roles/invite-reviewer` | — | — | 1 | — | "API keys" in footer of invite form |
| `/reviews/[runId]` (error state) | — | — | — | 1 | "Review generation" error heading |

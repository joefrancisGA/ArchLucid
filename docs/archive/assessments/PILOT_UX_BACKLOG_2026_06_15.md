> **Scope:** Smallest backlog to materially improve ArchLucid's readiness for a private pilot with 10–20 experienced Enterprise Architects. Derived from [`PRODUCT_UX_IMPLEMENTATION_LEAKAGE_AUDIT_2026_06_15.md`](PRODUCT_UX_IMPLEMENTATION_LEAKAGE_AUDIT_2026_06_15.md).
>
> **Assessment date:** 2026-06-15  
> **Constraints:** outcome-first UX, reduce implementation leakage, first impressions, limited engineering resources, no major architectural work.
>
> **Important correction to audit:** `isBuyerPolishedOperatorShellEnv()` returns `true` by default — dev chrome (including the AI budget pill) is only active when `NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator` is explicitly set. `.env.development` sets this for engineers; pilot tenant deployments must not inherit it. Several "severe" issues in the audit collapse into a single deployment-configuration verification.

---

## P0 — Must Fix Before Pilot

Failure to address these would likely create confusion, damage credibility, or distort product positioning within the first session.

**Start here — two categories of work, different tools:**

| Category | Items | Action |
| --- | --- | --- |
| Deployment configuration | P0-1, P0-8 | Verify env vars before provisioning the pilot tenant. No code required. |
| Code changes (required regardless of deployment config) | P0-2, P0-3, P0-4, P0-5, P0-6, P0-7 | These surfaces appear even when the buyer-polished shell is correctly active. |

**P0-1 is the gateway check.** If the pilot deployment is correctly configured (buyer-polished shell active), the AI budget pill disappears, "Evidence intake" becomes "New review," and pipeline stage names become human-readable automatically. Verify P0-1 first; it may make the pilot experience substantially better before any code is written. Items P0-2 through P0-7 are required code changes regardless of deployment configuration.

---

### P0-1 — Verify pilot deployment does not set `NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator`

**Why it matters:** `.env.development` hardcodes this flag so local engineers get the full operator shell — dense nav, dev chrome, the AI budget pill, and engineering vocabulary. If this leaks into a pilot deployment (e.g. via a copied `.env.local` or a misconfigured CI deploy), every other fix below is irrelevant. The buyer-polished shell — which already hides the budget pill, relabels "Evidence intake" to "New review," maps pipeline stage names to human labels, and applies scope-switcher polish — is the default when this flag is absent.

**User impact:** 10/10  
**Effort:** 1/10 (env config verification, no code)  
**Confidence:** 10/10

---

### P0-2 — Remove Azure from intake wizard step labels

**Why it matters:** The full intake wizard's evidence step is labeled "Evidence (optional) — Azure extractor ZIP or demo data" and the context step is "Ingest Azure context — Packager command (optional)." Any architect from an AWS, GCP, or multi-cloud shop reads this and immediately concludes the product is Azure-specific. "Extractor ZIP" and "Packager command" are implementation artifacts, not user goals. The labels should describe what the user provides, not how the platform processes it.

**Suggested replacements:**
- Step: "Add architecture evidence (optional) — upload a file, paste a description, or connect a source"
- Context step: "Add more context (optional) — supplemental documents or environment details"

**Code anchor:** `archlucid-ui/src/app/(operator)/reviews/new/NewRunWizardClient.tsx` (step label constants near lines 77–80)

**User impact:** 9/10  
**Effort:** 2/10  
**Confidence:** 9/10

---

### P0-3 — Remove hardcoded `cloudProvider: "Azure"` default from Quick Review wizard

**Why it matters:** `QuickReviewWizard.tsx` passes `cloudProvider: "Azure"` to the review creation API and the placeholder text assumes Azure architecture ("App Service for APIs, Azure SQL for orders"). An architect describing a GCP or on-premises system gets a form that silently files their review under an Azure assumption. This is a schema-level artifact, not just a label. The cloud provider field should default to blank or a generic prompt, and the placeholder should describe a provider-neutral architecture.

**Code anchor:** `archlucid-ui/src/app/(operator)/reviews/new/QuickReviewWizard.tsx` line 153

**User impact:** 8/10  
**Effort:** 2/10  
**Confidence:** 9/10

---

### P0-4 — Rewrite `PIPELINE_STATUS_TOOLTIPS` to remove internal vocabulary

**Why it matters:** Architects will hover the status badge on a review in progress. The current tooltips read:

- Starting: "The architecture request has been received and the execution pipeline is initializing."
- Ready to finalize: "All analysis is complete. An operator must review and commit the Golden Manifest."

"Execution pipeline is initializing" is platform jargon. "Golden Manifest" is an internal engineering code name — it sounds like a ceremony, not a product artifact. These tooltips are the first time architects see what the status actually means, and both teach platform mechanics rather than outcomes.

**Suggested replacements:**
- Starting: "ArchLucid is preparing your architecture review."
- Ready to finalize: "All analysis is complete. Finalize the review to produce a signed, auditable record."

**Code anchor:** `archlucid-ui/src/lib/i18n.ts` — `PIPELINE_STATUS_TOOLTIPS`

**User impact:** 7/10  
**Effort:** 2/10  
**Confidence:** 9/10

---

### P0-5 — Rename status labels `Ready to seal` and `In flight`

**Why it matters:** `PIPELINE_STATUS_LABELS` includes "Ready to seal" and "In flight" — both visible in the reviews list and the run status badge that architects see throughout the product. "Ready to seal" reads like a packaging/shipping metaphor; "In flight" is aviation vocabulary. Architects expect terms like "Finalizing" or "Reviewing" when describing analysis work. "Ready to finalize" already exists in the same label map and is the right model.

**Suggested replacements:**
- "In flight" → "Analyzing" or "In review"
- "Ready to seal" → "Ready to finalize" (align with the existing `readyToFinalize` label)

**Code anchors:** `archlucid-ui/src/lib/i18n.ts`, `archlucid-ui/src/components/RunStatusBadge.tsx`, `archlucid-ui/src/app/(operator)/reviews/RunsListClient.tsx`

**User impact:** 7/10  
**Effort:** 3/10 (multiple call sites; test updates required)  
**Confidence:** 8/10

---

### P0-6 — Replace `Golden Manifest` with outcome language on user-facing surfaces

**Why it matters:** "Golden Manifest" appears across a significant number of user-facing components: `GoldenManifestExportMenu`, `PostCommitHabitLoopCard`, `PostCommitRetentionRail`, the run detail page, executive views, and export utilities. This is an internal engineering code name that made it into the product noun layer. To an Enterprise Architect it reads as either jargon or a ceremonial concept — neither conveys "this is the authoritative, signed record of your architecture review."

**Suggested replacement:** "Signed review record" or "Signed package" — consistent with `BUYER_SURFACE_VOCABULARY` which already uses "signed package" in the vocabulary pass.

**Note:** This touches many files. The safest path is to rename `DOMAIN_TERMS.goldenManifest` and update all references, which the TypeScript compiler will enumerate.

**Code anchors:** `archlucid-ui/src/lib/i18n.ts` (`DOMAIN_TERMS`), `archlucid-ui/src/components/GoldenManifestExportMenu.tsx` and 15+ additional files

**User impact:** 6/10  
**Effort:** 4/10  
**Confidence:** 8/10

---

### P0-7 — Rewrite Service Bus degradation banner as a user-facing outcome

**Why it matters:** When Azure Service Bus is degraded, the banner currently reads: "Azure Service Bus messaging is degraded. Background jobs and integration events may be delayed or failing. Review worker logs and open System health for the azure_service_bus readiness check." An Enterprise Architect asked to "review worker logs" and check an "azure_service_bus readiness check" is being handed a platform operations task. The banner should describe the user-visible consequence and what to expect, not the infrastructure failure.

**Suggested replacement:** "Some analysis tasks are delayed — results may take longer than usual. Contact your ArchLucid administrator if this persists."

**Code anchor:** `archlucid-ui/src/lib/i18n.ts` — `SERVICE_BUS_HEALTH_LABELS`

**User impact:** 5/10 (only visible during actual degradation, but the impression when it fires is severe)  
**Effort:** 1/10  
**Confidence:** 10/10

---

### P0-8 — Fix help documentation links for pilot deployment

**Why it matters:** `.env.development` sets `NEXT_PUBLIC_DOCS_BASE_URL` to a raw GitHub blob URL (`https://github.com/joefrancisGA/ArchLucid/blob/master`). If pilot deployments use this value, every "Open documentation" link opens a raw GitHub source file — which looks unfinished and exposes internal repository structure. The in-product `/help/{topic}` routes are the correct target; the GitHub URL is a development fallback only.

**Code anchor:** `archlucid-ui/.env.development` line 3; `archlucid-ui/src/lib/contextual-help-content.ts`

**User impact:** 6/10 (if architects click Help)  
**Effort:** 1/10 (env config; verify /help routes resolve for target topics)  
**Confidence:** 9/10

---

## P1 — Fix During Pilot

These improve usability and sustained adoption but are not first-session blockers for sophisticated architects.

---

### P1-1 — Rename `Replay a review` tooltip to remove "pipeline output"

The tooltip reads "re-validate stored pipeline output." Replace with "re-run analysis on a previously submitted architecture" or "re-analyse a prior architecture submission."

**User impact:** 4/10 | **Effort:** 1/10 | **Confidence:** 9/10

---

### P1-2 — Rewrite `Connector operations` tooltip

Current: "readiness, smoke signals, and Service Bus posture." "Smoke signals" is SRE shorthand; "Service Bus posture" is platform-internal. Replace with: "integration readiness and connectivity status."

**User impact:** 4/10 | **Effort:** 1/10 | **Confidence:** 9/10

---

### P1-3 — Move `System health` to Admin group (or gate to `AdminAuthority`)

`System health — API liveness, readiness, and critical dependencies` currently sits in the Analysis nav group visible to `ReadAuthority` users. An architect looking for Compare and Ask should not see a platform health monitor alongside them. Move it to `operator-admin`, or add `requiredAuthority: "AdminAuthority"`.

**User impact:** 5/10 | **Effort:** 2/10 | **Confidence:** 8/10

---

### P1-4 — Rename `Cloud connections` nav entry

Current: "Cloud connections — Tier 2 continuous ingestion setup." "Tier 2" is an internal capability tier; "continuous ingestion" is a platform mechanism. Replace with: "Cloud connections — connect a cloud environment for continuous architecture monitoring."

**User impact:** 4/10 | **Effort:** 1/10 | **Confidence:** 9/10

---

### P1-5 — Remove internal ticket notation from nav tooltips

`Pilot feedback — rollups and triage (58R)`, `Planning — improvement themes and prioritized plans (59R)`, and `Evolution candidates — simulations and before/after review (60R)` expose internal engineering ticket IDs to all ReadAuthority users. Strip the parenthetical references.

**User impact:** 3/10 | **Effort:** 1/10 | **Confidence:** 10/10

---

### P1-6 — Rewrite `Value report` tooltip

Current: "sponsor DOCX from ROI_MODEL-aligned tenant metrics." "ROI_MODEL" is an internal label; "sponsor DOCX" is the file format, not the outcome. Replace with: "executive summary of architecture review outcomes and risk reduction."

**User impact:** 4/10 | **Effort:** 1/10 | **Confidence:** 9/10

---

### P1-7 — Rewrite `Teams notifications` tooltip

Current: "Key Vault reference for incoming webhook fan-out." Both "Key Vault reference" and "fan-out" are implementation vocabulary. Replace with: "Microsoft Teams alerts — receive architecture and governance notifications in Teams."

**User impact:** 3/10 | **Effort:** 1/10 | **Confidence:** 9/10

---

### P1-8 — Remove `pre-commit gate` from user-facing DOMAIN_TERMS

`preCommitGate: "Pre-commit gate"` uses CI/CD vocabulary ("pre-commit" belongs to git hooks, not architecture reviews). If this label is rendered to architects, rename it to "Finalization check" or "Sign-off gate."

**User impact:** 4/10 | **Effort:** 2/10 | **Confidence:** 7/10

---

### P1-9 — Audit and update Quick Review placeholder text for cloud-neutrality

The placeholder "e.g. Azure" for the cloud provider field, and the guided-intake placeholder assuming Azure App Service / Azure SQL architecture, should be replaced with provider-neutral or multi-cloud examples.

**User impact:** 5/10 | **Effort:** 2/10 | **Confidence:** 8/10

---

### P1-10 — Rename `Average time to manifest` KPI on Scorecard

The pilot scorecard KPI uses "average time to manifest" language, which leaks the internal pipeline noun. Replace with "Average time to finalize" or "Average review completion time."

**Code anchor:** `archlucid-ui/src/app/(operator)/scorecard/_sections/PilotScorecardPageView.tsx` line 68

**User impact:** 4/10 | **Effort:** 2/10 | **Confidence:** 8/10

---

### P1-11 — Extend vocabulary pass (run→review) to buyer-polished shell

Currently `applyBuyerDemoVocabulary()` is gated on `isCtoDemoVocabularyPassEnv()`, meaning the run→review / manifest→signed-package rewrites only activate in CTO demo mode, not in the buyer-polished shell. Decoupling the vocabulary pass from the demo flag would normalize language across all real tenant sessions without touching the CTO demo flow.

**Code anchor:** `archlucid-ui/src/lib/buyer-demo-vocabulary.ts`

**User impact:** 5/10 | **Effort:** 4/10 | **Confidence:** 7/10

---

### P1-12 — Rename `Digests` nav entry for clarity

"Digests — generated digests, subscriptions, and sponsor schedule" is self-referential and "sponsor schedule" is internal. Replace with: "Digests — scheduled summaries and stakeholder subscriptions."

**User impact:** 2/10 | **Effort:** 1/10 | **Confidence:** 8/10

---

### P1-13 — Add a one-line description to the onboarding checklist for "start a review"

If the first onboarding step leads architects into the evidence intake wizard, the checklist entry should describe the outcome, not the action: "Start your first architecture review — submit your architecture for automated analysis and governance assessment" rather than any evidence/intake framing.

**User impact:** 5/10 | **Effort:** 2/10 | **Confidence:** 7/10

---

### P1-14 — Rename `Integration DLQ` in admin nav

Even administrators benefit from clear language. "Integration DLQ — inspect and retry failed outbound integration events" → "Failed deliveries — inspect and retry failed outbound notifications."

**User impact:** 2/10 | **Effort:** 1/10 | **Confidence:** 9/10

---

### P1-15 — Rename `RAG health` in admin nav

"RAG health — per-corpus index freshness and embedding dimension" is an ML engineering label. Replace with: "Knowledge index health — index freshness and search readiness."

**User impact:** 2/10 | **Effort:** 1/10 | **Confidence:** 9/10

---

## P2 — Post-Pilot

These are legitimate improvements but have no material effect on an EA pilot outcome. Address based on what the pilot surfaces as friction.

1. **Full admin nav structural separation** — isolating platform-ops (health, DLQ, RAG) from business-ops (billing, users, SSO) within the Admin group. Worthwhile design work; not a pilot blocker.
2. **Fleet LLM COGS rename** — admin-only surface; pilot EAs won't reach it.
3. **Trial funnel and Pricing quote aging** — consider whether these belong in customer-facing tenants at all. Post-pilot decision.
4. **Comprehensive terminology guard on default shell** — extend `review-terminology-guard.test.ts` to cover non-buyer-surface files. Valuable regression prevention; not urgent before pilot.
5. **Vocabulary pass as a tenant setting** rather than a build-time flag — meaningful architectural improvement; V1.1 scope.
6. **Executive shell (CIO/CTO path) polish** — pilot cohort is EAs, not executives. Invest post-pilot.
7. **ROI/value report deep language polish** — architects will notice the review experience before the reporting layer.
8. **`Tenant health — pilot funnel stage`** admin tooltip — internal term in admin-only surface.
9. **"Simulator-only periods do not represent live Azure OpenAI analysis"** copy in ROI report — accurate disclosure but Azure-specific; rewrite post-pilot.
10. **`Artifact Bundle` in DOMAIN_TERMS** — if not surfaced to pilot users, defer.

---

## Top Five Changes

If only five changes could be completed before inviting external architects, these are the five that generate the greatest increase in perceived product maturity.

### 1. Verify deployment environment (P0-1)

**Zero code. Maximum ROI.** Confirming that pilot instances do not carry `NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator` activates the buyer-polished shell, which already: hides the AI budget pill, relabels "Evidence intake" to "New review," applies human pipeline-stage labels, and polishes the scope switcher. This one check may render three or four other items unnecessary for the pilot.

### 2. Remove Azure from intake wizard (P0-2 + P0-3)

The wizard is the first substantive interaction. Step labels naming "Azure extractor ZIP" and a defaulted `cloudProvider: "Azure"` are the product's opening argument that it is an Azure tool. Neutral labels and a blank cloud-provider default immediately extend perceived applicability to any architecture context.

### 3. Rewrite status tooltips to remove "Golden Manifest" and "execution pipeline" (P0-4 + P0-6 partial)

Architects hover on status. "The execution pipeline is initializing" and "commit the Golden Manifest" are the product explaining itself using code names. Rewriting these to outcome language ("ArchLucid is preparing your review" / "Finalize the review to produce a signed record") is the highest-ROI vocabulary change because it hits the highest-frequency touchpoint.

### 4. Rename `Ready to seal` and `In flight` status labels (P0-5)

Status labels appear on every review row and every detail page. Shipping/aviation metaphors ("seal," "in flight") do not fit an architecture governance product. "Analyzing" and "Ready to finalize" are already used in adjacent labels — this is a consistency fix that removes the most jarring vocabulary from the highest-surface-area component.

### 5. Rewrite Service Bus degradation banner (P0-7)

The cheapest change with the most disproportionate impact on trust. If anything degrades during the pilot — and it is a pilot — the error message that appears will either read as professional product copy or as an SRE runbook instruction. Changing one string turns a potential trust-destroying moment ("review worker logs and open System health for the azure_service_bus readiness check") into a composed, user-oriented message ("results may take longer than usual").

---

## Stop Doing

The following categories of UX/positioning work should be explicitly deferred — they are unlikely to move the pilot outcome and risk consuming limited engineering time on work that only becomes relevant post-pilot.

**Admin nav structural reorganization.** Enterprise Architects in a pilot will not be granted `AdminAuthority`. "Fleet LLM COGS," "RAG health," "Trial funnel," and "Integration DLQ" are not on their path. Reorganizing the admin group is a good post-pilot design task; doing it now is building for an audience that isn't in the room.

**Comprehensive vocabulary normalization across all files.** Doing a full repo pass on "manifest," "run," "commit," "pipeline" across every component, test, and utility is weeks of work. The pilot cohort — experienced Enterprise Architects — will tolerate some internal vocabulary in secondary surfaces. Focus on the vocabulary that appears in the wizard, status labels, and tooltips; leave the long tail.

**Executive shell polish (CIO/CTO path).** The pilot audience is architects, not executives. Invest in the executive path after the pilot generates evidence about what executives actually want to see.

**ROI and value report refinements.** Architects in a pilot will evaluate the review, finding, and governance experience. They will not spend significant time in value reports during a first evaluation. Report polish is a conversion/expansion concern, not an acquisition concern.

**`Tenant health` / `Pricing quote aging` / vendor-metric telemetry.** These are internal business-operations tools. Whether they should ship in customer tenants at all is a meaningful product decision — but it is not a decision that needs to be made or executed before the pilot.

**Adding glossary entries for "AI budget" and "RAG."** If the pilot deployment is correctly configured (P0-1), architects will not encounter the AI budget indicator. Writing glossary entries for concepts users should not see is the wrong direction; the right answer is to not show the concept, not to explain it.

**Comprehensive `review-terminology-guard` test extension.** The guard already covers buyer surfaces and high-traffic copy files. Extending it to every file in the codebase is a regression prevention investment for after the vocabulary is stabilized — not a pre-pilot priority.

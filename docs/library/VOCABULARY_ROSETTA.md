> **Scope:** Contributor-reference — the single mapping table between internal/API vocabulary and buyer vocabulary, the end-state rule for where each is legal, and the classified leak inventory for the dual-vocabulary cleanup (2026-08-03). Parents: [`CONCEPT_VOCABULARY.md#ui-glossary-v1`](CONCEPT_VOCABULARY.md#ui-glossary-v1) (canonical buyer ↔ technical noun table) and `.cursor/rules/UI-Enterprise-Design-Standard.mdc` (product-language rules).

> **Reviewed:** 2026-08-03

# Vocabulary rosetta — internal/API terms vs buyer terms

**Origin:** principal-architect critique #3 ("two vocabularies for the same objects"). The UI says *architecture review / finalize / sealed review record*; the API and CLI say `run` / `runId` / `commit` / manifest. Every buyer-visible mismatch costs trust. This file records the end state and tracks the remaining leaks.

## End-state rule

1. **Public HTTP and spine SQL use buyer nouns (ADR 0064).** Canonical paths say `review` / `finalize` / `signed-review-record` (wire lag; buyer noun is **sealed review record**). Spine tables are `dbo.Reviews`, `dbo.SignedReviewRecords`, `dbo.FinalizeReviewIdempotency`, with synonyms for the former `Runs` / `GoldenManifests` / `CommitRunIdempotency` names so existing SQL text keeps compiling.
2. **Buyer surfaces use the same nouns.** Marketing, help, empty states, page titles, breadcrumbs, toasts, error messages, aria-labels, and export prose say *architecture review, architecture package, finalize/finalized, sealed review record, evidence graph*.
3. **Operator surfaces prefer buyer vocabulary** but may show raw API identifiers (a `runId` route parameter value, correlation IDs) inside disclosure affordances or support-correlation contexts — labeled, not narrated (e.g. a copyable ID row is fine; "commit your run" prose is not).
4. **Docs:** engineering docs may still say `run`/`commit`/`GoldenManifest` for type and historical names. Customer-facing docs use buyer nouns. Bridge line when teaching the wire: route param `runId` is the **Review ID**; `POST …/finalize` is finalize.
5. **C# type names and durable audit event strings** may lag; do not rewrite historical audit rows.

## Mapping table

| Internal / API term | Buyer term | Where the internal term remains legal | Enforcement |
|---|---|---|---|
| `run`, `ArchitectureRun`, `/v1/architecture/review/...` | **Architecture review** / **Review** | Code, API, CLI verb, route params, engineering docs | `review-terminology-guard.test.ts` + `review-terminology-surfaces.ts` (high-traffic UI modules); `check_concept_vocabulary.py` (docs) |
| `runId` (displayed) | **Review ID** label (raw value allowed in disclosure/support contexts) | Code identifiers everywhere; work-item/export correlation payloads | Manual review; see inventory class (b) |
| `commit` (verb), "committed" | **Finalize** / **finalized** | Git contexts; API `POST .../commit`; CLI verb; code identifiers (`PreCommitGovernanceGate`) | **Gap — this is the incomplete migration.** New literals banned via `internal-concept-leakage-vocabulary.test.ts` (2026-08-03); backfill tracked in the inventory below |
| golden manifest / committed manifest | **Sealed review record** (artifact) / **Architecture package** (whole) | Code identifiers (`GoldenManifest`, `IManifestHashService`), engineering docs | `GoldenManifestExportMenu.test.ts` (no buyer-visible literals); `help-product-language.ts` regex rewrite; `review-terminology-copy.test.ts`; `customer-glossary-manifest.ts` deprecated aliases |
| pre-commit gate | **Pre-finalize governance gate** | Code (`PreCommitGovernanceGate`), API | Docs updated opportunistically; POSITIONING.md already annotates "(API still says pre-commit)" |
| coordinator | *(never buyer-visible)* | Internal pipeline ADRs/code only | Not rendered on any surface |
| Authority / `requiredAuthority` | Workspace-role phrasing ("workspace administrator") | Code, API contracts | `internal-concept-leakage-guard.test.ts` (IA-013) |
| "operator" (persona) | **Architect / Admin / Reviewer / Approver / Sponsor / Sponsor** per surface | `(operator)` route group, env flags, diagnostics | `review-terminology-guard.test.ts`; [`CONCEPT_VOCABULARY.md#persona-terms`](CONCEPT_VOCABULARY.md#persona-terms) |

## Leak inventory (2026-08-03)

Classes: **(a)** buyer-visible leak — fix; **(b)** operator/support surface — internal identifier deliberate, leave; **(c)** legal — code identifier, test name, comment, API field.

### Verdict by pattern

- **`run` as review noun:** largely migrated (routes labeled "Reviews", terminology guard active). Remaining rendered uses are class (b) support-correlation labels ("Review run ID" in `GovernanceQuickApproveDialog`, "Run ID:" lines in exported work items via `copy-finding-as-work-item.ts` / `pilot-roi-validation-handoff.ts`) — deliberate correlation IDs, keep.
- **`golden manifest`:** contained. All rendered-copy paths route through `SIGNED_MANIFEST_LABEL` / `help-product-language.ts`; remaining hits are comments, test fixtures, and glossary "former terms" entries — class (c).
- **`commit` / `committed` as buyer verb:** **the open gap** (~100+ hits). Canonical copy modules themselves leak (fixed 2026-08-03, see checklist); many component-level literals remain.

### Class (a) checklist — commit→finalize

Status values: **done** (fixed 2026-08-03) Â· **open** (follow-up) Â· **blocked** (file dirty/untracked in user working tree at session start).

| File | Hits | Status |
|---|---|---|
| `src/lib/vocabulary/buyer-surface-vocabulary.ts` (sponsor dashboard copy: "Commit at least one review…", "committed reviews", "No committed reviews yet", …) | ~12 | done |
| `src/lib/buyer/buyer-polish-copy.ts` (`BUYER_EXECUTIVE_DATA_SOURCE_NOTE`, scorecard empty action) | 2 | done |
| `src/lib/sponsor/sponsor-dashboard-page-copy.ts` (page lead) | 1 | done |
| `src/lib/pilot-scorecard-present.ts` ("Committed reviews" KPI + zero-detail copy) | 3 | **open — needs owner decision:** the scorecard deliberately shows "Committed reviews" (`totalRunsCommitted`) *beside* "Finalized packages" (`totalManifestsCreated`); renaming the first to "Finalized reviews" would conflate two distinct metrics. Owner must pick a buyer noun pair (e.g. "Reviews submitted" / "Packages finalized") before this file changes |
| `src/lib/review-scorecard-empty-state.ts` ("No committed reviews yet" heading — rest of the module already used finalize vocabulary) | 1 | done |
| `src/lib/search-empty-preset.ts` + `src/lib/enterprise-compact-empty-state-presets.ts` ("committed review evidence indexed") | 2 | done |
| `src/lib/layer-guidance.ts` ("Select a committed review…", "Schedules clone a committed review…") | 2 | done |
| `src/components/OperateGatedEmptyState.tsx` ("unlocks after your first committed review") | 1 | done |
| `src/components/PostCommitRetentionRail.tsx` ("You have a committed review.") | 1 | done |
| `src/components/policy/PolicyPackImpactPreviewPanel.tsx` ("Committed review ID" label/placeholder/error) | 4 | done |
| `src/components/governance/RecurrenceScheduleCreatePanel.tsx` ("committed review GUID", "Choose a committed review") | 2 | done |
| `src/app/(operator)/architecture/sponsor-dashboard/_sections/BusinessImpactSummaryWidget.tsx` | 3 | done |
| `src/app/(operator)/architecture/sponsor-dashboard/_sections/ExecutiveRoiSummarySection.tsx` ("Run or commit a review…", "No committed reviews with findings yet…", "Latest committed review per system") | 3 | done |
| `src/lib/contextual-help-registry.ts` ("committed review evidence is indexed", "Use a committed review…") | 2 | **blocked** (dirty at baseline) |
| `src/lib/repeat-review-activation.ts` ("Plan your second committed review", "Open committed review", …) | 4 | **blocked** (untracked user file) |
| `src/lib/impact-preview-page-copy.ts` | ? | **blocked** (dirty at baseline) |
| Remaining component/lib literals ("committed review(s)" in `RunDetailAiReadinessGateCard`, `OperatorHomeExecutiveRoiStrip`, `BeforeAfterDeltaPanel`, `RunDetailDecisionDeltaPanel`, `RoiSummaryPageView`, `enterprise-controls-context-copy.ts`, `sponsor-scorecard-hours-saved-display.ts`, `layer-guidance` schedule surfaces, sponsor-facing JSON copy `roi-sponsor-facing-scope-labels.v1.json`, help markdown rewriters, test names/fixtures) | ~40 | open — follow-up pass; new literals blocked by guard |

### Class (b) — leave as-is (deliberate internal identifiers)

- "Review run ID" / "Run ID:" support-correlation rows and exported work-item payloads (`GovernanceQuickApproveDialog.tsx`, `copy-finding-as-work-item.ts`, `pilot-roi-validation-handoff.ts`).
- Operator diagnostics and Admin/Diagnostics routes (persona rule: Operator retained).
- `PostCommitRetentionRail` / `core-pilot-commit-context` **identifiers** (file/component names stay; only rendered copy changed).

### Class (c) — legal (no action)

- All code identifiers (`runId`, `hasCommittedRuns`, `PreCommitGovernanceGate`, `GoldenManifest*`), route params, API fields, generated types.
- Test names, comments, snapshots of engineering-only surfaces.
- Glossary/terminology modules that *document* the legacy terms (`customer-glossary-manifest.ts` deprecated aliases, `glossary-terms.ts` "former terms").

## Enforcement added 2026-08-03

- `archlucid-ui/src/lib/vocabulary/internal-concept-leakage-vocabulary.test.ts` — bans new "Commit a review"-family literals on listed buyer copy surfaces (sibling of the IA-013 guard; separate file because `internal-concept-leakage-guard.test.ts` was dirty at session start).

## Related

- [`CONCEPT_VOCABULARY.md#ui-glossary-v1`](CONCEPT_VOCABULARY.md#ui-glossary-v1) — canonical buyer ↔ technical noun table (parent)
- [`GLOSSARY.md`](GLOSSARY.md) — buyer-facing definitions
- `.cursor/rules/UI-Enterprise-Design-Standard.mdc` — product-language rules for UI authors
- `.cursor/prompts/dual-vocabulary-cleanup.md` — the prompt set this file executes

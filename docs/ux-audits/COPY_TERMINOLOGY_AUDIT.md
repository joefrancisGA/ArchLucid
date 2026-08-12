# Copy, Terminology, and Product Language Audit

**Date:** 2026-06-28  
**Scope:** All operator-facing and buyer-facing UI copy in `archlucid-ui/src/`  
**Objective:** ArchLucid must present as a governed enterprise architecture review platform — not an internal prototype, an Azure-only scanner, a chatbot, or a demo harness.  
**Backlog items:** TB-456–TB-480 (25 findings)  
**Conflicts with prior sessions:** None — all new findings are additive to TB-431–455 (first-hour UX) and N01–N19 (nav/IA audit).

**GTM showcase naming (M-135, 2026-07-29):** Buyer-facing sample language hierarchy and Contoso/Northwind safe vs toxic matrix live in [`../go-to-market/DEMO_QUICKSTART.md#showcase-naming-hierarchy-m-135`](../go-to-market/DEMO_QUICKSTART.md#showcase-naming-hierarchy-m-135) (`SHOWCASE_NAMING_HIERARCHY.md` alias). Prefer **Showcase → scenario name → sample review → illustrative sample**; ban Contoso/Northwind in primary one-sentence and primary CTA chrome.

---

## Summary statistics

| Severity | Count | Primary files affected |
|---|---:|---|
| **P0 — Trust blockers** | 5 | `buyer-surface-vocabulary.ts`, `buyer-polish-copy.ts`, `core-pilot-path-vocabulary.ts` |
| **P1 — Credibility erosion** | 12 | `buyer-polish-copy.ts`, `buyer-surface-vocabulary.ts`, `i18n.ts` |
| **P2 — Confusion / polish** | 7 | `buyer-polish-copy.ts`, `i18n.ts`, `CorePilotNextStepsCard.tsx`, `custom-role-permission-groups.ts` |
| **P3 — Cleanup** | 1 | `buyer-polish-copy.ts` |
| **Total** | **25** | |

---

## 1. Top five structural problems

1. **"Pilot" persists in production labels** — "Pilot feedback," "Evaluation value report," "Evaluation standards," "Start CTO demo," and "during a pilot" are all customer-visible production labels accessible to any authenticated user. These signal the product is still in evaluation, not in production.

2. **"Commit" vs. "Finalize" inconsistency** — the pipeline status system uses `Finalized / Ready to finalize` consistently, but the home page hero (step 3), the executive scorecard KPI, the executive dashboard empty states, the evidence graph subtitle, the onboarding step tracker, and the roles permissions label all still say "commit." Both terms are in simultaneous use for the same action.

3. **Azure-first home page** — `PILOT_COMMAND_CENTER_LEAD` ends with "an optional Azure import" and `PILOT_COMMAND_CENTER_CONNECT_AZURE = "Connect Azure"` is the only cloud-specific optional setup CTA, despite multi-cloud (Azure, AWS, GCP) support being live. A customer with an AWS or GCP estate sees no invitation on the primary onboarding surface.

4. **Demo language leaks into live surfaces** — "demo integrity tools" appears in the production audit trail note; "seeded Claims Intake review" appears in Why ArchLucid copy; "Demo-derived sample" appears as a badge on the home page; "Simulator mode" appears as a trust badge on actual review records.

5. **"Sponsor" as a noun qualifier** — "Sponsor value report" (page title), various "sponsor-facing" source attribution strings, and "sponsor pack" references use internal sales-framing terminology that enterprise IT governance leads do not recognise as standard product language.

---

## 2. Terms to standardize

| Current term | Where it appears | Canonical replacement |
|---|---|---|
| `pilot` (as product adjective) | nav labels, page titles, toggle labels | `review` (e.g. "Review feedback," "Review value report") |
| `evaluation` (as product adjective) | nav labels, outcome card field labels | `review` or remove |
| `commit` (verb for reviews) | hero steps, scorecard, empty states, step tracker, permissions | `finalize` (UI copy only; API names unchanged) |
| `committed` (adj. for reviews) | scorecard KPI, subtitle | `finalized` |
| `seeded` / `seed` | source attribution, demo messages | `example` |
| `demo-derived` | AHA card badge, home page sub-caption | `example` |
| `simulator mode` | review detail trust badge | `rule-based analysis` |
| `sponsor value report` | page title | `executive value report` |
| `Azure import` | home page hero lead | `cloud connection` |
| `Connect Azure` | home page optional-setup CTA | `Connect cloud` |
| `Azure cloud connection` | nav label (legacy) | `Cloud connections` (migrate fully) |
| `during a pilot` | glossary dialog description | `in your architecture reviews` |
| `demo integrity tools` | audit trail note | remove clause |
| `demonstration` (context: workspace is active) | workspace scope error | `this session` |
| `live pilot` (governance preview note) | governance demo note | `connected workspace` |
| `Start CTO demo` | home page heading/CTA | `Open example review` |

> **`evaluation` scoping clarification (added 2026-06-30, principal-architect trial audit).** The `evaluation → review or remove` rule above applies **only to product-status adjective use** — wording that implies ArchLucid itself is pre-release / in evaluation (e.g. "Evaluation value report", "Evaluation standards"; shipped as TB-456/457/458). The word **`evaluation` is intentionally allowed as the buyer's _activity_ on marketing entry CTAs** (`/signup`, `/try`, hero — e.g. "Start an evaluation"), where it is the respectful, architect-led alternative to the sales-funnel phrase "free trial". **Do not** "fix" these back to "review".
>
> Two follow-ups:
> 1. **Do not introduce new `"evaluation workspace"` phrasing.** Known **pre-existing** usages remain and are flagged for a future cleanup pass: `app/(marketing)/pricing/page.tsx` (`signupCallToActionLabel="Request evaluation workspace"`) and `buyer-polish-copy.ts` (`BUYER_DEMO_EVALUATION_WORKSPACE_BADGE`, `BUYER_DEMO_EVALUATION_WORKSPACE_STATUS`).
> 2. **Showcase/demo package = `"sample architecture package"`** (legacy UI may still say `"sample review package"`) — dominant sample-pack framing across `SampleReviewPackageSummary`, `FrictionlessTrialLauncher`, `reviews/[runId]/error.tsx`, `/see-it`, `/live-demo`, `/demo/preview`. `"example review"` exists only as a synonym in the TB-473/474 renamed badges; keep marketing copy on `"sample"` framing rather than re-standardizing.

---

## 3. Terms to ban from buyer/operator UX

These terms must not appear in any customer-visible rendered text (page titles, headings, nav labels, CTAs, inline copy, toasts, banners, badges, empty states, sub-captions):

| Term | Reason |
|---|---|
| `seeded`, `seed (n.)` | Developer fixture language |
| `demo-derived` | Conflates example with sales-demo mode |
| `simulator mode` | Implies findings are not real |
| `demo integrity tools` | Implementation-state disclosure |
| `talk-track only` | Internal GTM language |
| `static fallback` (customer-facing) | Implementation terminology; keep presenter-only |
| `architecture run` / `run` (singular, standalone) | Legacy API name; use "architecture review" |
| `golden manifest` | Legacy artifact name; use "signed review record" |
| `pre-commit gate` (in headings/labels) | Git-metaphor vocabulary; use "approval gate" |
| `evaluation workspace` | Pre-sale framing; use "example workspace" or "sample workspace" |

---

## 4. Finding details — P0 (C01–C05)

### C01 — TB-456 · "Pilot feedback" nav label and page title

- **Symbol:** `BUYER_TERMINOLOGY.evaluationFeedback` in `buyer-surface-vocabulary.ts`
- **Current:** `"Pilot feedback"`
- **Visible at:** System-admin nav label · `/product-learning` `<h2>` page title
- **Audience:** Any `ReadAuthority` user
- **Fix:** `"Review feedback"`

### C02 — TB-457 · "Evaluation value report" breadcrumb and nav

- **Symbol:** `BUYER_TERMINOLOGY.evaluationValueReport` in `buyer-surface-vocabulary.ts`
- **Current:** `"Evaluation value report"`
- **Visible at:** `/value-report/pilot` nav label · breadcrumb (`breadcrumb-map.ts`)
- **Fix:** `"Review value report"`

### C03 — TB-458 · "Evaluation standards" on first-review outcome card

- **Symbol:** `CORE_PILOT_PATH_STREAMLINED_LABELS.evaluationStandards` in `core-pilot-path-vocabulary.ts`
- **Current:** `"Evaluation standards"`
- **Visible at:** Review detail outcome card field label for `isStreamlinedCorePilotPath` users
- **Fix:** `"Review standards"`

### C04 — TB-459 · "demo integrity tools" in production audit trail note

- **Symbol:** `AUDIT_TRAIL_INTEGRITY_NOTE` in `buyer-polish-copy.ts`
- **Current:** `"…Filter below or verify the hash chain when demo integrity tools are enabled."`
- **Visible at:** `/governance/audit` page — all operators
- **Fix:** Remove the final clause. New value: `"Append-only audit trail — every create, finalize, governance decision, and export is recorded with actor, action type, and timestamp. Filter or sort below to inspect the complete event timeline."`

### C05 — TB-460 · Azure-only cost evidence footnote in executive dashboard

- **Symbol:** `BUYER_EXECUTIVE_SUMMARY_VOCABULARY.costEvidenceNotConfiguredFootnote` in `buyer-surface-vocabulary.ts`
- **Current:** `"Add Azure cost evidence to estimate savings and ROI."`
- **Visible at:** Executive dashboard cost metric empty state
- **Fix:** `"Add cost evidence (Azure, AWS, or GCP spend data) to estimate savings and ROI."`

---

## 5. Finding details — P1 (C06–C17)

| ID | TB | Symbol / Location | Current | Fix |
|---|---|---|---|---|
| C06 | TB-461 | `PILOT_PATH_PREVIEW_STEPS[2].label` | `"Commit review package"` | `"Finalize architecture package"` |
| C07 | TB-462 | `BUYER_EXECUTIVE_SCORECARD_COMMITTED_LABEL` | `"Committed reviews"` | `"Finalized reviews"` |
| C08 | TB-463 | `BUYER_EXECUTIVE_SUMMARY_VOCABULARY` (`emptyStateDescription`, `portfolioMetricsUnavailableDescription`) | "commit…" | "finalize…" |
| C09 | TB-464 | `OPERATOR_GRAPH_PAGE_SUBTITLE` | `"committed review package"` | `"finalized architecture package"` |
| C10 | TB-465 | `PILOT_COMMAND_CENTER_LEAD` | `"…or an optional Azure import."` | `"…or an optional cloud connection."` |
| C11 | TB-466 | `PILOT_COMMAND_CENTER_CONNECT_AZURE` | `"Connect Azure"` | `"Connect cloud"` |
| C12 | TB-467 | `OPERATOR_NAV_LINK_LABELS.azureCloudConnection` | `"Azure cloud connection"` | Retire; use `cloudConnections` |
| C13 | TB-468 | `BUYER_VALUE_REPORT_PAGE_TITLE` | `"Sponsor value report"` | `"Executive value report"` |
| C14 | TB-469 | `PRODUCT_CONCEPTS_GLOSSARY_DIALOG_DESCRIPTION` | `"…during a pilot…"` | `"…in your architecture reviews…"` |
| C15 | TB-470 | `BUYER_WHY_ARCHLUCID_SPONSOR_PACK_SOURCE_LINE` | `"…the seeded Claims Intake review…"` | `"…the example Claims Intake review…"` |
| C16 | TB-471 | `BUYER_HOME_START_CTO_DEMO_HEADING` + CTA | `"Start CTO demo"` | `"Open example review"` |
| C17 | TB-472 | `BUYER_CTO_DEMO_GOVERNANCE_PREVIEW_NOTE` | `"In a live pilot, an architect…"` | `"In a connected workspace, an architect…"` |

---

## 6. Finding details — P2 and P3 (C18–C25)

| ID | TB | Sev | Symbol / Location | Current | Fix |
|---|---|---|---|---|---|
| C18 | TB-473 | P2 | `SAMPLE_REVIEW_AHA_DEMO_LABEL` | `"Demo-derived sample"` | `"Example review"` |
| C19 | TB-474 | P2 | `OPERATOR_HOME_SAMPLE_FINDINGS_DEFENSIBLE_LAYER` | `"Demo-derived sample only — labels execution mode…"` | `"Example review — not your workspace data…"` |
| C20 | TB-475 | P2 | `BUYER_SIMULATOR_TRUST_BADGE_LABEL` | `"Simulator mode — structurally identical findings…"` | `"Rule-based analysis — findings match live-mode structure…"` |
| C21 | TB-476 | P2 | `CorePilotNextStepsCard.tsx` step label | `"Commit"` | `"Finalize"` |
| C22 | TB-477 | P2 | `custom-role-permission-groups.ts` `Runs.Commit` label | `"Commit reviews"` | `"Finalize reviews"` |
| C23 | TB-478 | P2 | `SERVICE_BUS_HEALTH_LABELS.systemHealthLink` | `"System health (operators)"` | `"System health"` |
| C24 | TB-479 | P2 | `BUYER_SCOPE_LIST_UNAVAILABLE` | `"…active for the demonstration."` | `"…active for this session."` |
| C25 | TB-480 | P3 | `BUYER_CTO_DEMO_LATENCY_EXCEEDED` | `"…switch to seeded showcase"` | `"…switch to example review"` |

---

## 7. Cursor-ready patch summary

### Batch 1: P0 — three files, five string changes

```
archlucid-ui/src/lib/vocabulary/buyer-surface-vocabulary.ts
  evaluationFeedback: "Pilot feedback" → "Review feedback"
  evaluationValueReport: "Evaluation value report" → "Review value report"
  costEvidenceNotConfiguredFootnote: "Add Azure cost evidence..." → "Add cost evidence (Azure, AWS, or GCP spend data)..."

archlucid-ui/src/lib/vocabulary/core-pilot-path-vocabulary.ts
  evaluationStandards: "Evaluation standards" → "Review standards"

archlucid-ui/src/lib/buyer/buyer-polish-copy.ts
  AUDIT_TRAIL_INTEGRITY_NOTE: full replacement (remove "demo integrity tools" clause)
```

### Batch 2: P1 commit→finalize sweep

```
archlucid-ui/src/lib/buyer/buyer-polish-copy.ts
  PILOT_PATH_PREVIEW_STEPS[2].label: "Commit review package" → "Finalize architecture package"
  BUYER_EXECUTIVE_SCORECARD_COMMITTED_LABEL: "Committed reviews" → "Finalized reviews"
  OPERATOR_GRAPH_PAGE_SUBTITLE: "committed review package" → "finalized architecture package"

archlucid-ui/src/lib/vocabulary/buyer-surface-vocabulary.ts
  emptyStateDescription: "...after you commit..." → "...after you finalize..."
  portfolioMetricsUnavailableDescription: "Commit a review package..." → "Finalize an architecture package..."
```

### Batch 3: P1 Azure-first sweep

```
archlucid-ui/src/lib/buyer/buyer-polish-copy.ts
  PILOT_COMMAND_CENTER_LEAD: "...or an optional Azure import." → "...or an optional cloud connection."
  PILOT_COMMAND_CENTER_CONNECT_AZURE: "Connect Azure" → "Connect cloud"

archlucid-ui/src/lib/i18n.ts
  Migrate nav group builders from azureCloudConnection → cloudConnections
  Mark azureCloudConnection @deprecated
```

### Batch 4: P1 pilot/demo language sweep

```
archlucid-ui/src/lib/buyer/buyer-polish-copy.ts
  BUYER_VALUE_REPORT_PAGE_TITLE: "Sponsor value report" → "Executive value report"
  PRODUCT_CONCEPTS_GLOSSARY_DIALOG_DESCRIPTION: remove "during a pilot"
  BUYER_WHY_ARCHLUCID_SPONSOR_PACK_SOURCE_LINE: remove "seeded"
  BUYER_HOME_START_CTO_DEMO_HEADING + CTA: "Start CTO demo" → "Open example review"
  BUYER_CTO_DEMO_GOVERNANCE_PREVIEW_NOTE: "live pilot" → "connected workspace"
```

### Batch 5: P2 polish

```
archlucid-ui/src/lib/buyer/buyer-polish-copy.ts
  SAMPLE_REVIEW_AHA_DEMO_LABEL: "Demo-derived sample" → "Example review"
  OPERATOR_HOME_SAMPLE_FINDINGS_DEFENSIBLE_LAYER: full replacement
  BUYER_SIMULATOR_TRUST_BADGE_LABEL: "Simulator mode…" → "Rule-based analysis…"
  BUYER_SCOPE_LIST_UNAVAILABLE: "for the demonstration" → "for this session"

archlucid-ui/src/lib/i18n.ts
  SERVICE_BUS_HEALTH_LABELS.systemHealthLink: "System health (operators)" → "System health"

archlucid-ui/src/components/CorePilotNextStepsCard.tsx
  "commit" checkpoint display label → "Finalize"

archlucid-ui/src/app/(operator)/settings/roles/_sections/custom-role-permission-groups.ts
  label: "Commit reviews" → "Finalize reviews"
```

### Batch 6: P3 cleanup

```
archlucid-ui/src/lib/buyer/buyer-polish-copy.ts
  BUYER_CTO_DEMO_LATENCY_EXCEEDED: "seeded showcase" → "example review"
```

---

## 8. Conflict analysis

No conflicts found with:
- **TB-431–TB-455** (first-hour UX audit) — all 25 new findings address different copy surfaces or new dimensions of previously-touched components. Two adjacent notes: TB-454 (styling of "Connect Azure" link — complementary to C11/TB-466 which renames the label) and TB-448 (step 2 rename — complementary to C06/TB-461 which renames step 3).
- **N01–N19** (nav/IA audit) — no nav group label rename here contradicts an IA rename. N15 renamed "Integration readiness" → "Connection status" (different nav group from cloud connections); C12/TB-467 migrates the Azure cloud connection label — both operate in different parts of the nav.

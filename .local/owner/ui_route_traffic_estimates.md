> **Scope:** Page-hit frequency and owner page scores for ArchLucid UI routes.
> Base URL: `http://localhost:3000`. See [`ui_routes.md`](ui_routes.md).

# ArchLucid UI route traffic estimates

**Base URL:** `http://localhost:3000`

Source: Next.js App Router pages under archlucid-ui/src/app/ (135 page.tsx files) plus registered help topics in product-documentation-registry.ts and URL-tab surfaces (`?tab=`, `?path=`, `?archTab=`).

Method: Heuristic ordering and percentage estimates for a typical authenticated
operator tenant in steady-state production use. Percentages are relative shares
of all page hits (not unique users). Dynamic segments such as [runId] represent
the route pattern across all instances.

Page scores: comma-separated 0-100 scores. Position 1 is Evidence (traceability,
provenance, sponsor-safe citations). Additional dimensions reserved. Default 0
until the owner assigns a value.

Not included: API route handlers (/api/*), legacy redirects/rewrites (see
ui_routes.md), or off-site marketing traffic.

## Core Web Vitals field telemetry (TB-692)

The operator shell emits `WebVitalsMetric` custom events to Application Insights
when `NEXT_PUBLIC_APPINSIGHTS_CONNECTION_STRING` is configured. Metrics: **LCP**,
**CLS**, **INP**, **TTFB**, **FCP**. Dimensions include normalized `route`
(dynamic IDs collapsed), `tenantTier`, and `effectiveConnectionType`.

Example Kusto (p75 LCP by route, last 7 days):

```kusto
customEvents
| where timestamp > ago(7d)
| where name == "WebVitalsMetric"
| extend metricName = tostring(customDimensions.metricName)
| extend route = tostring(customDimensions.route)
| extend value = todouble(customDimensions.value)
| where metricName == "LCP"
| summarize p75Lcp = percentile(value, 75) by route
| order by p75Lcp desc
```

Priority routes to watch (this doc's master table): `/welcome`, `/reviews`,
`/reviews/[runId]`, `/governance/findings`.

---

**OVERALL WEIGHT SCORE:** 54.45%

## Master table (score 0 first; then Deficit desc; ties A→Z by path)

| ID | Path | Hit% | Scores | Weight | Deficit | Section | Notes |
|----|------|------|--------|--------|---------|---------|-------|
| HFX | `/help/findings` | 0.1% | 0 | 0 | 10 | Help topic | None |
| IJX | `/integrations/jira` | 0.1% | 0 | 0 | 10 | Integrations | None |
| ISN | `/integrations/slack` | 0.1% | 0 | 0 | 10 | Integrations | None |
| ITX | `/integrations/teams` | 0.1% | 0 | 0 | 10 | Integrations | None |
| REP | `/replay` | 0.1% | 0 | 0 | 10 | Marketing | None |
| SEC | `/security-trust` | 0.1% | 0 | 0 | 10 | Marketing | None |
| TXX | `/trust` | 0.1% | 0 | 0 | 10 | Marketing | None |
| SRI | `/administration/settings/users/invite-reviewer` | 0.08% | 0 | 0 | 8 | Admin | None |
| DXX | `/demo` | 0.08% | 0 | 0 | 8 | Marketing | None |
| GO | `/help/governance-approval` | 0.08% | 0 | 0 | 8 | Help topic | None |
| HR | `/help/review-guide` | 0.08% | 0 | 0 | 8 | Help topic | Canon for wizard field-reference (`REVIEW_GUIDE.md`). Absorbs former HET (`/help/starting-reviews`) registry twin + HER (`/help/creating-runs`) alias chain (TB-1258 / TB-1643; 2026-08-03). |
| ISX | `/integrations/servicenow` | 0.08% | 0 | 0 | 8 | Integrations | None |
| SVX | `/signup/verify` | 0.08% | 0 | 0 | 8 | Marketing | None |
| HBX | `/help/billing-and-plans` | 0.07% | 0 | 0 | 7 | Help topic | None |
| HP | `/help/pilot-guide` | 0.07% | 0 | 0 | 7 | Help topic | None |
| IWX | `/integrations/webhooks` | 0.07% | 0 | 0 | 7 | Integrations | None |
| SPP | `/sponsor-report/pilot-outcomes` | 0.07% | 0 | 0 | 7 | Sponsor report | Sponsor pilot outcomes report (canonical). Absorbs former VPX hit share from retired legacy `/value-report/pilot` bookmark row (LegacyPilotValueReportRedirectPage still permanentRedirects here). Does not imply CPA SOC 2 or third-party pen-test publication. |
| DPX | `/demo/preview` | 0.06% | 0 | 0 | 6 | Marketing | None |
| HE | `/help/azure-permissions` | 0.06% | 0 | 0 | 6 | Help topic | None |
| HGE | `/help/glossary` | 0.06% | 0 | 0 | 6 | Help topic | None |
| HOE | `/help/operator-auth-roles` | 0.06% | 0 | 0 | 6 | Help alias | None |
| PRC | `/product-learning` | 0.06% | 0 | 0 | 6 | Onboarding | None |
| ATD | `/admin/trial-funnel` | 0.05% | 0 | 0 | 5 | Admin | None |
| GXX | `/get-started` | 0.05% | 0 | 0 | 5 | Marketing | None |
| AD | `/governance/advisory-scans?tab=schedules` | 0.05% | 0 | 0 | 5 | Tab surface | None |
| HSX | `/help/scope` | 0.05% | 0 | 0 | 5 | Help topic | None |
| HSE | `/help/security-trust` | 0.05% | 0 | 0 | 5 | Help topic | None |
| HUX | `/help/users-and-roles` | 0.05% | 0 | 0 | 5 | Help alias | None |
| IIO | `/integrations/itsm/oauth/callback` | 0.05% | 0 | 0 | 5 | Integrations | None |
| QXX | `/quick-scan` | 0.05% | 0 | 0 | 5 | Marketing | None |
| SRH | `/showcase/[runId]` | 0.05% | 0 | 0 | 5 | Marketing | None |
| TRY | `/try` | 0.05% | 0 | 0 | 5 | Marketing | None |
| WSX | `/administration/settings/security-trust` | 0.04% | 0 | 0 | 4 | Admin | None |
| H | `/help/audit-trail` | 0.04% | 0 | 0 | 4 | Help topic | None |
| HCX | `/help/cli-usage` | 0.04% | 0 | 0 | 4 | Help topic | None |
| PRO | `/help/procurement` | 0.04% | 0 | 0 | 4 | Help topic | None |
| LXX | `/live-demo` | 0.04% | 0 | 0 | 4 | Marketing | None |
| OID | `/operate/integration-events/dlq` | 0.04% | 0 | 0 | 4 | Advisory | None |
| SEE | `/see-it` | 0.04% | 0 | 0 | 4 | Marketing | None |
| WXX | `/welcome` | 0.04% | 0 | 0 | 4 | Marketing | None |
| WHY | `/why` | 0.04% | 0 | 0 | 4 | Marketing | None |
| WH | `/why-archlucid` | 0.04% | 0 | 0 | 4 | Learning | None |
| ASU | `/auth/session-expired` | 0.03% | 0 | 0 | 3 | Auth | None |
| DEX | `/demo/explain` | 0.03% | 0 | 0 | 3 | Learning | None |
| HEX | `/help/enterprise-onboarding` | 0.03% | 0 | 0 | 3 | Help topic | None |
| HEE | `/help/evaluator-workbook` | 0.03% | 0 | 0 | 3 | Help topic | None |
| EVI | `/help/evidence-intake` | 0.03% | 0 | 0 | 3 | Help topic | None |
| EV | `/help/evidence-trail` | 0.03% | 0 | 0 | 3 | Help topic | None |
| COR | `/help/first-architecture-review` | 0.03% | 0 | 0 | 3 | Help topic | Canon Core Pilot specialty. Absorbs former HEV (`/help/evidence-only-review`) section twin (TB-1683; 2026-08-03). |
| HFE | `/help/first-hour-operator-path` | 0.03% | 0 | 0 | 3 | Help topic | None |
| FIR | `/help/first-pilot-path` | 0.03% | 0 | 0 | 3 | Help topic | None |
| PI | `/help/pilot-roi-model` | 0.03% | 0 | 0 | 3 | Help topic | None |
| HRX | `/help/repeat-review-loop` | 0.03% | 0 | 0 | 3 | Help topic | None |
| ADD | `/admin/demo-readiness` | 0.02% | 0 | 0 | 2 | Admin | None |
| ADE | `/admin/deployment-status` | 0.02% | 0 | 0 | 2 | Admin | None |
| ADC | `/administration/connection-status` | 0.02% | 0 | 0 | 2 | Admin | None |
| ADS | `/administration/settings/account-security` | 0.02% | 0 | 0 | 2 | Admin | None |
| ADI | `/administration/settings/ai-usage` | 0.02% | 0 | 0 | 2 | Admin | None |
| ADP | `/administration/settings/api-keys` | 0.02% | 0 | 0 | 2 | Admin | None |
| ADU | `/administration/settings/auth-domains` | 0.02% | 0 | 0 | 2 | Admin | None |
| ADA | `/administration/settings/baseline` | 0.02% | 0 | 0 | 2 | Admin | None |
| ABI | `/administration/settings/billing` | 0.02% | 0 | 0 | 2 | Admin | None |
| DSE | `/administration/settings/developer` | 0.02% | 0 | 0 | 2 | Admin | None |
| ADX | `/administration/settings/extract-upload` | 0.02% | 0 | 0 | 2 | Admin | None |
| AID | `/administration/settings/identity-providers` | 0.02% | 0 | 0 | 2 | Admin | None |
| SEI | `/administration/settings/identity-providers/diagnostics` | 0.02% | 0 | 0 | 2 | Admin | None |
| AOI | `/administration/settings/identity-providers/oidc` | 0.02% | 0 | 0 | 2 | Admin | None |
| ADO | `/administration/settings/identity-providers/role-mapping` | 0.02% | 0 | 0 | 2 | Admin | None |
| ASA | `/administration/settings/identity-providers/saml` | 0.02% | 0 | 0 | 2 | Admin | None |
| ASS | `/administration/settings/identity/sso-wizard` | 0.02% | 0 | 0 | 2 | Admin | None |
| AMO | `/administration/settings/model-governance` | 0.02% | 0 | 0 | 2 | Admin | None |
| ADR | `/administration/settings/preferences` | 0.02% | 0 | 0 | 2 | Admin | None |
| ASC | `/administration/settings/scim-provisioning` | 0.02% | 0 | 0 | 2 | Admin | None |
| ATE | `/administration/settings/tenant` | 0.02% | 0 | 0 | 2 | Admin | None |
| ARE | `/administration/settings/tenant/recycle-bin` | 0.02% | 0 | 0 | 2 | Admin | None |
| AR | `/architecture-intelligence` | 0.02% | 0 | 0 | 2 | Core review | None |
| ARA | `/architecture/architectures` | 0.02% | 0 | 0 | 2 | Marketing | None |
| ARR | `/architecture/architectures/[architectureId]` | 0.02% | 0 | 0 | 2 | Marketing | None |
| ANE | `/architecture/architectures/new` | 0.02% | 0 | 0 | 2 | Marketing | None |
| ARF | `/architecture/first-review-guide` | 0.02% | 0 | 0 | 2 | Onboarding | None |
| AUB | `/auth/bootstrap` | 0.02% | 0 | 0 | 2 | Auth | None |
| AUI | `/auth/invite` | 0.02% | 0 | 0 | 2 | Auth | None |
| COM | `/compliance-journey` | 0.02% | 0 | 0 | 2 | Marketing | None |
| DIB | `/digests?tab=browse` | 0.02% | 0 | 0 | 2 | Tab surface | None |
| DIX | `/digests?tab=subscriptions` | 0.02% | 0 | 0 | 2 | Tab surface | None |
| EXA | `/example-roi-bulletin` | 0.02% | 0 | 0 | 2 | Marketing | None |
| GOA | `/governance/advisory-scans?tab=scans` | 0.02% | 0 | 0 | 2 | Tab surface | None |
| GOC | `/governance/alert-rules?tab=composite` | 0.02% | 0 | 0 | 2 | Tab surface | None |
| GOR | `/governance/alert-rules?tab=rules` | 0.02% | 0 | 0 | 2 | Tab surface | None |
| GOS | `/governance/alert-rules?tab=simulation` | 0.02% | 0 | 0 | 2 | Tab surface | None |
| GOI | `/governance/alerts?tab=inbox` | 0.02% | 0 | 0 | 2 | Tab surface | None |
| GOP | `/governance/approval-queue` | 0.02% | 0 | 0 | 2 | Alerts/gov | None |
| HE. | `/help/[...topic]` | 0.02% | 0 | 0 | 2 | Help topic | None |
| HAX | `/help/accelerator-chooser` | 0.02% | 0 | 0 | 2 | Help topic | None |
| HAE | `/help/admin-diagnostics` | 0.02% | 0 | 0 | 2 | Help topic | None |
| HEA | `/help/authentication-sign-in` | 0.02% | 0 | 0 | 2 | Help topic | None |
| HEZ | `/help/azure-boards` | 0.02% | 0 | 0 | 2 | Help topic | None |
| HEC | `/help/caiq-sig-response` | 0.02% | 0 | 0 | 2 | Help topic | None |
| HEW | `/help/cloud-connections/aws` | 0.02% | 0 | 0 | 2 | Help alias | None |
| HGC | `/help/cloud-connections/gcp` | 0.02% | 0 | 0 | 2 | Help alias | None |
| CO | `/help/comparison-replay` | 0.02% | 0 | 0 | 2 | Help topic | None |
| HEO | `/help/core-pilot` | 0.02% | 0 | 0 | 2 | Help alias | None |
| HER | `/help/creating-runs` | 0.02% | 0 | 0 | 2 | Help alias | Alias → `/help/review-guide` (HR). Fold hit share into HR on next `/al-ui-tableupdate` pass (TB-1644). |
| HED | `/help/data-handling` | 0.02% | 0 | 0 | 2 | Help topic | Canon for data flow + three-layer isolation (`DATA_HANDLING.md`). Specialty HelpDataHandlingTenantIsolationGuideView mounts here. Absorbs former HDA twin (TB-1652 / TB-1658; 2026-08-03). |
| HDA | `/help/data-handling-tenant-isolation` | 0.02% | 0 | 0 | 2 | Help alias | Alias → `/help/data-handling` (HED). Fold hit share into HED on next `/al-ui-tableupdate` pass. |
| HEV | `/help/evidence-only-review` | 0.02% | 0 | 0 | 2 | Help alias | Alias → `/help/first-architecture-review` (COR), preferably `#fast-path-evidence-only`. Fold hit share into COR on next `/al-ui-tableupdate` pass. |
| EXE | `/help/executive-summary` | 0.02% | 0 | 0 | 2 | Help topic | Canon sponsor brief help. Absorbs former EPR (`/help/product-overview`) twin (TB-1739; 2026-08-04); overview + pilot sections. |
| HEI | `/help/integration-readiness` | 0.02% | 0 | 0 | 2 | Help topic | None |
| HAZ | `/help/integrations/azure-boards` | 0.02% | 0 | 0 | 2 | Help alias | None |
| HPX | `/help/path-chooser` | 0.02% | 0 | 0 | 2 | Help topic | None |
| HPE | `/help/pilot-feedback` | 0.02% | 0 | 0 | 2 | Help topic | None |
| PIL | `/help/pilot-nav-profile` | 0.02% | 0 | 0 | 2 | Help topic | None |
| POL | `/help/policy-pack-delta-demo` | 0.02% | 0 | 0 | 2 | Help topic | None |
| HPR | `/help/prior-manifest-retrieval` | 0.02% | 0 | 0 | 2 | Help topic | None |
| EPR | `/help/product-overview` | 0.02% | 0 | 0 | 2 | Help alias | Alias → `/help/executive-summary` (EXE), preferably `#what-archlucid-is`. Fold hit share into EXE on next `/al-ui-tableupdate` pass. |
| HRE | `/help/report-a-problem` | 0.02% | 0 | 0 | 2 | Help topic | None |
| HS | `/help/specialty-walkthroughs` | 0.02% | 0 | 0 | 2 | Help topic | None |
| HET | `/help/starting-reviews` | 0.02% | 0 | 0 | 2 | Help alias | Alias → `/help/review-guide` (HR) after TB-1258 canonicalize (2026-08-03). Fold hit share into HR on next `/al-ui-tableupdate` pass. |
| HEU | `/help/subprocessors` | 0.02% | 0 | 0 | 2 | Help topic | None |
| INI | `/insights/impact-preview` | 0.02% | 0 | 0 | 2 | Marketing | None |
| INP | `/insights/patterns` | 0.02% | 0 | 0 | 2 | Marketing | None |
| INA | `/insights/patterns/[patternKey]` | 0.02% | 0 | 0 | 2 | Marketing | None |
| INZ | `/integrations/azure-boards` | 0.02% | 0 | 0 | 2 | Integrations | None |
| INC | `/integrations/cloud-connections/aws` | 0.02% | 0 | 0 | 2 | Integrations | None |
| IAZ | `/integrations/cloud-connections/azure` | 0.02% | 0 | 0 | 2 | Integrations | None |
| IGC | `/integrations/cloud-connections/gcp` | 0.02% | 0 | 0 | 2 | Integrations | None |
| INR | `/internal-operations/recommendation-learning` | 0.02% | 0 | 0 | 2 | Marketing | None |
| PRB | `/privacy` | 0.02% | 0 | 0 | 2 | Marketing | None |
| RER | `/reviews/[runId]/artifacts/[artifactId]` | 0.02% | 0 | 0 | 2 | Core review | None |
| REA | `/reviews/[runId]?archTab=activity` | 0.02% | 0 | 0 | 2 | Tab surface | None |
| REC | `/reviews/[runId]?archTab=clarifications` | 0.02% | 0 | 0 | 2 | Tab surface | None |
| RED | `/reviews/[runId]?archTab=diagram` | 0.02% | 0 | 0 | 2 | Tab surface | None |
| REE | `/reviews/[runId]?archTab=evidence` | 0.02% | 0 | 0 | 2 | Tab surface | None |
| REF | `/reviews/[runId]?archTab=findings` | 0.02% | 0 | 0 | 2 | Tab surface | None |
| REO | `/reviews/[runId]?archTab=overview` | 0.02% | 0 | 0 | 2 | Tab surface | None |
| REN | `/reviews/new?path=detailed` | 0.02% | 0 | 0 | 2 | Tab surface | None |
| ENE | `/reviews/new?path=guided-intake` | 0.02% | 0 | 0 | 2 | Tab surface | None |
| REQ | `/reviews/new?path=quick-review` | 0.02% | 0 | 0 | 2 | Tab surface | None |
| SEA | `/settings/alerts` | 0.02% | 0 | 0 | 2 | Settings | None |
| SEU | `/settings/users?tab=keys` | 0.02% | 0 | 0 | 2 | Tab surface | None |
| SER | `/settings/users?tab=roles` | 0.02% | 0 | 0 | 2 | Tab surface | None |
| SSU | `/settings/users?tab=users` | 0.02% | 0 | 0 | 2 | Tab surface | None |
| SI | `/signed-records` | 0.02% | 0 | 0 | 2 | Marketing | None |
| SIM | `/signed-records/[manifestId]/artifacts/[artifactId]` | 0.02% | 0 | 0 | 2 | Marketing | None |
| RE | `/reviews` | 12% | 58 | 696 | 504 | Core review | None |
| RRE | `/reviews/[runId]` | 10.04% | 55 | 552.2 | 451.8 | Core review | Review workspace detail. Absorbs former SRN hit share from retired legacy `/snapshot/[runId]` bookmark row (SnapshotPage still redirects here with readOnly=1; showcase Claims Intake spine). Canonical leave-behind UX. Does not imply CPA SOC 2 or third-party pen-test publication. Score 55/100 — existing review-workspace Evidence; hit share folded from SRN (2026-08-03). |
| RRF | `/reviews/[runId]/findings/[findingId]` | 9% | 50 | 450 | 450 | Core review | None |
| POR | `/architecture/executive-dashboard` | 8.35% | 68 | 567.8 | 267.2 | Marketing | None |
| ACB | `/auth/callback` | 5% | 54 | 270 | 230 | Auth | None |
| ASI | `/auth/signin` | 5% | 54 | 270 | 230 | Auth | None |
| HOM | `/` | 3% | 55 | 165 | 135 | Core review | Operator Overview home - OperatorHomePageView with remounted OperatorHomePageChrome (title/refresh/PageContextualHelp -> first-architecture-review + Category-1 registry for `/`), phase-aware PilotCommandCenterCard (Do-this-next / dual-path / NBA; in-card help suppressed to avoid double icons), Recent reviews, ROI strip, sample explore, workspace context. TB-1667 HOM slice. Not a diligence Sources trail. Does not imply CPA SOC 2 or third-party pen-test publication. Score 55/100 (2026-08-03) — launcher/command center hard-caps higher Evidence. |
| AL | `/governance/alerts` | 3% | 61 | 183 | 117 | Alerts/gov | None |
| ASK | `/insights/ask-review-questions` | 4% | 78 | 312 | 88 | Marketing | None |
| GDX | `/governance/dashboard` | 1.5% | 45 | 67.5 | 82.5 | Alerts/gov | Executive Workspace Health dashboard - ExecutiveWorkspaceHealthDashboard with hero PageContextualHelp (topic map how-it-works / Workspace overview, not governance-approval), Category-1 registry, Sources follow-up strip + claim-discipline callout (scoped aggregates / planning hours, not diligence trail), DecisionsNeededSummaryCard, five KPI tiles, Bypass audit panel. Alerts topic-map honesty sibling (`/governance/alerts` -> alerts). TB-1668 GDX/alerts topic slice. Demo shell may still redirect away (BDA-107). Not a signed-record Sources trail. Does not imply CPA SOC 2 or third-party pen-test publication. Score 45/100 (2026-08-03) — aggregate KPI launcher hard-caps higher Evidence. |
| GFN | `/governance/findings` | 2% | 72 | 144 | 56 | Alerts/gov | None |
| GOV | `/governance` | 1% | 49 | 49 | 51 | Alerts/gov | None |
| SCX | `/insights/architecture-scorecard` | 1.5% | 68 | 102 | 48 | Insights | Architecture scorecard (Insights) - PilotScorecardPageView with PageContextualHelp (topic map pilot-roi-model + Category-1 registry), Sources follow-up strip + claim-discipline callout (directional ROI / not financial reporting; not diligence trail), Outcomes nav, empty CTAs (TB-1958), sample-mode honesty (TB-1957). Hierarchy polish: savings hero, primary finalized/governance tiles, operational metrics section, empty-state dashes (not large zeros), ROI calculator + estimate side-by-side, stronger Outcomes active tab. Formerly `/scorecard` and `/sponsor-report/architecture-scorecard` (retired; no redirect). Not a signed-record Sources trail. Does not imply CPA SOC 2 or third-party pen-test publication. Score 68/100 (2026-08-03) — value hierarchy improved; still aggregate KPI launcher without trends/diligence packing. |
| PLA | `/insights/planning` | 0.8% | 54 | 43.2 | 36.8 | Planning | Improvement planning - PlanningPageView with PageContextualHelp (topic map getting-started / Improvement planning; Category-1 registry), Sources follow-up strip + dismissible claim-discipline callout (derived themes/plans, not diligence trail), empty-path composition (CTA + maturity/outcome orientation; hides zero KPIs/export until plans exist), priority-score explain, themes/plans tables, export readiness. Not a signed-record Sources trail. Does not imply CPA SOC 2 or third-party pen-test publication. Score 54/100 (2026-08-03) — empty-path honesty improved; aggregate planning launcher still hard-caps higher Evidence. |
| SET | `/administration/settings` | 0.8% | 55 | 44 | 36 | Admin | None |
| HEL | `/help` | 1% | 67 | 67 | 33 | Help hub | None |
| PPP | `/planning/plans/[planId]` | 0.6% | 45 | 27 | 33 | Planning | Improvement plan detail - PlanningPlanDetailPageView with OperatorPageHeader PageContextualHelp (topic map how-it-works / Improvement planning; Category-1 registry for /planning/plans), Sources follow-up strip + claim-discipline callout (derived plan, not diligence trail), plan sections. Not a signed-record Sources trail. Does not imply CPA SOC 2 or third-party pen-test publication. Score 45/100 (2026-08-03) — plan-detail launcher hard-caps higher Evidence. |
| ERU | `/reviews/[runId]/findings/[findingId]/evidence-trace` | 0.4% | 18 | 7.2 | 32.8 | Core review | Finding evidence-trace (canonical inspector). Absorbs former RR hit share from retired legacy `/inspect` bookmark row (FindingInspectLegacyRedirectPage still permanentRedirects here). Score transferred from RR Evidence hard-cap (redirect/shim honesty). Does not imply CPA SOC 2 or third-party pen-test publication. Score 18/100 (2026-08-03) — transferred from RR. |
| DI | `/digests` | 0.6% | 46 | 27.6 | 32.4 | Digests | Architecture digests - DigestsHubClient with DigestsPageHeader PageContextualHelp (topic map how-it-works / Architecture digests; Category-1 registry), Sources follow-up strip + claim-discipline callout (scheduled summaries, not diligence trail), browse/subscriptions/schedule tabs, weekly health banner. Not a signed-record Sources trail. Does not imply CPA SOC 2 or third-party pen-test publication. Score 46/100 (2026-08-03) — digest hub launcher hard-caps higher Evidence. |
| SXX | `/insights/search-review-evidence` | 0.7% | 55 | 38.5 | 31.5 | Marketing | None |
| ADY | `/administration/system-health` | 0.5% | 48 | 24 | 26 | Admin | Administration System health hub - SystemHealthPageView with PageContextualHelpButton (topic map troubleshooting; Category-1 registry), Sources follow-up strip + claim-discipline callout (operational readiness, not diligence trail), live/ready dependency checks, build identity, demo-safe buyer shell variant. Canonical path /administration/system-health (legacy /health on HXX). Not a signed-record Sources trail. Does not imply CPA SOC 2 or third-party pen-test publication. Score 48/100 (2026-08-03) — operational readiness launcher hard-caps higher Evidence. |
| RNX | `/reviews/new` | 0.5% | 48 | 24 | 26 | Core review | Start review intake - ReviewsNewPageChrome with OperatorPageHeader PageContextualHelpButton (topic map evidence-intake / Start review; Category-1 registry), Sources follow-up strip + claim-discipline callout (intake only, not diligence trail), path switcher wizards. Not a signed-record Sources trail. Does not imply CPA SOC 2 or third-party pen-test publication. Score 48/100 (2026-08-03) — intake wizard launcher hard-caps higher Evidence. |
| AUD | `/governance/audit` | 0.5% | 55 | 27.5 | 22.5 | Alerts/gov | Governance audit trail - AuditPageView with AuditPageHeader PageContextualHelpButton (topic map audit-trail; Category-1 registry), Sources follow-up strip + claim-discipline callout (activity log, not diligence pack), search/filters, integrity export/verify when available. Not a signed-record Sources trail by itself. Does not imply CPA SOC 2 or third-party pen-test publication. Score 55/100 (2026-08-03) — activity-log Evidence hard-caps without signed-record package. |
| GPP | `/governance/policy-packs` | 0.4% | 48 | 19.2 | 20.8 | Alerts/gov | None |
| GPI | `/governance/policy-packs/[id]` | 0.3% | 48 | 14.4 | 15.6 | Alerts/gov | Policy pack detail - PolicyPackDetailClient with PolicyPackDetailEvidenceChrome (PageContextualHelpButton; topic map governance-approval / Policy packs; Category-1 registry), Sources follow-up strip + claim-discipline callout (pack rules, not diligence trail), specialty/generic pack narratives. Not a signed-record Sources trail. Does not imply CPA SOC 2 or third-party pen-test publication. Score 48/100 (2026-08-03) — pack narrative launcher hard-caps higher Evidence. |
| GDO | `/governance/decision-register` | 0.3% | 50 | 15 | 15 | Alerts/gov | Decision register - DecisionRegisterClient with OperatorPageHeader PageContextualHelpButton (topic map how-it-works / Decision register, not governance-approval catch-all), Category-1 registry, Sources follow-up strip + claim-discipline callout (register browse, not diligence pack), filters/summary/cards/timeline. Not a signed-record Sources trail by itself. Does not imply CPA SOC 2 or third-party pen-test publication. Score 50/100 (2026-08-03) — register browse hard-caps without per-decision signed-record package. |
| P | `/pricing` | 0.25% | 42 | 10.5 | 14.5 | Marketing | Pricing (Marketing) - PricingPageHero + tier grid/FAQ/quote with PricingEvidenceOrientationStrip (evaluation Sources + claim-discipline: commercial packaging only; not diligence / CPA SOC 2 / third-party pen-test). Not an operator PageContextualHelp surface. Does not imply CPA SOC 2 or third-party pen-test publication. Score 42/100 (2026-08-03) - marketing commercial page hard-caps higher Evidence. |
| SCE | `/integrations/cloud-connections` | 0.25% | 50 | 12.5 | 12.5 | Integrations | Cloud connections (Integrations) - landing hub with PageContextualHelpButton (topic map cloud-connections; Category-1 registry), workspace Sources + claim-discipline orientation strip, platform scope panel, provider summary cards + evidence-only upload. Legacy /settings/cloud-connections redirects here. Not a signed-record Sources trail by itself. Does not imply CPA SOC 2 or third-party pen-test publication. Score 50/100 (2026-08-03) - connection-hub hard-caps higher Evidence. |
| CXX | `/insights/compare-two-reviews` | 0.25% | 52 | 13 | 12 | Insights | Compare two reviews (Insights) - CompareForm with OperatorPageHeader PageContextualHelpButton (topic map comparison-replay; Category-1 registry), workspace Sources + claim-discipline orientation strip, pair Cite Sources after Compare (ComparePairEvidenceCiteStrip), run pickers/results. Formerly /compare (retired; no redirect). Not a signed-record Sources trail by itself. Does not imply CPA SOC 2 or third-party pen-test publication. Score 52/100 (2026-08-03) — directional-diff launcher hard-caps higher Evidence. |
| SIG | `/signup` | 0.2% | 40 | 8 | 12 | Marketing | Signup (Marketing) - evaluation start with SignupForm or SignupAccessRequestPanel, SignupEvidenceOrientationStrip (evaluation Sources + claim-discipline: evaluation access only; not diligence / CPA SOC 2 / third-party pen-test). Not an operator PageContextualHelp surface. Does not imply CPA SOC 2 or third-party pen-test publication. Score 40/100 (2026-08-03) - marketing evaluation-access page hard-caps higher Evidence. |
| GRO | `/governance/risk-exceptions` | 0.3% | 62 | 18.6 | 11.4 | Alerts/gov | None |
| RRP | `/reviews/[runId]/provenance` | 0.25% | 55 | 13.75 | 11.25 | Core review | Run provenance (Core review) - ProvenancePageWorkspace with PageContextualHelpButton (topic map evidence-trail; Category-1 registry via /provenance path match), workspace Sources + claim-discipline orientation strip, graph/timeline/table views. Coordinator linkage for one run — not a full diligence Sources export alone. Does not imply CPA SOC 2 or third-party pen-test publication. Score 55/100 (2026-08-03) - coordinator provenance hard-caps higher Evidence without diligence export packing. |
| ALE | `/governance/alert-rules?tab=routing` | 0.2% | 48 | 9.6 | 10.4 | Tab surface | Alert rules Notifications/routing tab (Tab surface) - AlertRoutingContent with hub PageContextualHelpButton (topic map alerts), workspace Sources + claim-discipline orientation strip when ?tab=routing. Delivery destinations only — not diligence Sources. Sibling SAX/GOA = hub; Conditions/Advanced/Test tabs are separate rows. Does not imply CPA SOC 2 or third-party pen-test publication. Score 48/100 (2026-08-03) - tab-surface delivery config hard-caps higher Evidence. |
| SPE | `/sponsor-report/executive-summary` | 0.22% | 55 | 12.1 | 9.9 | Sponsor report | Sponsor executive summary (Sponsor report) - ValueReportPageClient/View with PageContextualHelpButton (topic map executive-summary; Category-1 registry on /sponsor-report + /value-report), workspace Sources + claim-discipline orientation strip, period preview/exports, Outcomes nav. Absorbs former VXX hit share from retired legacy `/value-report` bookmark row (LegacyValueReportRedirectPage still permanentRedirects here). Period summary — not a signed-record Sources trail alone. Does not imply CPA SOC 2 or third-party pen-test publication. Score 55/100 (2026-08-03) - sponsor period-summary hard-caps higher Evidence without diligence packing. |
| HGX | `/help/getting-started` | 0.2% | 52 | 10.4 | 9.6 | Help topic | Getting started help (Help topic) - HelpGettingStartedGuideView with PageContextualHelpButton (topic map getting-started; Category-1 registry), workspace Sources + claim-discipline orientation, quick-start CTAs, workflow stepper, vocabulary. Orientation guide — not a signed-record Sources trail. Does not imply CPA SOC 2 or third-party pen-test publication. Score 52/100 (2026-08-03) - help-topic orientation hard-caps higher Evidence. |
| SAX | `/governance/alert-rules` | 0.15% | 48 | 7.2 | 7.8 | Alerts/gov | Alert rules hub (Alerts/gov) - AlertRulesHubClient with PageContextualHelpButton (topic map alerts; Category-1 registry), workspace Sources + claim-discipline orientation strip on non-routing tabs (Notifications keeps AlertRoutingEvidenceOrientationStrip for GOR), Conditions/Notifications/Advanced/Test tabs. Alert configuration - not a signed-record Sources trail. Sibling GOR = routing tab; GOA = low-hit hub duplicate in template. Does not imply CPA SOC 2 or third-party pen-test publication. Score 48/100 (2026-08-03) - alert-config hub hard-caps higher Evidence. |
| GRS | `/governance/standards-and-rules` | 0.15% | 48 | 7.2 | 7.8 | Alerts/gov | None |
| GRX | `/governance/recurrence-schedules` | 0.2% | 62 | 12.4 | 7.6 | Alerts/gov | None |
| AUX | `/administration/settings/users` | 0.15% | 50 | 7.5 | 7.5 | Admin | Users and roles (Settings/Admin) - SettingsRolesPageView with PageContextualHelpButton (topic map users-and-roles; Category-1 registry), workspace Sources + claim-discipline orientation strip, Users/Roles/API-keys tabs, invite + matrix. Access configuration — not a signed-record Sources trail. Does not imply CPA SOC 2 or third-party pen-test publication. Score 50/100 (2026-08-03) — access-hub hard-caps higher Evidence. |
| ADV | `/governance/advisory-scans` | 0.15% | 50 | 7.5 | 7.5 | Advisory | Advisory scans hub (Governance) - AdvisoryHubClient with PageContextualHelpButton (Category-1 registry), workspace Sources + claim-discipline orientation strip, Scans/Schedules tabs, recommendation generate + schedules. Follow-up recommendations - not a signed-record Sources trail. Sibling AD = Schedules tab deep link. Does not imply CPA SOC 2 or third-party pen-test publication. Score 50/100 (2026-08-03) - recommendation-launcher hard-caps higher Evidence. |
| FXX | `/faq` | 0.12% | 40 | 4.8 | 7.2 | Marketing | Product FAQ (Marketing) - MarketingFaqPageClient with FaqEvidenceOrientationStrip (evaluation Sources + claim-discipline: evaluation orientation only; not diligence / CPA SOC 2 / third-party pen-test), searchable FAQ categories, Pricing/Security CTAs. Not an operator PageContextualHelp surface. Does not imply CPA SOC 2 or third-party pen-test publication. Score 40/100 (2026-08-03) - marketing FAQ hard-caps higher Evidence. |
| HCE | `/help/cloud-connections` | 0.15% | 52 | 7.8 | 7.2 | Help topic | Cloud connections help (Help topic) - HelpCloudConnectionsGuideView with PageContextualHelpButton (topic map cloud-connections; Category-1 registry), workspace Sources + claim-discipline orientation, hub/Azure CTAs, curated CLOUD_CONNECTIONS.md body. Orientation guide - not a signed-record Sources trail. Sibling HC = Azure secure-connect alias. Does not imply CPA SOC 2 or third-party pen-test publication. Score 52/100 (2026-08-03) - help-topic orientation hard-caps higher Evidence. |
| FI | `/help/first-review` | 0.18% | 61 | 10.98 | 7.02 | Help topic | Specialty first-run evidence checklist (Admin internal-runbook) - HelpFirstReviewEvidenceChecklistGuideView with first-architecture-review / Start architecture review / audit primary CTAs, Sources diligence strip (complete review workflow, Azure connect, audit-trail, troubleshooting, configuration-reference), evidence arc, claim-discipline callout (checklist is not certification), PageContextualHelp, and prepared FIRST_RUN_EVIDENCE_CHECKLIST.md (API/runbook/script leakage strip). Not bare HelpTopicMarkdownView. Admin-gated internal Help Center tier. Not a redirect to buyer core-pilot. Does not imply CPA SOC 2 or third-party pen-test publication. |
| GAI | `/governance/approval-requests/[id]/lineage` | 0.15% | 55 | 8.25 | 6.75 | Alerts/gov | Approval lineage (Alerts/gov) - GovernanceApprovalLineageDetailContent with PageContextualHelpButton (topic map governance-approval; Category-1 registry on /governance/approval-requests), workspace Sources + claim-discipline orientation strip, approval status/risk, review + signed-record version links, findings/completeness. Governance linkage view - not a full diligence Sources package alone. Does not imply CPA SOC 2 or third-party pen-test publication. Score 55/100 (2026-08-03) - lineage linkage hard-caps higher Evidence without audit export depth. |
| ATX | `/admin/tenant-health` | 0.12% | 45 | 5.4 | 6.6 | Admin | Tenant health (Admin) - TenantHealthAdminPageClient with PageContextualHelpButton (topic map troubleshooting; Category-1 registry), workspace Sources + claim-discipline orientation strip, engagement/governance/funnel table. Internal CS engagement scores - not a signed-record Sources trail. Does not imply CPA SOC 2 or third-party pen-test publication. Score 45/100 (2026-08-03) - admin KPI hub hard-caps higher Evidence. |
| MMX | `/signed-records/[manifestId]` | 0.15% | 58 | 8.7 | 6.3 | Marketing | Signed review record detail (Marketing/owner section) - ManifestDetailPageView with PageContextualHelpButton (topic map review-packages; Category-1 registry on /signed-records), workspace Sources + claim-discipline orientation strip, summary/decisions/artifacts/bundle downloads, OperatorEvidenceLimitsFooter. Application-layer package lineage - not CPA SOC 2 or third-party pen-test publication. Score 58/100 (2026-08-03) - package detail hard-caps higher Evidence without Trust Center attestation artifacts. |
| DIS | `/digests?tab=schedule` | 0.12% | 48 | 5.76 | 6.24 | Tab surface | Digests Schedule tab (Tab surface) - ExecDigestScheduleContent with hub DigestsPageHeader PageContextualHelp (topic map getting-started / Architecture digests; Category-1 registry), DigestsScheduleEvidenceOrientationStrip (Sources + claim-discipline) when ?tab=schedule. Delivery cadence only — not diligence Sources. Sibling DI = hub; DIB = browse; DIX = subscriptions. Hit share folded from a retired mistaken schedule bookmark row (legacy settings exec-digest IDs remain removed — do not reintroduce). Does not imply CPA SOC 2 or third-party pen-test publication. Score 48/100 (2026-08-03) — schedule-config tab hard-caps higher Evidence. |
| SPR | `/sponsor-report/roi-summary` | 0.12% | 50 | 6 | 6 | Sponsor report | Sponsor ROI summary report (canonical). Absorbs former VRX hit share from retired legacy `/value-report/roi` bookmark row (LegacyRoiSummaryRedirectPage still permanentRedirects here). Does not imply CPA SOC 2 or third-party pen-test publication. Score 50/100 — transferred from VRX Evidence hard-cap; hit share folded from VRX (2026-08-03). |
| HC | `/help/cloud-connections/azure` | 0.12% | 52 | 6.24 | 5.76 | Help alias | Connect Azure securely help (Help alias) - HelpConnectAzureSecurelyGuideView with PageContextualHelpButton (topic map cloud-connections-azure; Category-1 registry), workspace Sources + claim-discipline orientation strip, federation/roles setup, configure CTA. Sibling HCE = parent cloud-connections help; HCA = low-hit template duplicate. Orientation guide - not a signed-record Sources trail. Does not imply CPA SOC 2 or third-party pen-test publication. Score 52/100 (2026-08-03) - help-topic orientation hard-caps higher Evidence. |
| HHX | `/help/how-it-works` | 0.12% | 52 | 6.24 | 5.76 | Help topic | How ArchLucid works help (Help topic) - HelpHowArchLucidWorksGuideView with PageContextualHelpButton (topic map how-it-works; Category-1 registry), workspace Sources + claim-discipline orientation strip, workflow diagram, get-started CTAs. Orientation guide - not a signed-record Sources trail. Related HGX = Getting started. Does not imply CPA SOC 2 or third-party pen-test publication. Score 52/100 (2026-08-03) - help-topic orientation hard-caps higher Evidence. |
| HTX | `/help/troubleshooting` | 0.12% | 52 | 6.24 | 5.76 | Help topic | Troubleshooting help (Help topic) - HelpTroubleshootingGuideView with PageContextualHelpButton (topic map troubleshooting; Category-1 registry), workspace Sources + claim-discipline orientation strip, start-here CTAs, common issues, advanced diagnostics. Operator unblocking guide — not a signed-record Sources trail. Does not imply CPA SOC 2 or third-party pen-test publication. Score 52/100 (2026-08-03) — help-topic orientation hard-caps higher Evidence. |
| AHX | `/admin/health` | 0.15% | 62 | 9.3 | 5.7 | Admin | None |
| ESX | `/executive/scorecard` | 0.1% | 48 | 4.8 | 5.2 | Executive | Sponsor scorecard (Executive) - ExecutiveScorecardClient with PageContextualHelpButton (topic map executive-summary; Category-1 registry), workspace Sources + claim-discipline orientation strip, time-range KPIs, recommended actions. Sponsor KPI leave-behind — not a signed-record Sources trail. Sibling SCX = Insights architecture scorecard; SPE = sponsor executive summary. Does not imply CPA SOC 2 or third-party pen-test publication. Score 48/100 (2026-08-04) — executive KPI hub hard-caps higher Evidence. |
| HA | `/help/alerts` | 0.1% | 52 | 5.2 | 4.8 | Help topic | Alerts help (Help topic) - HelpAlertsGuideView with PageContextualHelpButton (topic map alerts; Category-1 registry), workspace Sources + claim-discipline orientation strip, go-to-alerts CTAs, how-alerts-work stepper, workspace readiness strip. Operator orientation guide — not a signed-record Sources trail. Sibling AL = alerts inbox; SAX = alert rules hub. Does not imply CPA SOC 2 or third-party pen-test publication. Score 52/100 (2026-08-04) — help-topic orientation hard-caps higher Evidence. |
| GRA | `/insights/evidence-graph` | 0.6% | 93 | 55.8 | 4.2 | Insights | Evidence graph (Insights) — GraphPageContent buyer workspace: Graph view default + URL presentation, auto-load on review select / demo sample auto-pick, process-graph canvas as hero (~88vh) with wider inspector, selection focus dimming, path breadcrumb, Fit/100%/Highlight/Focus/Reset toolbar, compact sample banner, idle teaching frame (GraphIdleLegend). Trace table remains alternate. Signature evidence↔finding↔decision↔approval trail — not a full diligence Sources export package alone. Does not imply CPA SOC 2 or third-party pen-test publication. Score 93/100 (2026-08-03) — post workspace-hero pass; remaining gap is lifecycle count-strip + denser diligence packing. |
| ACX | `/admin/configuration` | 0.1% | 62 | 6.2 | 3.8 | Admin | None |
| ARX | `/admin/rag-health` | 0.1% | 62 | 6.2 | 3.8 | Admin | None |
| GFX | `/governance/setup` | 0.1% | 62 | 6.2 | 3.8 | Alerts/gov | Governance setup guide — GovernanceSetupGuidePageView with outcome-framed steps, progress coach, sticky What-this-guide-unlocks rail (not Pending theater), foundation panel after first complete indicator (TB-1138), recommended-next primary CTA (TB-1137). Links into audited config workspaces. Not a signed-record Sources trail. Does not imply CPA SOC 2 or third-party pen-test publication. Score 62/100 (2026-08-03) — setup checklist with value framing; guide hard-caps without live config depth. |
| AFX | `/admin/fleet-llm-cogs` | 0.05% | 35 | 1.75 | 3.25 | Admin | None |
| APX | `/admin/pricing-quote-aging` | 0.05% | 45 | 2.25 | 2.75 | Admin | None |
| AEX | `/admin/evidence-proposals` | 0.05% | 50 | 2.5 | 2.5 | Admin | None |
| AII | `/admin/integrations/itsm` | 0.08% | 78 | 6.24 | 1.76 | Admin | None |
| HDX | `/help/developer-troubleshooting` | 0.04% | 56 | 2.24 | 1.76 | Help topic | Specialty engineering troubleshooting runbook (Admin internal-runbook, TB-1246) - HelpEngineeringTroubleshootingGuideView with Customer Troubleshooting / System health / Report a problem / CLI primary CTAs, Sources diligence strip (admin-diagnostics, configuration-reference), claim-discipline callout, PageContextualHelp, HelpTopicAuthorityGate + HelpTopicMarkdownClient specialty branch, and prepared TROUBLESHOOTING.md + COMMON_ERRORS.md (contributor ADR/TB link strip). Help search Advanced diagnostics (adminOnly). Not in customer Help Center featured grid. Customer Troubleshooting (HTX) does not deep-link here (TB-1249). Slug remains developer-troubleshooting pending TB-1248 rename. Does not imply CPA SOC 2 or third-party pen-test publication. |
| HXX | `/health` | 0.02% | 18 | 0.36 | 1.64 | Marketing | Deprecated operator bookmark — merged to Administration System health on ADY (`/administration/system-health`). Redirect/shim hard-caps Evidence. |
| ASX | `/administration/settings/support` | 0.12% | 87 | 10.44 | 1.56 | Admin | Support workspace — AdminSupportPageView: Preferred-path Report a problem (accent border + StatusTag), short subtitle, mono email token + Copy, checklist What-to-include, full-card Common next steps, Support bundle trust chips + DESIGN_TOKENS.callout.success safety (no pastel emerald / fake SLA banner), sticky bundle panel. Contact + redacted diagnostics — not a signed-record Sources trail. Does not imply CPA SOC 2 or third-party pen-test publication. Score 87/100 (2026-08-03) — post hierarchy/trust polish; remaining gap is live Report problem CTA on this page vs help deep-link only. |
| HEF | `/help/first-value-20-minutes` | 0.04% | 61 | 2.44 | 1.56 | Help topic | Specialty Admin 20-minute first-value runbook - HelpFirstValue20GuideView with first-architecture-review / Start architecture review / Troubleshooting primary CTAs, Sources diligence strip (complete review workflow, first-review checklist, configuration-reference), job-matrix IA dual (TB-1694), orientation steps, claim-discipline callout, PageContextualHelp, and prepared FIRST_PILOT_OPERATOR_PATH.md 20-min section only (TB-1691 sectionAnchors + TB-1693 leakage strip). Title honesty Admin runbook (TB-1695). Not bare HelpTopicMarkdownView. Admin-gated internal-runbook. Not the default customer help path. Does not imply CPA SOC 2 or third-party pen-test publication. |
| HG | `/help/governance-api-contracts` | 0.03% | 60 | 1.8 | 1.2 | Help topic | Specialty Admin API contracts technical reference - HelpApiContractsGuideView with CLI / configuration-reference / buyer governance-approval primary CTAs, Sources strip (eng troubleshooting, audit-trail, admin-diagnostics), orientation + claim-discipline callout, PageContextualHelp, and prepared API_CONTRACTS.md (TB-1388 contributor strip). Title honesty API contracts not Governance FAQ (TB-1386). Admin-gated internal-runbook (TB-1384); de-indexed from product search (TB-1385); buyer Findings/Governance deep-links retargeted (TB-1387). Alias /help/api-contracts. Not bare HelpTopicMarkdownView. Does not imply CPA SOC 2 or third-party pen-test publication. |
| CON | `/help/configuration-reference` | 0.03% | 62 | 1.86 | 1.14 | Help topic | Specialty configuration reference (Admin internal-runbook) - HelpConfigurationReferenceGuideView with SSO wizard / identity-providers / API-keys / configuration-summary primary CTAs, Sources strip (authentication-sign-in, users-and-roles, enterprise-onboarding, cloud-connections, security-trust, data-handling-tenant-isolation), task sections, claim-discipline callout, PageContextualHelp, collapsed Admin key-catalog appendix, and prepared CONFIGURATION_REFERENCE.md (TB-1327 leakage strip + TB-1330 in-app-only links). Not bare HelpTopicMarkdownView. Admin-gated until catalog remains eng appendix (TB-1329 option b). Does not imply CPA SOC 2 or third-party pen-test publication. |
| AXX | `/accessibility` | 0.02% | 44 | 0.88 | 1.12 | Marketing | None |
| REV | `/help/review-packages` | 0.03% | 65 | 1.95 | 1.05 | Help topic | Reviews / architecture packages help - HelpReviewPackagesGuideView with informative when-to-use summary (vs Findings / Evidence graph / Review guide), Architecture package definition callout (DESIGN_TOKENS.callout.info), Getting started five-step workflow, prepared REVIEW_PACKAGES_OPERATOR_GUIDE.md body (contents / locate / inspect tabs / export intact), compact HelpRelatedGuideCards (review-guide, evidence-intake, findings, evidence-trail, governance-approval). Shared HELP_PAGE_LAYOUT rhythm. Not a signed-record Sources trail by itself. Does not imply CPA SOC 2 or third-party pen-test publication. Score 65/100 (2026-08-03) — polished package-orientation help; help-topic hard-cap without live package diligence surface. |
| REG | `/reviews/[runId]?archTab=governance` | 0.02% | 60 | 1.2 | 0.8 | Tab surface | Create-home-only archTab (TB-1856) - mounts on ArchitectureCreatedWorkspace when fromGeneration+create-architecture and no signed manifest; ignored on committed ReviewDetailWorkspace (twin: reviewTab=decisions-remediation). RunDetailGovernanceDecisionSection pre-commit honesty (TB-1857) with one primary Review findings CTA (TB-1859), secondary activity text link, Sources diligence strip (governance-approval, audit-trail, findings, search-review-evidence, compare-two-reviews), claim-discipline callout, and sponsor/work-item panels gated on manifestId (TB-1858). Not a live approval/audit surface. Does not imply CPA SOC 2 or third-party pen-test publication. |
| HES | `/help/soc2-self-assessment` | 0.02% | 61 | 1.22 | 0.78 | Help topic | Specialty SOC 2 self-assessment guide - HelpSoc2SelfAssessmentGuideView with Trust Center / CAIQ-SIG / procurement primary CTAs, Sources diligence strip (security-trust, DPA, subprocessors, tenant-isolation), job-matrix IA dual (TB-1749), orientation steps, claim-discipline callout (self-assessment is not CPA Type I/II; Type I dates illustrative), PageContextualHelp, and prepared SOC2_SELF_ASSESSMENT_2026.md (TB-1747 leakage strip + TB-1748 roadmap honesty). Title + Help Center product discovery (TB-1750). Not bare HelpTopicMarkdownView. Does not imply CPA SOC 2 or third-party pen-test publication. Score 61/100 (2026-08-03) — honesty ladder caps higher. |
| HDP | `/help/dpa-template` | 0.02% | 63 | 1.26 | 0.74 | Help topic | Specialty DPA negotiation template guide - HelpDpaTemplateGuideView with Trust Center / subprocessors / procurement primary CTAs, Sources diligence strip (security-trust, data-handling, tenant-isolation), orientation steps, claim-discipline callout (template is not countersigned; SOC 2 when available is not CPA attestation), PageContextualHelp, and full DPA_TEMPLATE.md deferred behind collapsed disclosure (TB-1676/1678/1680). TB-1677 leakage strip retained. Help Center product tier + advanced discovery (TB-1679). Not bare HelpTopicMarkdownView. Does not imply CPA SOC 2 or third-party pen-test publication. |
| 4XX | `/403` | 0.02% | 76 | 1.52 | 0.48 | Auth | None |

---

## Frequency rationale

| Area | Share | Rationale |
|------|-------|-----------|
| Reviews + findings | ~40% | Core value loop |
| Dashboard + home | ~11% | Daily landing pages |
| Auth | ~10% | Session sign-in + callback |
| Ask | ~4% | Repeat AI queries per session |
| Alerts / governance | ~9% | Second major workflow |
| Help (aggregate) | ~3% | Onboarding and unfamiliar flows |
| Settings | ~2.5% | Cloud connections and billing |
| Admin | <1% | Superadmin-only |
| Marketing | <2% | Pre-login visitor traffic |

---

## Maintenance

When routes or help topics change: update ui_routes.md, refresh help slugs from
product-documentation-registry.ts, and re-rank if telemetry shifts. Set page
scores only when the owner provides values; leave 0 otherwise.

**Related docs:**

- [`ui_routes.md`](ui_routes.md) GÇö route catalog and demo tiers
- [`NAV_CONFIG_CONTRACT.md`](../../archlucid-ui/docs/NAV_CONFIG_CONTRACT.md)
- [`PRODUCT_DOCUMENTATION_PRESENTATION.md`](../library/PRODUCT_DOCUMENTATION_PRESENTATION.md)

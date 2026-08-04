> **Scope:** Page-hit frequency and owner page scores for ArchLucid UI routes.
> Base URL: `http://localhost:3000`. See [`ui_routes.md`](ui_routes.md).

# ArchLucid UI route traffic estimates

**Base URL:** `http://localhost:3000`

Source: Next.js App Router pages under archlucid-ui/src/app/ (142 page.tsx files) plus registered help topics in product-documentation-registry.ts and URL-tab surfaces (`?tab=`, `?path=`, `?archTab=`).

Method: Heuristic ordering and percentage estimates for a typical authenticated
operator tenant in steady-state production use. Percentages are relative shares
of all page hits (not unique users). Dynamic segments such as [runId] represent
the route pattern across all instances.

Page scores: comma-separated 0-100 scores. Position 1 is Evidence (traceability,
provenance, sponsor-safe citations). Additional dimensions reserved. Default 0
until the owner assigns a value. Row Weight is Hit% × Evidence score.
Row Deficit is Hit% × (100 − Evidence score).
OVERALL WEIGHT SCORE is that sum expressed as a percentage of the maximum
possible (Hit% × 100 per row).

Master table sort key: rows with score 0 appear before scored rows; within each group, sort by Deficit (descending); ties A→Z by path. Weight column is Hit% × Scores. Deficit column is Hit% × (100 − Scores). OVERALL WEIGHT SCORE is the sum of row Weight values expressed as a percentage of the maximum possible (Hit% × 100 per row). ID column: unique shorthand of at most three capital letters per row.

Not included: API route handlers (/api/*), legacy redirects/rewrites (see
ui_routes.md; e.g. `/alert-routing` → `/governance/alert-rules?tab=routing`, traffic **AL2** / **TB-1443**), or off-site marketing traffic.

## Core Web Vitals field telemetry (TB-692)

The architect workspace emits `WebVitalsMetric` custom events to Application Insights
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

**Before the next UI bundle cut:** follow [`FIELD_WEB_VITALS_TRIAGE.md`](../runbooks/FIELD_WEB_VITALS_TRIAGE.md) (**TB-2031**) so p75 LCP/INP/TTFB maps to the right backlog cluster (JS vs network vs interaction).

---

**OVERALL WEIGHT SCORE:** 0.00%

## Master table (score 0 first; then Deficit desc; ties A→Z by path)

| ID | Path | Hit% | Scores | Weight | Deficit | Section | Notes |
|----|------|------|--------|--------|---------|---------|-------|
| RE | `/reviews` | 12% | 0 | 0 | 1200 | Core review | None |
| RRE | `/reviews/[runId]` | 10.04% | 0 | 0 | 1004 | Core review | Review workspace detail. Absorbs former SRN hit share from retired legacy `/snapshot/[runId]` bookmark row (SnapshotPage still redirects here with readOnly=1; showcase Claims Intake spine). Canonical leave-behind UX. Does not imply CPA SOC 2 or third-party pen-test publication. |
| RRF | `/reviews/[runId]/findings/[findingId]` | 9% | 0 | 0 | 900 | Core review | None |
| DSH | `/dashboard` | 8% | 0 | 0 | 800 | Core review | Deprecated operator bookmark — merged to canonical executive dashboard on **ARE** (`/architecture/executive-dashboard`, TB-608). |
| ACB | `/auth/callback` | 5% | 0 | 0 | 500 | Auth | None |
| ASI | `/auth/signin` | 5% | 0 | 0 | 500 | Auth | None |
| ASK | `/insights/ask-review-questions` | 4% | 0 | 0 | 400 | Core review | Formerly `/ask` (retired; no redirect). |
| HOM | `/` | 3% | 0 | 0 | 300 | Core review | Operator Overview home - OperatorHomePageView with remounted OperatorHomePageChrome (title/refresh/PageContextualHelp -> first-architecture-review + Category-1 registry for `/`), phase-aware PilotCommandCenterCard (Do-this-next / dual-path / NBA; in-card help suppressed to avoid double icons), Recent reviews, ROI strip, sample explore, workspace context. TB-1667 HOM slice. Not a diligence Sources trail. Does not imply CPA SOC 2 or third-party pen-test publication. |
| AL | `/governance/alerts` | 3% | 0 | 0 | 300 | Alerts/gov | None |
| GFN | `/governance/findings` | 2% | 0 | 0 | 200 | Alerts/gov | None |
| GDX | `/governance/dashboard` | 1.5% | 0 | 0 | 150 | Alerts/gov | Executive Workspace Health dashboard - ExecutiveWorkspaceHealthDashboard with hero PageContextualHelp (topic map getting-started / Workspace overview, not governance-approval), Category-1 registry, Sources follow-up strip + claim-discipline callout (scoped aggregates / planning hours, not diligence trail), DecisionsNeededSummaryCard, five KPI tiles, Bypass audit panel. Alerts topic-map honesty sibling (`/governance/alerts` -> alerts). TB-1668 GDX/alerts topic slice. Demo shell may still redirect away (BDA-107). Not a signed-record Sources trail. Does not imply CPA SOC 2 or third-party pen-test publication. |
| SCX | `/insights/architecture-scorecard` | 1.5% | 0 | 0 | 150 | Insights | Architecture scorecard (Insights) - PilotScorecardPageView with PageContextualHelp (topic map pilot-roi-model + Category-1 registry), Sources follow-up strip + claim-discipline callout (directional ROI / not financial reporting; not diligence trail), Outcomes nav, empty CTAs (TB-1958), sample-mode honesty (TB-1957). Hierarchy polish: savings hero, primary finalized/governance tiles, operational metrics section, empty-state dashes (not large zeros), ROI calculator + estimate side-by-side, stronger Outcomes active tab. Formerly `/scorecard` and `/sponsor-report/architecture-scorecard` (retired; no redirect). Not a signed-record Sources trail. Does not imply CPA SOC 2 or third-party pen-test publication. Score 68/100 (2026-08-03) — value hierarchy improved; still aggregate KPI launcher without trends/diligence packing. |
| GOV | `/governance` | 1% | 0 | 0 | 100 | Alerts/gov | None |
| HEL | `/help` | 1% | 0 | 0 | 100 | Help hub | None |
| PLA | `/insights/planning` | 0.8% | 0 | 0 | 80 | Planning | Improvement planning - PlanningPageView with PageContextualHelp (topic map getting-started / Improvement planning; Category-1 registry), Sources follow-up strip + dismissible claim-discipline callout (derived themes/plans, not diligence trail), empty-path composition (CTA + maturity/outcome orientation; hides zero KPIs/export until plans exist), priority-score explain, themes/plans tables, export readiness. Not a signed-record Sources trail. Does not imply CPA SOC 2 or third-party pen-test publication. Score 54/100 (2026-08-03) — empty-path honesty improved; aggregate planning launcher still hard-caps higher Evidence. |
| SET | `/administration/settings` | 0.8% | 0 | 0 | 80 | Settings | Formerly `/settings` (retired; no redirect). Keep `/settings/webhooks`, `/settings/cloud-connections`, `/settings/roles` redirects. |
| SXX | `/insights/search-review-evidence` | 0.7% | 0 | 0 | 70 | Marketing | Formerly `/search` (retired; no redirect). |
| DI | `/digests` | 0.6% | 0 | 0 | 60 | Digests | Architecture digests - DigestsHubClient with DigestsPageHeader PageContextualHelp (topic map getting-started / Architecture digests; Category-1 registry), Sources follow-up strip + claim-discipline callout (scheduled summaries, not diligence trail), browse/subscriptions/schedule tabs, weekly health banner. Not a signed-record Sources trail. Does not imply CPA SOC 2 or third-party pen-test publication. |
| INE | `/insights/evidence-graph` | 0.6% | 0 | 0 | 60 | Planning | Canonical evidence trail operator hub — GraphPageContent with runId/graphNodeId query handoffs, trace table vs interactive graph tabs, provenance/decision/architecture graph modes, sample-mode banner, and OperatorSavedViewsBar. Left nav Evidence graph. Legacy /graph retired (no redirect). Deep links from findings, standards rules, golden journey. Former workbook row GRA. |
| PPP | `/planning/plans/[planId]` | 0.6% | 0 | 0 | 60 | Planning | Improvement plan detail - PlanningPlanDetailPageView with OperatorPageHeader PageContextualHelp (topic map getting-started / Improvement planning; Category-1 registry for /planning/plans), Sources follow-up strip + claim-discipline callout (derived plan, not diligence trail), plan sections. Not a signed-record Sources trail. Does not imply CPA SOC 2 or third-party pen-test publication. |
| AUD | `/governance/audit` | 0.5% | 0 | 0 | 50 | Alerts/gov | Governance audit trail - AuditPageView with AuditPageHeader PageContextualHelpButton (topic map audit-trail; Category-1 registry), Sources follow-up strip + claim-discipline callout (activity log, not diligence pack), search/filters, integrity export/verify when available. Not a signed-record Sources trail by itself. Does not imply CPA SOC 2 or third-party pen-test publication. |
| HXX | `/health` | 0.5% | 0 | 0 | 50 | Marketing | Deprecated operator bookmark — merged to Administration System health on **ADY** (`/administration/system-health`). |
| RNX | `/reviews/new` | 0.5% | 0 | 0 | 50 | Core review | Start review intake - ReviewsNewPageChrome with OperatorPageHeader PageContextualHelpButton (topic map evidence-intake / Start review; Category-1 registry), Sources follow-up strip + claim-discipline callout (intake only, not diligence trail), path switcher wizards. Not a signed-record Sources trail. Does not imply CPA SOC 2 or third-party pen-test publication. |
| GPP | `/governance/policy-packs` | 0.4% | 0 | 0 | 40 | Alerts/gov | None |
| ERU | `/reviews/[runId]/findings/[findingId]/evidence-trace` | 0.4% | 0 | 0 | 40 | Core review | Finding evidence-trace (canonical inspector). Absorbs former RR hit share from retired legacy `/inspect` bookmark row (FindingInspectLegacyRedirectPage still permanentRedirects here). Score transferred from RR Evidence hard-cap (redirect/shim honesty). Does not imply CPA SOC 2 or third-party pen-test publication. |
| GDO | `/governance/decision-register` | 0.3% | 0 | 0 | 30 | Alerts/gov | Decision register - DecisionRegisterClient with OperatorPageHeader PageContextualHelpButton (topic map getting-started / Decision register, not governance-approval catch-all), Category-1 registry, Sources follow-up strip + claim-discipline callout (register browse, not diligence pack), filters/summary/cards/timeline. Not a signed-record Sources trail by itself. Does not imply CPA SOC 2 or third-party pen-test publication. |
| GPI | `/governance/policy-packs/[id]` | 0.3% | 0 | 0 | 30 | Alerts/gov | Policy pack detail - PolicyPackDetailClient with PolicyPackDetailEvidenceChrome (PageContextualHelpButton; topic map policy-packs / Policy packs; Category-1 registry), Sources follow-up strip + claim-discipline callout (pack rules, not diligence trail), specialty/generic pack narratives. Not a signed-record Sources trail. Does not imply CPA SOC 2 or third-party pen-test publication. |
| GRO | `/governance/risk-exceptions` | 0.3% | 0 | 0 | 30 | Alerts/gov | None |
| CXX | `/insights/compare-two-reviews` | 0.25% | 0 | 0 | 25 | Insights | Compare two reviews (Insights) - CompareForm with OperatorPageHeader PageContextualHelpButton (topic map comparison-replay; Category-1 registry), workspace Sources + claim-discipline orientation strip, pair Cite Sources after Compare (ComparePairEvidenceCiteStrip), run pickers/results. Formerly /compare (retired; no redirect). Not a signed-record Sources trail by itself. Does not imply CPA SOC 2 or third-party pen-test publication. |
| SCE | `/integrations/cloud-connections` | 0.25% | 0 | 0 | 25 | Integrations | Cloud connections (Integrations) - landing hub with PageContextualHelpButton (topic map cloud-connections; Category-1 registry), workspace Sources + claim-discipline orientation strip, platform scope panel, provider summary cards + evidence-only upload. Legacy /settings/cloud-connections redirects here. Not a signed-record Sources trail by itself. Does not imply CPA SOC 2 or third-party pen-test publication. |
| P | `/pricing` | 0.25% | 0 | 0 | 25 | Marketing | Pricing (Marketing) - PricingPageHero + tier grid/FAQ/quote with PricingEvidenceOrientationStrip (evaluation Sources + claim-discipline: commercial packaging only; not diligence / CPA SOC 2 / third-party pen-test). Not an operator PageContextualHelp surface. Does not imply CPA SOC 2 or third-party pen-test publication. |
| RRP | `/reviews/[runId]/provenance` | 0.25% | 0 | 0 | 25 | Core review | Run provenance (Core review) - ProvenancePageWorkspace with PageContextualHelpButton (topic map evidence-trail; Category-1 registry via /provenance path match), workspace Sources + claim-discipline orientation strip, graph/timeline/table views. Coordinator linkage for one run — not a full diligence Sources export alone. Does not imply CPA SOC 2 or third-party pen-test publication. |
| SBE | `/administration/settings/billing` | 0.25% | 0 | 0 | 25 | Settings | None |
| GOR | `/governance/alert-rules?tab=routing` | 0.22% | 0 | 0 | 22 | Tab surface | Alert rules Notifications/routing tab (Tab surface) - AlertRoutingContent with hub PageContextualHelpButton (topic map alerts), workspace Sources + claim-discipline orientation strip when ?tab=routing. Delivery destinations only — not diligence Sources. Sibling SAX/GOA = hub; Conditions/Advanced/Test tabs are separate rows. Does not imply CPA SOC 2 or third-party pen-test publication. |
| GRX | `/governance/recurrence-schedules` | 0.2% | 0 | 0 | 20 | Alerts/gov | None |
| HGX | `/help/getting-started` | 0.2% | 0 | 0 | 20 | Help topic | Getting started help (Help topic) - HelpGettingStartedGuideView with PageContextualHelpButton (topic map getting-started; Category-1 registry), workspace Sources + claim-discipline orientation, quick-start CTAs, workflow stepper, vocabulary. Orientation guide — not a signed-record Sources trail. Does not imply CPA SOC 2 or third-party pen-test publication. |
| LOG | `/login` | 0.2% | 0 | 0 | 20 | Auth | None |
| PXX | `/insights/patterns` | 0.2% | 0 | 0 | 20 | Marketing | None |
| SAE | `/administration/settings/api-keys` | 0.2% | 0 | 0 | 20 | Settings | None |
| SRX | `/administration/settings/users?tab=roles` | 0.2% | 0 | 0 | 20 | Tab surface | None |
| SPE | `/sponsor-report/executive-summary` | 0.22% | 0 | 0 | 22 | Sponsor report | Sponsor executive summary (Sponsor report) - ValueReportPageClient/View with PageContextualHelpButton (topic map executive-summary; Category-1 registry on /sponsor-report + /value-report), workspace Sources + claim-discipline orientation strip, period preview/exports, Outcomes nav. Absorbs former VXX hit share from retired legacy `/value-report` bookmark row (LegacyValueReportRedirectPage still permanentRedirects here). Period summary — not a signed-record Sources trail alone. Does not imply CPA SOC 2 or third-party pen-test publication. |
| SIG | `/signup` | 0.2% | 0 | 0 | 20 | Marketing | Signup (Marketing) - evaluation start with SignupForm or SignupAccessRequestPanel, SignupEvidenceOrientationStrip (evaluation Sources + claim-discipline: evaluation access only; not diligence / CPA SOC 2 / third-party pen-test). Not an operator PageContextualHelp surface. Does not imply CPA SOC 2 or third-party pen-test publication. |
| FI | `/help/first-review` | 0.18% | 0 | 0 | 18 | Help topic | Specialty first-run evidence checklist (Admin internal-runbook) - HelpFirstReviewEvidenceChecklistGuideView with first-architecture-review / Start architecture review / audit primary CTAs, Sources diligence strip (complete review workflow, Azure connect, audit-trail, troubleshooting, configuration-reference), evidence arc, claim-discipline callout (checklist is not certification), PageContextualHelp, and prepared FIRST_PILOT_OPERATOR_PATH.md printable section only (`sectionAnchors` + API/runbook/script leakage strip). `FIRST_RUN_EVIDENCE_CHECKLIST.md` is a path-stable alias. Not bare HelpTopicMarkdownView. Admin-gated internal Help Center tier. Not a redirect to buyer core-pilot. Does not imply CPA SOC 2 or third-party pen-test publication. |
| AHX | `/admin/health` | 0.15% | 0 | 0 | 15 | Admin | None |
| ADV | `/governance/advisory-scans` | 0.15% | 0 | 0 | 15 | Advisory | Advisory scans hub (Governance) - AdvisoryHubClient with PageContextualHelpButton (Category-1 registry), workspace Sources + claim-discipline orientation strip, Scans/Schedules tabs, recommendation generate + schedules. Follow-up recommendations — not a signed-record Sources trail. Sibling AD = Schedules tab deep link. Does not imply CPA SOC 2 or third-party pen-test publication. Score 50/100 (2026-08-03) — recommendation-launcher hard-caps higher Evidence. |
| SAX | `/governance/alert-rules` | 0.15% | 0 | 0 | 15 | Alerts/gov | Alert rules hub (Alerts/gov) - AlertRulesHubClient with PageContextualHelpButton (topic map alerts; Category-1 registry), workspace Sources + claim-discipline orientation strip on non-routing tabs (Notifications keeps AlertRoutingEvidenceOrientationStrip for GOR), Conditions/Notifications/Advanced/Test tabs. Alert configuration — not a signed-record Sources trail. Sibling GOR = routing tab; GOA = low-hit hub duplicate in template. Does not imply CPA SOC 2 or third-party pen-test publication. Score 48/100 (2026-08-03) — alert-config hub hard-caps higher Evidence. |
| GAI | `/governance/approval-requests/[id]/lineage` | 0.15% | 0 | 0 | 15 | Alerts/gov | Approval lineage (Alerts/gov) - GovernanceApprovalLineageDetailContent with PageContextualHelpButton (topic map governance-approval; Category-1 registry on /governance/approval-requests), workspace Sources + claim-discipline orientation strip, approval status/risk, review + signed-record version links, findings/completeness. Governance linkage view — not a full diligence Sources package alone. Does not imply CPA SOC 2 or third-party pen-test publication. Score 55/100 (2026-08-03) — lineage linkage hard-caps higher Evidence without audit export depth. |
| GRS | `/governance/standards-and-rules` | 0.15% | 0 | 0 | 15 | Alerts/gov | Formerly `/governance/resolution` and `/governance-resolution` (retired; no redirect). |
| HCE | `/help/cloud-connections` | 0.15% | 0 | 0 | 15 | Help topic | Cloud connections help (Help topic) - HelpCloudConnectionsGuideView with PageContextualHelpButton (topic map cloud-connections; Category-1 registry), workspace Sources + claim-discipline orientation, hub/Azure CTAs, curated CLOUD_CONNECTIONS.md body. Orientation guide — not a signed-record Sources trail. Sibling HC = Azure secure-connect alias. Does not imply CPA SOC 2 or third-party pen-test publication. Score 52/100 (2026-08-03) — help-topic orientation hard-caps higher Evidence. |
| STX | `/administration/settings/tenant` | 0.15% | 0 | 0 | 15 | Settings | None |
| AUX | `/administration/settings/users` | 0.15% | 0 | 0 | 15 | Settings | Users and roles (Settings/Admin) - SettingsRolesPageView with PageContextualHelpButton (topic map users-and-roles; Category-1 registry), workspace Sources + claim-discipline orientation strip, Users/Roles/API-keys tabs, invite + matrix. Access configuration — not a signed-record Sources trail. Does not imply CPA SOC 2 or third-party pen-test publication. Score 50/100 (2026-08-03) — access-hub hard-caps higher Evidence. |
| MMX | `/signed-records/[manifestId]` | 0.15% | 0 | 0 | 15 | Marketing | Signed review record detail (Marketing/owner section) - ManifestDetailPageView with PageContextualHelpButton (topic map review-packages; Category-1 registry on /signed-records), workspace Sources + claim-discipline orientation strip, summary/decisions/artifacts/bundle downloads, OperatorEvidenceLimitsFooter. Application-layer package lineage — not CPA SOC 2 or third-party pen-test publication. Score 58/100 (2026-08-03) — package detail hard-caps higher Evidence without Trust Center attestation artifacts. |
| ATX | `/admin/tenant-health` | 0.12% | 0 | 0 | 12 | Admin | Tenant health (Admin) - TenantHealthAdminPageClient with PageContextualHelpButton (topic map troubleshooting; Category-1 registry), workspace Sources + claim-discipline orientation strip, engagement/governance/funnel table. Internal CS engagement scores — not a signed-record Sources trail. Does not imply CPA SOC 2 or third-party pen-test publication. Score 45/100 (2026-08-03) — admin KPI hub hard-caps higher Evidence. |
| ATY | `/admin/tenants` | 0.08% | 0 | 0 | 8 | Admin | None |
| ADY | `/administration/system-health` | 0.12% | 0 | 0 | 12 | Admin | Administration System health hub - SystemHealthPageView with PageContextualHelpButton (topic map troubleshooting; Category-1 registry), Sources follow-up strip + claim-discipline callout (operational readiness, not diligence trail), live/ready dependency checks, build identity, demo-safe buyer shell variant. Canonical path /administration/system-health (legacy /health on HXX). Not a signed-record Sources trail. Does not imply CPA SOC 2 or third-party pen-test publication. |
| FXX | `/faq` | 0.12% | 0 | 0 | 12 | Marketing | Product FAQ (Marketing) - MarketingFaqPageClient with FaqEvidenceOrientationStrip (evaluation Sources + claim-discipline: evaluation orientation only; not diligence / CPA SOC 2 / third-party pen-test), searchable FAQ categories, Pricing/Security CTAs. Not an operator PageContextualHelp surface. Does not imply CPA SOC 2 or third-party pen-test publication. Score 40/100 (2026-08-03) — marketing FAQ hard-caps higher Evidence. |
| HC | `/help/cloud-connections/azure` | 0.12% | 0 | 0 | 12 | Help alias | Connect Azure securely help (Help alias) - HelpConnectAzureSecurelyGuideView with PageContextualHelpButton (topic map cloud-connections-azure; Category-1 registry), workspace Sources + claim-discipline orientation strip, federation/roles setup, configure CTA. Sibling HCE = parent cloud-connections help; HCA = low-hit template duplicate. Orientation guide — not a signed-record Sources trail. Does not imply CPA SOC 2 or third-party pen-test publication. Score 52/100 (2026-08-03) — help-topic orientation hard-caps higher Evidence. |
| HHX | `/help/how-it-works` | 0.12% | 0 | 0 | 12 | Help topic | How ArchLucid works help (Help topic) - HelpHowArchLucidWorksGuideView with PageContextualHelpButton (topic map how-it-works; Category-1 registry), workspace Sources + claim-discipline orientation strip, workflow diagram, get-started CTAs. Orientation guide — not a signed-record Sources trail. Related HGX = Getting started. Does not imply CPA SOC 2 or third-party pen-test publication. Score 52/100 (2026-08-03) — help-topic orientation hard-caps higher Evidence. |
| HTX | `/help/troubleshooting` | 0.12% | 0 | 0 | 12 | Help topic | Troubleshooting help (Help topic) - HelpTroubleshootingGuideView with PageContextualHelpButton (topic map troubleshooting; Category-1 registry), workspace Sources + claim-discipline orientation strip, start-here CTAs, common issues, advanced diagnostics. Operator unblocking guide — not a signed-record Sources trail. Does not imply CPA SOC 2 or third-party pen-test publication. Score 52/100 (2026-08-03) — help-topic orientation hard-caps higher Evidence. |
| HCO | `/help/first-architecture-review` | 0.11% | 0 | 0 | 11 | Help topic | Specialty first-review guide — HelpCorePilotGuideView with hero Start review CTA, five-step stepper, and gated finalize steps (TB-1040). Legacy alias /help/core-pilot (ECO). Not bare HelpTopicMarkdownView. |
| IIX | `/integrations/itsm` | 0.12% | 0 | 0 | 12 | Integrations | None |
| SBX | `/administration/settings/baseline` | 0.12% | 0 | 0 | 12 | Settings | None |
| SIX | `/administration/settings/identity-providers` | 0.12% | 0 | 0 | 12 | Settings | None |
| ASX | `/administration/settings/support` | 0.12% | 0 | 0 | 12 | Settings | None |
| SPR | `/sponsor-report/roi-summary` | 0.12% | 0 | 0 | 12 | Sponsor report | Sponsor ROI summary report (canonical). Absorbs former VRX hit share from retired legacy `/value-report/roi` bookmark row (LegacyRoiSummaryRedirectPage still permanentRedirects here). Does not imply CPA SOC 2 or third-party pen-test publication. |
| ACX | `/admin/configuration` | 0.1% | 0 | 0 | 10 | Admin | None |
| ARX | `/admin/rag-health` | 0.1% | 0 | 0 | 10 | Admin | None |
| EXX | `/insights/impact-preview` | 0.1% | 0 | 0 | 10 | Marketing | Formerly `/evolution-review` (retired; no redirect). |
| ESX | `/executive/scorecard` | 0.1% | 0 | 0 | 10 | Executive | Sponsor scorecard (Executive) - ExecutiveScorecardClient with PageContextualHelpButton (topic map executive-summary; Category-1 registry), workspace Sources + claim-discipline orientation strip, time-range KPIs, recommended actions. Sponsor KPI leave-behind — not a signed-record Sources trail. Sibling SCX = Insights architecture scorecard; SPE = sponsor executive summary. Does not imply CPA SOC 2 or third-party pen-test publication. Score 48/100 (2026-08-04) — executive KPI hub hard-caps higher Evidence. |
| GFX | `/governance/setup` | 0.1% | 0 | 0 | 10 | Alerts/gov | Governance setup guide — GovernanceSetupGuidePageView with outcome-framed steps, progress coach, sticky What-this-guide-unlocks rail (not Pending theater), foundation panel after first complete indicator (TB-1138), recommended-next primary CTA (TB-1137). Links into audited config workspaces. Not a signed-record Sources trail. Does not imply CPA SOC 2 or third-party pen-test publication. Score 62/100 (2026-08-03) — setup checklist with value framing; guide hard-caps without live config depth. |
| HA | `/help/alerts` | 0.1% | 0 | 0 | 10 | Help topic | Alerts help (Help topic) - HelpAlertsGuideView with PageContextualHelpButton (topic map alerts; Category-1 registry), workspace Sources + claim-discipline orientation strip, go-to-alerts CTAs, how-alerts-work stepper, workspace readiness strip. Operator orientation guide — not a signed-record Sources trail. Sibling AL = alerts inbox; SAX = alert rules hub. Does not imply CPA SOC 2 or third-party pen-test publication. Score 52/100 (2026-08-04) — help-topic orientation hard-caps higher Evidence. |
| HFX | `/help/findings` | 0.1% | 0 | 0 | 10 | Help topic | Specialty findings guide — HelpFindingsGuideView with anatomy panel, severity table, lifecycle sections, and HelpFindingsWorkspaceReadinessStrip (live governance queue). Featured help-center product tier. Primary CTAs to /governance/findings, evidence search, and decision register. Related docs link to audit-trail not API contracts (TB-1250 / TB-1387). Not bare HelpTopicMarkdownView. |
| IJX | `/integrations/jira` | 0.1% | 0 | 0 | 10 | Integrations | None |
| ISN | `/integrations/slack` | 0.1% | 0 | 0 | 10 | Integrations | None |
| ITX | `/integrations/teams` | 0.1% | 0 | 0 | 10 | Integrations | None |
| ARF | `/architecture/first-review-guide` | 0.1% | 0 | 0 | 10 | Onboarding | Canonical first-review onboarding hub — FirstReviewGuidePageClient with walkthrough steps, required setup panel, optional workspace setup, and registration trial card (`?source=registration`). Left nav First review guide. Legacy /onboarding retired (no redirect). Signup verify handoff via SIGNUP_VERIFY_ONBOARDING_PATH. Former workbook row ONB. |
| REP | `/replay` | 0.1% | 0 | 0 | 10 | Marketing | None |
| SEC | `/security-trust` | 0.1% | 0 | 0 | 10 | Marketing | None |
| SC | `/administration/settings/ai-usage` | 0.1% | 0 | 0 | 10 | Settings | None |
| SDX | `/administration/settings/developer` | 0.1% | 0 | 0 | 10 | Settings | None |
| TXX | `/trust` | 0.1% | 0 | 0 | 10 | Marketing | None |
| AAX | `/admin/ai-usage-cost` | 0.08% | 0 | 0 | 8 | Admin | None |
| AII | `/admin/integrations/itsm` | 0.08% | 0 | 0 | 8 | Admin | None |
| DXX | `/demo` | 0.08% | 0 | 0 | 8 | Marketing | None |
| GO | `/help/governance-approval` | 0.08% | 0 | 0 | 8 | Help topic | Specialty governance approval guide — HelpGovernanceApprovalGuideView with workflow stepper, role guides, status table, decision outcomes, and collapsed HelpGovernanceApprovalTechnicalReference. Featured help-center product tier (pdfStatus customer). Primary CTAs to /governance, /governance/dashboard, and /governance/findings. Related docs link to audit-trail not API contracts (TB-1250 / TB-1387). Not bare HelpTopicMarkdownView. |
| HR | `/help/review-guide` | 0.08% | 0 | 0 | 8 | Help topic | None |
| ISX | `/integrations/servicenow` | 0.08% | 0 | 0 | 8 | Integrations | None |
| OSX | `/onboarding/start` | 0.08% | 0 | 0 | 8 | Onboarding | None |
| SRI | `/administration/settings/users/invite-reviewer` | 0.08% | 0 | 0 | 8 | Settings | None |
| SVX | `/signup/verify` | 0.08% | 0 | 0 | 8 | Marketing | None |
| GET | `/getting-started` | 0.07% | 0 | 0 | 7 | Onboarding | None |
| AD | `/governance/advisory-scans?tab=schedules` | 0.07% | 0 | 0 | 7 | Tab surface | Advisory scans Schedules tab (left nav Governance → Advisory scans → Schedules). AdvisorySchedulesContent + AdvisoryScheduleCreateForm; digest send-test and setup-gap handoffs. Legacy /advisory-scheduling redirects via TB-1124. Sibling ADS row = default Scans tab. |
| HBX | `/help/billing-and-plans` | 0.07% | 0 | 0 | 7 | Help topic | Specialty billing orientation guide - HelpBillingAndPlansGuideView with current-plan card, how-billing-works steps, FAQ, and CTAs to /administration/settings/billing (SBE) and /pricing. Not bare HelpTopicMarkdownView. |
| HP | `/help/pilot-guide` | 0.07% | 0 | 0 | 7 | Help topic | None |
| IWX | `/integrations/webhooks` | 0.07% | 0 | 0 | 7 | Integrations | None |
| SE | `/administration/settings/extract-upload` | 0.07% | 0 | 0 | 7 | Settings | None |
| SIS | `/administration/settings/identity/sso-wizard` | 0.07% | 0 | 0 | 7 | Settings | None |
| SSX | `/administration/settings/scim-provisioning` | 0.07% | 0 | 0 | 7 | Settings | None |
| SPP | `/sponsor-report/pilot-outcomes` | 0.07% | 0 | 0 | 7 | Sponsor report | Sponsor pilot outcomes report (canonical). Absorbs former VPX hit share from retired legacy `/value-report/pilot` bookmark row (LegacyPilotValueReportRedirectPage still permanentRedirects here). Does not imply CPA SOC 2 or third-party pen-test publication. |
| DPX | `/demo/preview` | 0.06% | 0 | 0 | 6 | Marketing | None |
| HCA | `/help/cloud-connections/azure` | 0.06% | 0 | 0 | 6 | Help alias | None |
| HOE | `/help/operator-auth-roles` | 0.06% | 0 | 0 | 6 | Help alias | None |
| OXX | `/onboard` | 0.06% | 0 | 0 | 6 | Onboarding | None |
| PRC | `/internal/product-learning` | 0.06% | 0 | 0 | 6 | Onboarding | None |
| AEX | `/admin/evidence-proposals` | 0.05% | 0 | 0 | 5 | Admin | None |
| AFX | `/admin/fleet-llm-cogs` | 0.05% | 0 | 0 | 5 | Admin | Platform admin fleet LLM COGS dashboard — FleetLlmCogsPageClient gated on AdminAuthority with per-tenant UTC-month estimated pressure, hard-cap utilization, gross-margin risk labels, and budget completeness table. GET /v1/admin/operational/fleet-llm-cogs via fetchAdminFleetLlmCogsDashboard. Internal COGS estimates only (not Azure invoice or customer charges). System Admin nav (features.showSystemAdministrationNav). route-readiness hidden. |
| APX | `/admin/pricing-quote-aging` | 0.05% | 0 | 0 | 5 | Admin | None |
| ATD | `/admin/trial-funnel` | 0.05% | 0 | 0 | 5 | Admin | None |
| GXX | `/get-started` | 0.05% | 0 | 0 | 5 | Marketing | None |
| HSX | `/help/scope` | 0.05% | 0 | 0 | 5 | Help topic | None |
| HSE | `/help/security-trust` | 0.05% | 0 | 0 | 5 | Help topic | None |
| HUX | `/help/users-and-roles` | 0.05% | 0 | 0 | 5 | Help alias | None |
| IIO | `/integrations/itsm/oauth/callback` | 0.05% | 0 | 0 | 5 | Integrations | Atlassian OAuth consent return — live App Router page; not redirect-blocked (TB-1776 hub carve-out). Score UX after TB-1782+. |
| RXX | `/internal-operations/recommendation-learning` | 0.05% | 0 | 0 | 5 | Marketing | None |
| OAX | `/operate/architecture-graph` | 0.05% | 0 | 0 | 5 | Advisory | None |
| QXX | `/quick-scan` | 0.05% | 0 | 0 | 5 | Marketing | None |
| SRH | `/showcase/[runId]` | 0.05% | 0 | 0 | 5 | Marketing | None |
| TRY | `/try` | 0.05% | 0 | 0 | 5 | Marketing | None |
| H | `/help/audit-trail` | 0.04% | 0 | 0 | 4 | Help topic | None |
| HCX | `/help/cli-usage` | 0.04% | 0 | 0 | 4 | Help topic | None |
| HDX | `/help/developer-troubleshooting` | 0.04% | 0 | 0 | 4 | Help topic | Specialty engineering troubleshooting runbook (Admin internal-runbook, TB-1246) - HelpEngineeringTroubleshootingGuideView with Customer Troubleshooting / System health / Report a problem / CLI primary CTAs, Sources diligence strip (admin-diagnostics, configuration-reference), claim-discipline callout, PageContextualHelp, HelpTopicAuthorityGate + HelpTopicMarkdownClient specialty branch, and prepared TROUBLESHOOTING.md + COMMON_ERRORS.md (contributor ADR/TB link strip). Help search Advanced diagnostics (adminOnly). Not in customer Help Center featured grid. Customer Troubleshooting (HTX) does not deep-link here (TB-1249). Slug remains developer-troubleshooting pending TB-1248 rename. Does not imply CPA SOC 2 or third-party pen-test publication. |
| HEF | `/help/first-value-20-minutes` | 0.04% | 0 | 0 | 4 | Help topic | Specialty Admin 20-minute first-value runbook - HelpFirstValue20GuideView with first-architecture-review / Start architecture review / Troubleshooting primary CTAs, Sources diligence strip (complete review workflow, first-review checklist, configuration-reference), job-matrix IA dual (TB-1694), orientation steps, claim-discipline callout, PageContextualHelp, and prepared FIRST_PILOT_OPERATOR_PATH.md 20-min section only (TB-1691 sectionAnchors + TB-1693 leakage strip). Title honesty Admin runbook (TB-1695). Not bare HelpTopicMarkdownView. Admin-gated internal-runbook. Not the default customer help path. Does not imply CPA SOC 2 or third-party pen-test publication. |
| PRO | `/help/procurement` | 0.04% | 0 | 0 | 4 | Help topic | None |
| LXX | `/live-demo` | 0.04% | 0 | 0 | 4 | Marketing | None |
| OID | `/operate/integration-events/dlq` | 0.04% | 0 | 0 | 4 | Advisory | None |
| SEE | `/see-it` | 0.04% | 0 | 0 | 4 | Marketing | None |
| WSX | `/administration/settings/security-trust` | 0.04% | 0 | 0 | 4 | Settings | None |
| STR | `/administration/settings/tenant/recycle-bin` | 0.04% | 0 | 0 | 4 | Settings | None |
| WXX | `/welcome` | 0.04% | 0 | 0 | 4 | Marketing | None |
| WHY | `/why` | 0.04% | 0 | 0 | 4 | Marketing | None |
| WH | `/why-archlucid` | 0.04% | 0 | 0 | 4 | Learning | None |
| ASU | `/auth/session-expired` | 0.03% | 0 | 0 | 3 | Auth | None |
| DEX | `/demo/explain` | 0.03% | 0 | 0 | 3 | Learning | None |
| CON | `/help/configuration-reference` | 0.03% | 0 | 0 | 3 | Help topic | Specialty configuration reference (Admin internal-runbook) - HelpConfigurationReferenceGuideView with SSO wizard / identity-providers / API-keys / configuration-summary primary CTAs, Sources strip (authentication-sign-in, users-and-roles, enterprise-onboarding, cloud-connections, security-trust, data-handling-tenant-isolation), task sections, claim-discipline callout, PageContextualHelp, collapsed Admin key-catalog appendix, and prepared CONFIGURATION_REFERENCE.md (TB-1327 leakage strip + TB-1330 in-app-only links). Not bare HelpTopicMarkdownView. Admin-gated until catalog remains eng appendix (TB-1329 option b). Does not imply CPA SOC 2 or third-party pen-test publication. |
| ECO | `/help/core-pilot` | 0.02% | 0 | 0 | 2 | Help alias | Deprecated operator bookmark — merged to Your first architecture review on **HCO** (`/help/first-architecture-review`). Slug alias `core-pilot` → `first-architecture-review` in HELP_TOPIC_SLUG_ALIASES; catalog migration merges workbook Hit% onto HCO. |
| HEX | `/help/enterprise-onboarding` | 0.03% | 0 | 0 | 3 | Help topic | None |
| HEE | `/help/evaluator-workbook` | 0.03% | 0 | 0 | 3 | Help alias | Deprecated evaluator bookmark — merged to Choose your next step on **HPX** (`/help/path-chooser`). Slug alias `evaluator-workbook` → `path-chooser` in HELP_TOPIC_SLUG_ALIASES; pass/hold body lives in `BUYER_ORIENTATION_ONE_SCREEN.md`. |
| EVI | `/help/evidence-intake` | 0.03% | 0 | 0 | 3 | Help topic | None |
| EV | `/help/evidence-trail` | 0.03% | 0 | 0 | 3 | Help topic | None |
| HFE | `/help/first-hour-operator-path` | 0.03% | 0 | 0 | 3 | Help alias | Deprecated first-hour bookmark — merged to Your first architecture review on **HCO** (`/help/first-architecture-review`). Slug alias `first-hour-operator-path` → `first-architecture-review` in HELP_TOPIC_SLUG_ALIASES; body lives in `CORE_PILOT.md` (TB-1374). |
| FIR | `/help/first-pilot-path` | 0.03% | 0 | 0 | 3 | Help alias | Deprecated Complete review workflow bookmark — merged into Your first architecture review on **COR** (`/help/first-architecture-review`). Slug alias `first-pilot-path` → `first-architecture-review`; body lives in `CORE_PILOT.md#complete-review-workflow` (TB-1379). |
| HG | `/help/governance-api-contracts` | 0.03% | 0 | 0 | 3 | Help topic | Specialty Admin API contracts technical reference - HelpApiContractsGuideView with CLI / configuration-reference / buyer governance-approval primary CTAs, Sources strip (eng troubleshooting, audit-trail, admin-diagnostics), orientation + claim-discipline callout, PageContextualHelp, and prepared API_CONTRACTS.md (TB-1388 contributor strip). Title honesty API contracts not Governance FAQ (TB-1386). Admin-gated internal-runbook (TB-1384); de-indexed from product search (TB-1385); buyer Findings/Governance deep-links retargeted (TB-1387). Alias /help/api-contracts. Not bare HelpTopicMarkdownView. Does not imply CPA SOC 2 or third-party pen-test publication. |
| PI | `/help/pilot-roi-model` | 0.03% | 0 | 0 | 3 | Help topic | None |
| HRX | `/help/repeat-review-loop` | 0.03% | 0 | 0 | 3 | Help topic | None |
| REV | `/help/review-packages` | 0.03% | 0 | 0 | 3 | Help topic | None |
| 4XX | `/403` | 0.02% | 0 | 0 | 2 | Auth | None |
| AXX | `/accessibility` | 0.02% | 0 | 0 | 2 | Marketing | None |
| ADD | `/admin/demo-readiness` | 0.02% | 0 | 0 | 2 | Admin | None |
| ADE | `/admin/deployment-status` | 0.02% | 0 | 0 | 2 | Admin | None |
| AR | `/architectures` | 0.02% | 0 | 0 | 2 | Core review | None |
| ARA | `/architectures/[architectureId]` | 0.02% | 0 | 0 | 2 | Core review | None |
| ARE | `/architecture/executive-dashboard` | 0.02% | 0 | 0 | 2 | Executive | Canonical executive ROI portfolio dashboard — ExecutiveRoiDashboardPageView with hero, KPI tiles, trend charts, sponsor exports, and PageContextualHelp → executive-summary. Legacy /dashboard (DSH), /executive/dashboard (EXD), and /portfolio redirect here (TB-608). |
| AUB | `/auth/bootstrap` | 0.02% | 0 | 0 | 2 | Auth | None |
| AUI | `/auth/invite` | 0.02% | 0 | 0 | 2 | Auth | None |
| COM | `/compliance-journey` | 0.02% | 0 | 0 | 2 | Marketing | None |
| DIB | `/digests?tab=browse` | 0.02% | 0 | 0 | 2 | Tab surface | None |
| DIS | `/digests?tab=schedule` | 0.12% | 0 | 0 | 12 | Tab surface | Digests Schedule tab (Tab surface) - ExecDigestScheduleContent with hub DigestsPageHeader PageContextualHelp (topic map getting-started / Architecture digests; Category-1 registry), DigestsScheduleEvidenceOrientationStrip (Sources + claim-discipline) when ?tab=schedule. Delivery cadence only — not diligence Sources. Sibling DI = hub; DIB = browse; DIX = subscriptions. Hit share folded from a retired mistaken schedule bookmark row (legacy settings exec-digest IDs remain removed — do not reintroduce). Does not imply CPA SOC 2 or third-party pen-test publication. Score 48/100 (2026-08-03) — schedule-config tab hard-caps higher Evidence. |
| DIX | `/digests?tab=subscriptions` | 0.02% | 0 | 0 | 2 | Tab surface | None |
| EXA | `/example-roi-bulletin` | 0.02% | 0 | 0 | 2 | Marketing | None |
| EXD | `/executive/dashboard` | 0.02% | 0 | 0 | 2 | Executive | Deprecated executive-shell bookmark — merged to canonical executive dashboard on **ARE** (`/architecture/executive-dashboard`, TB-608). |
| ADS | `/governance/advisory-scans?tab=scans` | 0.02% | 0 | 0 | 2 | Tab surface | None |
| GOA | `/governance/alert-rules` | 0.02% | 0 | 0 | 2 | Alerts/gov | Alert rules hub (left nav Alert rules). |
| GOC | `/governance/alert-rules?tab=composite` | 0.02% | 0 | 0 | 2 | Tab surface | None |
| GLR | `/governance/alert-rules?tab=rules` | 0.02% | 0 | 0 | 2 | Tab surface | None |
| GOS | `/governance/alert-rules?tab=simulation` | 0.02% | 0 | 0 | 2 | Tab surface | None |
| GOI | `/governance/alerts?tab=inbox` | 0.02% | 0 | 0 | 2 | Tab surface | None |
| HE. | `/help/[...topic]` | 0.02% | 0 | 0 | 2 | Help topic | None |
| HAX | `/help/accelerator-chooser` | 0.02% | 0 | 0 | 2 | Help topic | None |
| HAE | `/help/admin-diagnostics` | 0.02% | 0 | 0 | 2 | Help topic | None |
| HEA | `/help/authentication-sign-in` | 0.02% | 0 | 0 | 2 | Help topic | None |
| HEZ | `/help/azure-boards` | 0.02% | 0 | 0 | 2 | Help topic | None |
| HAZ | `/help/azure-permissions` | 0.02% | 0 | 0 | 2 | Help topic | None |
| ECA | `/help/caiq-sig-response` | 0.02% | 0 | 0 | 2 | Help topic | None |
| HEC | `/help/cloud-connections/aws` | 0.02% | 0 | 0 | 2 | Help alias | None |
| HGC | `/help/cloud-connections/gcp` | 0.02% | 0 | 0 | 2 | Help alias | None |
| CO | `/help/comparison-replay` | 0.02% | 0 | 0 | 2 | Help topic | None |
| HER | `/help/creating-runs` | 0.02% | 0 | 0 | 2 | Help alias | None |
| HED | `/help/data-handling` | 0.02% | 0 | 0 | 2 | Help topic | None |
| HDA | `/help/data-handling-tenant-isolation` | 0.02% | 0 | 0 | 2 | Help topic | Specialty data-handling + tenant isolation guide — HelpDataHandlingTenantIsolationGuideView with Trust Center / security-trust / audit primary CTAs, Sources diligence strip (trust, audit-trail, data-handling overview, subprocessors, DPA, procurement), residency honesty callout, PageContextualHelp, and prepared markdown (three-layer isolation, TB-1659 leakage strip, TB-1653 honesty). Not bare HelpTopicMarkdownView. Does not imply CPA SOC 2 or third-party pen-test publication. |
| HDP | `/help/dpa-template` | 0.02% | 0 | 0 | 2 | Help topic | Specialty DPA negotiation template guide - HelpDpaTemplateGuideView with Trust Center / subprocessors / procurement primary CTAs, Sources diligence strip (security-trust, data-handling, tenant-isolation), orientation steps, claim-discipline callout (template is not countersigned; SOC 2 when available is not CPA attestation), PageContextualHelp, and full DPA_TEMPLATE.md deferred behind collapsed disclosure (TB-1676/1678/1680). TB-1677 leakage strip retained. Help Center product tier + advanced discovery (TB-1679). Not bare HelpTopicMarkdownView. Does not imply CPA SOC 2 or third-party pen-test publication. |
| HEV | `/help/evidence-only-review` | 0.02% | 0 | 0 | 2 | Help topic | None |
| EXE | `/help/executive-summary` | 0.02% | 0 | 0 | 2 | Help topic | Specialty sponsor ROI guide - HelpExecutiveSummaryGuideView on EXECUTIVE_SPONSOR_BRIEF sponsor sections with CTAs to /sponsor-report/executive-summary (SPE) and executive dashboard. Not bare FAQ HelpTopicMarkdownView. |
| HEG | `/help/glossary` | 0.02% | 0 | 0 | 2 | Help topic | None |
| HEI | `/help/integration-readiness` | 0.02% | 0 | 0 | 2 | Help topic | None |
| EIN | `/help/integrations/azure-boards` | 0.02% | 0 | 0 | 2 | Help alias | None |
| HPX | `/help/path-chooser` | 0.02% | 0 | 0 | 2 | Help topic | Specialty path chooser — HelpPathChooserGuideView with goal-branch primary/fallback CTAs (reviews/new, security-trust, first-architecture-review, executive-summary, CLI), Sources diligence strip (getting-started, first-architecture-review, trust, procurement, tenant isolation), claim-discipline callout, PageContextualHelp, and prepared BUYER_ORIENTATION_ONE_SCREEN.md (TB-1712 leakage strip). Not bare HelpTopicMarkdownView. Does not imply CPA SOC 2 or third-party pen-test publication. |
| HPE | `/help/pilot-feedback` | 0.02% | 0 | 0 | 2 | Help topic | None |
| PIL | `/help/pilot-nav-profile` | 0.02% | 0 | 0 | 2 | Help topic | None |
| POL | `/help/policy-pack-delta-demo` | 0.02% | 0 | 0 | 2 | Help topic | Specialty policy-pack delta demo (internal runbook) - HelpPolicyPackDeltaDemoGuideView with policy-packs / standards-and-rules / audit primary CTAs, Sources diligence strip (findings, audit-trail help, governance-approval, alerts), 5-minute narrative arc, claim-discipline callout (dry-run is not certification), PageContextualHelp, and prepared POLICY_PACK_DELTA_DEMO_SCRIPT.md (TB-1727 leakage strip). Not bare HelpTopicMarkdownView. Admin-gated internal Help Center tier. Does not imply CPA SOC 2 or third-party pen-test publication. |
| HEP | `/help/prior-manifest-retrieval` | 0.02% | 0 | 0 | 2 | Help topic | None |
| HPR | `/help/product-overview` | 0.02% | 0 | 0 | 2 | Help topic | None |
| HRE | `/help/report-a-problem` | 0.02% | 0 | 0 | 2 | Help topic | None |
| HEO | `/help/starting-reviews` | 0.02% | 0 | 0 | 2 | Help topic | None |
| HS | `/help/specialty-walkthroughs` | 0.02% | 0 | 0 | 2 | Help topic | None |
| HES | `/help/soc2-self-assessment` | 0.02% | 0 | 0 | 2 | Help topic | Specialty SOC 2 self-assessment guide - HelpSoc2SelfAssessmentGuideView with Trust Center / CAIQ-SIG / procurement primary CTAs, Sources diligence strip (security-trust, DPA, subprocessors, tenant-isolation), job-matrix IA dual (TB-1749), orientation steps, claim-discipline callout (self-assessment is not CPA Type I/II; Type I dates illustrative), PageContextualHelp, and prepared SOC2_SELF_ASSESSMENT_2026.md (TB-1747 leakage strip + TB-1748 roadmap honesty). Title + Help Center product discovery (TB-1750). Not bare HelpTopicMarkdownView. Does not imply CPA SOC 2 or third-party pen-test publication. |
| HEU | `/help/subprocessors` | 0.02% | 0 | 0 | 2 | Help topic | None |
| INA | `/integrations/azure-boards` | 0.02% | 0 | 0 | 2 | Integrations | None |
| INC | `/integrations/cloud-connections/aws` | 0.02% | 0 | 0 | 2 | Integrations | None |
| INZ | `/integrations/cloud-connections/azure` | 0.02% | 0 | 0 | 2 | Integrations | None |
| IGC | `/integrations/cloud-connections/gcp` | 0.02% | 0 | 0 | 2 | Integrations | None |
| INR | `/integrations/readiness` | 0.02% | 0 | 0 | 2 | Integrations | None |
| PAP | `/insights/patterns/[patternKey]` | 0.02% | 0 | 0 | 2 | Marketing | None |
| PRB | `/privacy` | 0.02% | 0 | 0 | 2 | Marketing | None |
| REX | `/recommendation-learning` | 0.02% | 0 | 0 | 2 | Marketing | None |
| RER | `/reviews/[runId]/artifacts/[artifactId]` | 0.02% | 0 | 0 | 2 | Core review | Run-scoped artifact Preview entry — App Router redirect to canonical `/signed-records/[manifestId]/artifacts/[artifactId]` (TB-1821). |
| REA | `/reviews/[runId]?archTab=activity` | 0.02% | 0 | 0 | 2 | Tab surface | None |
| REC | `/reviews/[runId]?archTab=clarifications` | 0.02% | 0 | 0 | 2 | Tab surface | None |
| RED | `/reviews/[runId]?archTab=diagram` | 0.02% | 0 | 0 | 2 | Tab surface | None |
| REE | `/reviews/[runId]?archTab=evidence` | 0.02% | 0 | 0 | 2 | Tab surface | None |
| REF | `/reviews/[runId]?archTab=findings` | 0.02% | 0 | 0 | 2 | Tab surface | None |
| REG | `/reviews/[runId]?archTab=governance` | 0.02% | 0 | 0 | 2 | Tab surface | Create-home-only archTab (TB-1856) - mounts on ArchitectureCreatedWorkspace when fromGeneration+create-architecture and no signed manifest; ignored on committed ReviewDetailWorkspace (twin: reviewTab=decisions-remediation). RunDetailGovernanceDecisionSection pre-commit honesty (TB-1857) with one primary Review findings CTA (TB-1859), secondary activity text link, Sources diligence strip (governance-approval, audit-trail, findings, search-review-evidence, compare-two-reviews), claim-discipline callout, and sponsor/work-item panels gated on manifestId (TB-1858). Not a live approval/audit surface. Does not imply CPA SOC 2 or third-party pen-test publication. |
| REO | `/reviews/[runId]?archTab=overview` | 0.02% | 0 | 0 | 2 | Tab surface | None |
| REN | `/reviews/new?path=detailed` | 0.02% | 0 | 0 | 2 | Tab surface | None |
| ENE | `/reviews/new?path=guided-intake` | 0.02% | 0 | 0 | 2 | Tab surface | None |
| REQ | `/reviews/new?path=quick-review` | 0.02% | 0 | 0 | 2 | Tab surface | None |
| SEA | `/administration/settings/account-security` | 0.02% | 0 | 0 | 2 | Settings | None |
| SEU | `/administration/settings/auth-domains` | 0.02% | 0 | 0 | 2 | Settings | None |
| SEI | `/administration/settings/identity-providers/diagnostics` | 0.02% | 0 | 0 | 2 | Settings | None |
| SOI | `/administration/settings/identity-providers/oidc` | 0.02% | 0 | 0 | 2 | Settings | None |
| SEO | `/administration/settings/identity-providers/role-mapping` | 0.02% | 0 | 0 | 2 | Settings | None |
| SSA | `/administration/settings/identity-providers/saml` | 0.02% | 0 | 0 | 2 | Settings | None |
| SEM | `/administration/settings/model-governance` | 0.02% | 0 | 0 | 2 | Settings | None |
| SEP | `/administration/settings/preferences` | 0.02% | 0 | 0 | 2 | Settings | None |
| SEK | `/administration/settings/users?tab=keys` | 0.02% | 0 | 0 | 2 | Tab surface | None |
| SSU | `/administration/settings/users?tab=users` | 0.02% | 0 | 0 | 2 | Tab surface | None |
| MA | `/signed-records` | 0.02% | 0 | 0 | 2 | Marketing | None |
| MAM | `/signed-records/[manifestId]/artifacts/[artifactId]` | 0.02% | 0 | 0 | 2 | Marketing | Manifest-scoped artifact preview — App Router page under signed-records (TB-1821 SoT). Run-scoped RER redirects here. Download/proxy paths remain available. |
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

When routes or help topics change:

1. Update [`ui_routes.md`](ui_routes.md) and refresh help slugs from `product-documentation-registry.ts`.
2. Reconcile the tracked template (and owner copy when present):

   ```powershell
   python scripts/ci/sync-archlucid-ui-route-traffic-workbook.py --doc docs/architecture/ui_route_traffic_estimates.template.md
   python scripts/ci/sync-archlucid-ui-route-traffic-workbook.py
   ```

3. CI guard: `scripts/ci/assert_ui_route_traffic_workbook_canonical.py` (also in `run_guards_pre_corset.sh`).

Set page scores only when the owner provides values; leave 0 otherwise.

**Related docs:**

- [`ui_routes.md`](ui_routes.md) â€” route catalog and demo tiers
- [`NAV_CONFIG_CONTRACT.md`](../../archlucid-ui/docs/NAV_CONFIG_CONTRACT.md)
- [`PRODUCT_DOCUMENTATION_PRESENTATION.md`](../library/PRODUCT_DOCUMENTATION_PRESENTATION.md)

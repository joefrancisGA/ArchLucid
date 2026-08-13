import type { UiRouteTrafficRow } from "@/lib/ui-route-traffic/types";

/** Traffic workbook rows for the `marketing` workbook section. */
export const MARKETING_TRAFFIC_ROWS: readonly UiRouteTrafficRow[] = [
  /** Traffic workbook row ID for Accessibility marketing page. Owner backlog shorthand: AXX. */
  {
    rowId: "AXX",
    path: "/accessibility",
    section: "Marketing",
    note: "Accessibility (Marketing) - AccessibilityMarketingPublicView with AccessibilityEvidenceOrientationStrip (evaluation Sources + claim-discipline: public accessibility statement only / completed VPAT download), status card, WCAG target, known limitations, barrier reporting. Not an operator PageContextualHelp surface.marketing/learning ceiling below operator Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["AccessibilityEvidenceOrientationStrip", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for compliance-journey marketing page. Owner backlog shorthand: COM. */
  {
    rowId: "COM",
    path: "/compliance-journey",
    section: "Marketing",
    note: "Compliance journey (Marketing) - ComplianceJourneyPage with ComplianceJourneyEvidenceOrientationStrip (evaluation Sources + claim-discipline: posture summary only). Not an operator PageContextualHelp surface. Sibling TXX = /trust; SEC = /security-trust.marketing/learning ceiling below operator Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["ComplianceJourneyEvidenceOrientationStrip", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Compare two reviews. Owner backlog shorthand: CXX. */
  {
    rowId: "CXX",
    path: "/insights/compare-two-reviews",
    section: "Marketing",
    note: "Compare two reviews (Insights) - CompareForm with OperatorPageHeader PageContextualHelpButton (topic map comparison-replay; Category-1 registry), pair Cite Sources after Compare (ComparePairEvidenceCiteStrip), run pickers/results. Formerly /compare (retired; no redirect). Not a signed-record Sources trail by itself. Score 68/100 (2026-08-08) - comparison launcher at SCX Insights Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["CompareForm", "Score 68", "cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for Demo preview. Owner backlog shorthand: DPX. */
  {
    rowId: "DPX",
    path: "/demo/preview",
    section: "Marketing",
    note: "Demo preview (Marketing) - DemoPreviewMarketingPage with DemoPreviewEvidenceOrientationStrip (evaluation Sources + claim-discipline: sample demo only). Not an operator PageContextualHelp surface. Sibling DXX = /demo entry redirect.marketing/learning ceiling below operator Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["DemoPreviewEvidenceOrientationStrip", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for example-roi-bulletin marketing page. Owner backlog shorthand: EXA. */
  {
    rowId: "EXA",
    path: "/example-roi-bulletin",
    section: "Marketing",
    note: "Example ROI bulletin (Marketing) - ExampleRoiBulletinMarketingPage with ExampleRoiBulletinEvidenceOrientationStrip (evaluation Sources + claim-discipline: synthetic sample only). Admin-only preview gate + checked-in sample Markdown; robots noindex. Not an operator PageContextualHelp surface. Sibling SPE = executive-summary#pilot-roi-measurement. marketing/learning ceiling below operator Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["ExampleRoiBulletinEvidenceOrientationStrip", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Product FAQ marketing page. Owner backlog shorthand: FXX. */
  {
    rowId: "FXX",
    path: "/faq",
    section: "Marketing",
    note: "Product FAQ (Marketing) - MarketingFaqPageClient (max-w-6xl rail) with FaqEvidenceOrientationStrip (evaluation Sources + claim-discipline: evaluation orientation only), filtered sticky TOC + scroll spy, search status + auto-expand, hash deep links, related answer links, Sign-in and access category, sitemap + OG metadata. Not an operator PageContextualHelp surface. Score 58/100 (2026-08-08) - marketing FAQ ceiling below operator Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["MarketingFaqPageClient", "Sources", "Score 58", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for get-started marketing page. Owner backlog shorthand: GXX. */
  {
    rowId: "GXX",
    path: "/get-started",
    section: "Marketing",
    note: "Get started (Marketing) - GetStartedPageClient with GetStartedEvidenceOrientationStrip (evaluation Sources + claim-discipline: first-run orientation only). Not an operator PageContextualHelp surface. Legacy /quick-start retired toward this path.marketing/learning ceiling below operator Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["GetStartedPageClient", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for live-demo marketing page. Owner backlog shorthand: LXX. */
  {
    rowId: "LXX",
    path: "/live-demo",
    section: "Marketing",
    note: "Live demo (Marketing) - LiveDemoMarketingPage with LiveDemoEvidenceOrientationStrip (evaluation Sources + claim-discipline: fabricated guided walkthrough only). Not an operator PageContextualHelp surface. Sibling DPX = /demo/preview; TRY = /try.marketing/learning ceiling below operator Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["LiveDemoMarketingPage", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Pricing. Owner backlog shorthand: P. */
  {
    rowId: "P",
    path: "/pricing",
    section: "Marketing",
    note: "Pricing (Marketing) - PricingPageHero + tier grid/FAQ/quote with PricingEvidenceOrientationStrip (evaluation Sources + claim-discipline: commercial packaging only). Not an operator PageContextualHelp surface. Score 58/100 (2026-08-08) - marketing commercial packaging ceiling below operator Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["PricingEvidenceOrientationStrip", "Score 58", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Improvement planning. Owner backlog shorthand: PLA. */
  {
    rowId: "PLA",
    path: "/insights/improvement-planning",
    section: "Marketing",
    note: "Improvement planning (Marketing) - PlanningPageView with PageContextualHelp (Learn more omitted - no planning specialty; TB-2050; Category-1 registry), Sources follow-up chrome removed (TB-2092) + PlanningClaimDisciplineCallout (derived themes/plans, not diligence trail), empty-path composition (CTA + maturity/outcome orientation; hides zero KPIs/export until plans exist), priority-score explain, themes/plans tables, export readiness. Not a signed-record Sources trail. Score 68/100 (2026-08-08) - aggregate planning launcher at SCX Insights Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["PlanningPageView", "Score 68", "cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for Privacy Policy marketing page. Owner backlog shorthand: PRB. */
  {
    rowId: "PRB",
    path: "/privacy",
    section: "Marketing",
    note: "Privacy Policy (Marketing) - PrivacyPolicyPageClient with PrivacyEvidenceOrientationStrip (evaluation Sources + claim-discipline: legal notice only), TOC, related trust documents, focused reading. Not an operator PageContextualHelp surface.marketing/learning ceiling below operator Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["PrivacyPolicyPageClient", "PrivacyEvidenceOrientationStrip", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Quick scan. Owner backlog shorthand: QXX. */
  {
    rowId: "QXX",
    path: "/quick-scan",
    section: "Marketing",
    note: "Quick scan (Marketing) - QuickScanMarketingPage with QuickScanEvidenceOrientationStrip (evaluation Sources + claim-discipline: sample scan only). Not an operator PageContextualHelp surface.marketing/learning ceiling below operator Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Validate review / replay. Owner backlog shorthand: REP. */
  {
    rowId: "REP",
    path: "/internal/replay",
    section: "Marketing",
    note: "Validate review (Marketing catalog; operator Execute) - ReplayFormView with OperatorPageHeader PageContextualHelpButton (topic map comparison-replay; Category-1 registry), Learn more / claim-discipline orientation strip (Sources follow-up removed TB-2092), package picker + validation modes. Package re-validation hub - not a signed-record Sources trail. Sibling CXX = compare-two-reviews. Score 68/100 (2026-08-08) - validation-action hub at CXX Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["ReplayFormView", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Security & Trust marketing page. Owner backlog shorthand: SEC. */
  {
    rowId: "SEC",
    path: "/security-trust",
    section: "Marketing",
    note: "Assurance status (Marketing) - MarketingSecurityTrustView with SecurityTrustEvidenceOrientationStrip (evaluation Sources + claim-discipline: engagement metadata only; not diligence Sources trail / CPA SOC 2 / third-party pen-test), assurance ladder + public/NDA CTAs. Not an operator PageContextualHelp surface. Score 58/100 (2026-08-08) - marketing assurance ceiling below operator Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["MarketingSecurityTrustView", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for see-it marketing page. Owner backlog shorthand: SEE. */
  {
    rowId: "SEE",
    path: "/see-it",
    section: "Marketing",
    note: "See it (Marketing) - SeeItMarketingPage with SeeItHeroSection (first-viewport H1 + lead + single primary CTA + deliverable preview rail — TB-1281), SeeItEvidenceOrientationStrip below sample body (evaluation Sources + claim-discipline: fabricated sample proof only), quiet `/live-demo` ladder link in hero (TB-1282 / TB-1267), secondary row PDF only (no duplicate preview CTA). Not an operator PageContextualHelp surface. Sibling LXX = /live-demo; DPX = /demo/preview; SRH = /showcase/[runId]. Score 68/100 (2026-08-11) after TB-1281–TB-1282 hero budget + CTA ladder — marketing/learning ceiling below operator Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.; 2026-08-11 al-ui-rate: First viewport stacked proof strip + duplicate preview CTAs + manifest jargon; shipped TB-1281–TB-1282 (batch 21–24); open: TB-1280",
    noteMustContain: ["SeeItHeroSection", "TB-1281", "TB-1282", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Signup. Owner backlog shorthand: SIG. */
  {
    rowId: "SIG",
    path: "/signup",
    section: "Marketing",
    note: "Signup (Marketing) - SignupForm (TB-2010 disable-until-ready) or SignupAccessRequestForm (fields visible; zod email gate; explained disabled primary; data-use + Privacy line), SignupEvaluationAsideRail (what-happens-next steps, tenant/sign-in/no-payment posture, sample review), SignupEvidenceOrientationStrip (quiet Scope claim + Security & Trust; no Related strip; no FAQ/Trust/Sign-in body dupes; wordmark text-sm vs nav text-xs). Not an operator PageContextualHelp surface. Score 58/100 (2026-08-08) - marketing evaluation-access ceiling below operator Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["SignupEvidenceOrientationStrip", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Showcase run. Owner backlog shorthand: SRH. */
  {
    rowId: "SRH",
    path: "/showcase/[runId]",
    section: "Marketing",
    note: "Showcase run (Marketing) - ShowcaseEvidenceOrientationStrip (evaluation Sources + claim-discipline: sample showcase only) on showcase run surface. Not an operator PageContextualHelp surface.marketing/learning ceiling below operator Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Signup verify. Owner backlog shorthand: SVX. */
  {
    rowId: "SVX",
    path: "/signup/verify",
    section: "Marketing",
    note: "Signup verify (Marketing) - SignupVerifyClient email-verification handoff with SignupVerifyEvidenceOrientationStrip (evaluation Sources + claim-discipline: evaluation access only). Not an operator PageContextualHelp surface. Sibling SIG = /signup. Score 58/100 (2026-08-08) - marketing evaluation-access page marketing evaluation-access ceiling below operator Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["SignupVerifyEvidenceOrientationStrip", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Search review evidence. Owner backlog shorthand: SXX. */
  {
    rowId: "SXX",
    path: "/insights/search-review-evidence",
    section: "Marketing",
    note: "Search review evidence (Insights) - SearchPageView with PageContextualHelpButton (topic map; Category-1 registry), optional SearchReviewEvidenceCiteStrip when scoped to a review. Not a signed-record Sources trail by itself. Score 68/100 (2026-08-08) - retrieval launcher at SCX Insights Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for try marketing page. Owner backlog shorthand: TRY. */
  {
    rowId: "TRY",
    path: "/try",
    section: "Marketing",
    note: "Try (Marketing) - TryPage with TryEvidenceOrientationStrip (evaluation Sources + claim-discipline: frictionless sample only). Not an operator PageContextualHelp surface. Sibling GXX = /get-started; SRH = /showcase/[runId].marketing/learning ceiling below operator Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["TryPage", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Trust Center marketing page. Owner backlog shorthand: TXX. */
  {
    rowId: "TXX",
    path: "/trust",
    section: "Marketing",
    note: "Trust Center (Marketing) - MarketingTrustCenterBuyerBody with TrustCenterEvidenceOrientationStrip (evaluation Sources + claim-discipline: public assurance downloads only; not CPA SOC 2 / third-party pen-test unless linked artifact says so), public evidence pack + diligence contact. Not an operator PageContextualHelp surface. Score 58/100 (2026-08-08) - marketing Trust Center ceiling below operator Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["MarketingTrustCenterBuyerBody", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for why marketing page. Owner backlog shorthand: WHY. */
  {
    rowId: "WHY",
    path: "/why",
    section: "Marketing",
    note: "Why ArchLucid (Marketing) - WhyArchlucidMarketingView with WhyEvidenceOrientationStrip (evaluation Sources + claim-discipline: marketing comparison only). Not an operator PageContextualHelp surface. Sibling WXX = /welcome; WH = /why-archlucid learning twin; SEC = /security-trust.marketing/learning ceiling below operator Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["WhyArchlucidMarketingView", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for welcome marketing page. Owner backlog shorthand: WXX. */
  {
    rowId: "WXX",
    path: "/welcome",
    section: "Marketing",
    note: "Welcome (Marketing) - WelcomeMarketingPage with WelcomeEvidenceOrientationStrip (evaluation Sources + claim-discipline: marketing landing only). Not an operator PageContextualHelp surface. Sibling SEE = /see-it; GXX = /get-started; SEC = /security-trust.marketing/learning ceiling below operator Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["WelcomeMarketingPage", "Sources", "cannot improve further toward 80"],
  },
];

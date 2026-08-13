import { ARCHITECTURE_INTELLIGENCE_PATH } from "@/lib/architecture/architecture-intelligence-route";
import { ARCHITECTURES_NEW_PATH } from "@/lib/architecture/architecture-routes";
import type { UiRouteTrafficRow } from "@/lib/ui-route-traffic/types";

/** Traffic workbook rows for the `core-review` workbook section. */
export const CORE_REVIEW_TRAFFIC_ROWS: readonly UiRouteTrafficRow[] = [
  /** Traffic workbook row ID for Architecture intelligence. Owner backlog shorthand: AR2. */
  {
    rowId: "AIN",
    path: ARCHITECTURE_INTELLIGENCE_PATH,
    section: "Core review",
    note: "Architecture intelligence (Core review) - ArchitectureIntelligencePageClient with PageContextualHelpButton (topic map evidence-trail; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, closed-loop reasoning / golden harness / publish-to-findings. Sibling RNX = start review; EV = evidence-trail help; HFX = findings help. Reasoning operator surface - not a signed-record Sources trail.operator surface at GFN/RE Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["ArchitectureIntelligencePageClient", "cannot improve further toward 80"],
    sectionMustNotEqualLower: ["marketing"],
  },
  /** Traffic workbook row ID for Create architecture bootstrap. Owner backlog shorthand: ANE. */
  {
    rowId: "ANE",
    path: ARCHITECTURES_NEW_PATH,
    section: "Core review",
    note: "Create architecture (Core review) - NewArchitecturePage renders ArchitectureDraftWorkspace on ARCHITECTURE_NEW_DRAFT_SEGMENT (no ArchitectureCreationBootstrap interstitial; deferred server create until first saveable field). Hub Create architecture opens workspace directly. Sibling RNX = start review; COR = first-architecture-review help; AR/ARA = architectures list/detail. Creating/saving a draft does not start a review; not a signed-record Sources trail. Score 58/100 (2026-08-06) - +8 for removing duplicate draft-picker step and junk untitled drafts on bounce. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["NewArchitecturePage", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Architecture draft detail. Owner backlog shorthand: ARR (template ARA remains legacy `/architectures/[architectureId]`). */
  {
    rowId: "ARR",
    path: "/architecture/architectures/[architectureId]",
    section: "Core review",
    note: "Architecture draft detail (Core review) - ArchitectureDraftPage with, ArchitectureDraftWorkspace PageContextualHelpButton (topic map getting-started; Category-1 via pathIsArchitectureDraftDetail), draft form + Start a review handoff. Sibling ARA = architectures list; ANE = create bootstrap; RNX = start review. Legacy `/architectures/[architectureId]` bookmarks map here. Saving a draft does not start a review; not a signed-record Sources trail. Score 68/100 (2026-08-06) - drafting workspace Evidence chrome (below ANE create-bootstrap 58). Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail. operator surface at GFN/RE Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail.",
    noteMustContain: ["cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for Ask review questions. Owner backlog shorthand: ASK. */
  {
    rowId: "ASK",
    path: "/insights/ask-review-questions",
    section: "Core review",
    note: "Ask review questions (Core review) - AskPageContent with PageContextualHelpButton (topic map evidence-trail; Category-1 registry), thread/history panels. Formerly /ask (retired). Sibling GRA/INE = evidence-graph; SXX = search. Score 78/100 (2026-08-08) - grounded Q&A hard-caps short of full diligence packing. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for operator Overview home (`/`). Owner backlog shorthand: HOM. */
  {
    rowId: "HOM",
    path: "/",
    section: "Core review",
    note: "Operator Overview home (Core review) - OperatorHomePageView with remounted OperatorHomePageChrome (title/refresh/PageContextualHelpButton topic map first-architecture-review + Category-1 registry for `/`), phase-aware PilotCommandCenterCard (Do-this-next / dual-path / NBA; in-card help suppressed to avoid double icons), Recent reviews, ROI strip, sample explore, workspace context. TB-1667 HOM slice. Sibling RE = reviews; ARE = sponsor-dashboard; RNX = start review. Not a signed-record Sources trail by itself. Score 72/100 (2026-08-08) - Overview launcher at ARE/GFN Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["OperatorHomePageChrome", "PageContextualHelp", "Score 72", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Architecture reviews list. Owner backlog shorthand: RE. */
  {
    rowId: "RE",
    path: "/architecture/reviews",
    section: "Core review",
    note: "Architecture reviews hub (Core review) - RunsPageView with ReviewsHubHeaderActions PageContextualHelpButton (topic map review-packages; Category-1 registry), summary/inventory/drafts. Sibling RRE = review detail; RNX = start review; RRF = finding detail. Not a signed-record Sources trail by itself. Score 72/100 (2026-08-08) - core inventory launcher at ARE/GFN Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for Start review intake. Owner backlog shorthand: RNX. */
  {
    rowId: "RNX",
    path: "/architecture/reviews/new",
    section: "Core review",
    note: "Start review intake (Core review) - ReviewsNewPageChrome with OperatorPageHeader PageContextualHelpButton (topic map evidence-intake / Start review; Category-1 registry), path switcher wizards. Sibling REQ/REN/ENE = path tabs; RE = reviews hub. Not a signed-record Sources trail by itself. Score 68/100 (2026-08-08) - intake launcher below RE core band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["Score 68", "cannot improve further toward 80", "ReviewsNewPageChrome"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for Finding detail. Owner backlog shorthand: RRF. */
  {
    rowId: "RRF",
    path: "/architecture/reviews/[runId]/findings/[findingId]",
    section: "Core review",
    note: "Finding detail (Core review) - FindingDetailPageView with PageContextualHelpButton (topic map findings; Category-1 path matcher), wayfinding, policy citation hero, operational actions, Evidence trace CTA. Sibling ERU = evidence-trace. Not a full signed-record diligence Sources trail alone. Score 72/100 (2026-08-08) - core finding disposition at ARE/GFN Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for run provenance. Owner backlog shorthand: RRP. */
  {
    rowId: "RRP",
    path: "/architecture/reviews/[runId]/provenance",
    section: "Core review",
    note: "Run provenance (Core review) - ProvenancePageWorkspace with PageContextualHelpButton (topic map evidence-trail; Category-1 registry via /provenance path match), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, graph/timeline/table views. Coordinator linkage for one run - not a full diligence Sources export alone. Score 68/100 (2026-08-08) - single-run provenance below RRE core band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["ProvenancePageWorkspace", "Score 68", "cannot improve further toward 80"],
  },
];

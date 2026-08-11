/**
 * Page-scoped context-sensitive help (Category 1 IA taxonomy) — short answers to up to four
 * questions per operator route. Long-form guides remain on `/help/{slug}` via `page-help-topic-map.ts`.
 */

import { ADVISORY_SCANS_SCHEDULES_HREF } from "@/lib/advisory-scans-route";
import { REVIEWS_LIST_PATH } from "@/lib/architecture-routes";
import { canonicalizeLegacyOperatorRoutePath } from "@/lib/canonicalize-legacy-operator-route-path";
import {
  DIGESTS_HUB_PATH,
  DIGESTS_SCHEDULE_TAB_PATH,
  DIGESTS_SUBSCRIPTIONS_TAB_PATH,
  LEGACY_DIGESTS_HUB_PATH,
  LEGACY_DIGEST_SUBSCRIPTIONS_PATH,
} from "@/lib/digests-route-paths";
import { EXECUTIVE_DASHBOARD_HREF } from "@/lib/executive-dashboard-route";
import {
  GOVERNANCE_APPROVAL_QUEUE_PATH,
  GOVERNANCE_WORKSPACE_HEALTH_HREF,
} from "@/lib/governance-route-paths";
import { PLANNING_PATH } from "@/lib/planning-route";
import { PRODUCT_LEARNING_PATH } from "@/lib/product-learning-route";
import {
  INTERNAL_DEMO_READINESS_PATH,
  INTERNAL_DEPLOYMENT_STATUS_PATH,
  INTERNAL_RECOMMENDATION_LEARNING_PATH,
  INTERNAL_REPLAY_PATH,
  INTERNAL_TENANT_HEALTH_PATH,
  INTERNAL_TENANTS_PATH,
  INTERNAL_TRIAL_FUNNEL_PATH,
} from "@/lib/internal-ops-route-paths";
import {
  ARCHITECTURES_DRAFT_CONTEXTUAL_HELP,
  pathIsArchitectureDraftDetail,
} from "@/lib/architectures-draft-evidence-copy";
import {
  EVIDENCE_TRACE_CONTEXTUAL_HELP,
  pathIsFindingEvidenceTrace,
} from "@/lib/evidence-trace-contextual-help";
import {
  PROVENANCE_CONTEXTUAL_HELP,
  pathIsRunProvenance,
} from "@/lib/provenance-evidence-copy";

/** Optional in-app deep link for a Category-1 field (TB-2049 Digests golden / TB-2051). */
export type PageContextualHelpAction = {
  readonly label: string;
  readonly href: string;
};

export type PageContextualHelpEntry = {
  readonly whatIsThisPage: string;
  readonly whatToDoNext: string;
  readonly whyEmpty?: string;
  readonly whereToConfigurePrerequisite?: string;
  readonly whatToDoNextAction?: PageContextualHelpAction;
  readonly whereToConfigureAction?: PageContextualHelpAction;
};

type PageContextualHelpRow = {
  readonly prefix: string;
  readonly entry: PageContextualHelpEntry;
};

const DIGESTS_HUB_CONTEXTUAL_HELP: PageContextualHelpEntry = {
  whatIsThisPage:
    "Send scheduled summaries of review activity, governance signals, findings, and advisory scans.",
  whatToDoNext: "Open the Schedule tab to set timing and recipients, then preview or send a test digest.",
  whyEmpty: "Generated digests appear here after a schedule and recipients are configured.",
  whereToConfigurePrerequisite:
    "Recipient subscriptions and executive rollup settings live on the Schedule tab.",
  whatToDoNextAction: {
    label: "Open Schedule tab",
    href: DIGESTS_SCHEDULE_TAB_PATH,
  },
  whereToConfigureAction: {
    label: "Open Schedule tab",
    href: DIGESTS_SCHEDULE_TAB_PATH,
  },
};

const PAGE_CONTEXTUAL_HELP: readonly PageContextualHelpRow[] = [
  {
    // Exact `/` only — matcher uses path === prefix; startsWith(`${prefix}/`) is `//` and does not steal other routes.
    prefix: "/",
    entry: {
      whatIsThisPage:
        "Workspace Overview — start or resume architecture reviews and see recent activity from one command center.",
      whatToDoNext: "Start a review, resume a draft, or explore a sample workspace.",
      whyEmpty: "Recent reviews and metrics appear after you create or finalize architecture reviews.",
      whereToConfigurePrerequisite: "Switch workspace or project scope from the header switcher when you work across teams.",
    },
  },
  {
    prefix: "/architecture/reviews",
    entry: {
      whatIsThisPage: "Create, refine, evaluate, and approve architecture reviews from one hub.",
      whatToDoNext: "Start a review, resume a draft, or explore a sample workspace.",
      whyEmpty: "Summary metrics populate after you start or finalize architecture reviews.",
      whereToConfigurePrerequisite: "Switch workspace or project scope from the header switcher.",
    },
  },
  {
    prefix: "/insights/architecture-scorecard",
    entry: {
      whatIsThisPage:
        "Architecture scorecard — workspace throughput tiles and a directional review-time savings model for pilot discussions.",
      whatToDoNext:
        "Finalize reviews to populate tiles, then tune ROI assumptions or open ROI summary for sponsor exports.",
      whyEmpty: "Tiles stay empty until you finalize architecture reviews in this workspace.",
      whereToConfigurePrerequisite:
        "Save ROI assumptions on this page when you have Execute authority, or use workspace baseline settings.",
    },
  },
  {
    prefix: EXECUTIVE_DASHBOARD_HREF,
    entry: {
      whatIsThisPage:
        "Executive dashboard — portfolio ROI trends, sponsor exports, and workspace-health KPI tiles for governance posture in the current scope.",
      whatToDoNext:
        "Review KPI tiles and sponsor exports, then open Workspace health or Decisions needed for governance follow-up.",
      whyEmpty:
        "Tiles stay at zero until you finalize reviews and governance activity exists in the current workspace scope.",
      whereToConfigurePrerequisite:
        "Switch workspace or project scope from the header switcher — figures never roll up across workspaces.",
      whatToDoNextAction: {
        label: "Open approval queue",
        href: GOVERNANCE_APPROVAL_QUEUE_PATH,
      },
    },
  },
  {
    prefix: "/governance/findings",
    entry: {
      whatIsThisPage:
        "Track architecture risks from accepted findings, waivers, exceptions, and governance decisions.",
      whatToDoNext: "Assign owners, review aging risks, and clear expiring exceptions.",
      whyEmpty: "Rows appear after findings are accepted or governance decisions are recorded in reviews.",
      whereToConfigurePrerequisite:
        "Policy packs and governance workflow settings shape what becomes a tracked risk.",
    },
  },
  {
    prefix: "/insights/ask-review-questions",
    entry: {
      whatIsThisPage:
        "Ask plain-language questions about a finalized review; answers use the signed record and cite findings when available.",
      whatToDoNext:
        "Select a review, ask about risk or evidence, then open cited findings or the evidence trail under the answer.",
      whyEmpty: "Threads appear after you ask a question against a selected review.",
      whereToConfigurePrerequisite: "Finalize or open a review so Ask can ground answers in its evidence.",
    },
  },
  {
    prefix: "/insights/compare-two-reviews",
    entry: {
      whatIsThisPage:
        "Compare two finalized reviews to see what changed in scope, findings, decisions, governance, and evidence.",
      whatToDoNext:
        "Pick baseline and updated reviews, run Compare, then open Sources for each side before briefing sponsors.",
      whyEmpty: "Results appear after you compare two finalized reviews.",
      whereToConfigurePrerequisite: "Finalize at least two reviews in this workspace first.",
    },
  },
  {
    // TB-2050 — Learn more omitted (no specialty); Category-1 still mounts.
    prefix: "/insights/patterns",
    entry: {
      whatIsThisPage:
        "Browse anonymized architecture patterns with adoption, risk, and governance signals from thresholded aggregates.",
      whatToDoNext:
        "Filter the catalog, open a pattern detail, or start a review when a pattern fits your next change.",
      whyEmpty:
        "Patterns appear when anonymized aggregates meet privacy thresholds, or when sample catalog data is shown.",
      whereToConfigurePrerequisite:
        "Live aggregates need enough finalized reviews across anonymized tenants to meet the privacy threshold.",
    },
  },
  {
    prefix: INTERNAL_REPLAY_PATH,
    entry: {
      whatIsThisPage:
        "Validate review — re-check a finalized architecture review (reconstruct, rebuild outputs, or full regeneration).",
      whatToDoNext:
        "Pick a finalized review, choose a validation depth, run the check, then open the review or Compare when you need diffs.",
      whyEmpty: "Validation results appear after you run a check on a selected architecture review.",
      whereToConfigurePrerequisite: "Finalize at least one review in this workspace first; Admin Execute access may be required.",
    },
  },
  {
    prefix: "/insights/search-review-evidence",
    entry: {
      whatIsThisPage:
        "Search findings, decisions, and signed review evidence across the workspace index, optionally scoped to one review.",
      whatToDoNext:
        "Enter a phrase, optionally limit to a review, then open the hit, Evidence trail, or Sources cites before briefing.",
      whyEmpty: "Matches appear after committed review evidence is indexed and your query finds relevant chunks.",
      whereToConfigurePrerequisite: "Finalize reviews so findings and signed records are available to search.",
    },
  },
  {
    prefix: "/help/data-handling",
    entry: {
      whatIsThisPage:
        "Explain how review evidence is handled, what stays in your tenant, and how three-layer isolation works.",
      whatToDoNext:
        "Open Trust Center or Assurance status for diligence artifacts, then review Sources before sponsor briefings.",
      whyEmpty: "This guide always shows isolation and data-handling content when the help topic loads.",
      whereToConfigurePrerequisite: "Confirm residency and subprocessors during procurement with your account team.",
    },
  },
  {
    prefix: "/help/dpa-template",
    entry: {
      whatIsThisPage:
        "Working Data Processing Agreement negotiation template for counsel — not a countersigned DPA.",
      whatToDoNext:
        "Open Trust Center for the diligence pack, review Subprocessors, then expand the full template with counsel.",
      whyEmpty: "Orientation and CTAs always appear when this help topic loads; expand the disclosure for clauses.",
      whereToConfigurePrerequisite: "Execute a DPA only through your procurement counsel and account team.",
    },
  },
  {
    prefix: "/help/soc2-self-assessment",
    entry: {
      whatIsThisPage:
        "Owner SOC 2 Trust Services Criteria self-assessment — not a CPA Type I or Type II attestation.",
      whatToDoNext:
        "Open Trust Center for the diligence pack, use CAIQ/SIG for questionnaires, then read the control summary as readiness mapping only.",
      whyEmpty: "Orientation and CTAs always appear when this help topic loads.",
      whereToConfigurePrerequisite:
        "CPA attestation and third-party pen-test publication remain owner programs outside this page.",
    },
  },
  {
    prefix: "/help/path-chooser",
    entry: {
      whatIsThisPage:
        "Map your current goal to one primary next action for evaluate, pilot, procurement, sponsor, or engineering support.",
      whatToDoNext:
        "Pick the matching goal branch, open the primary cite, then use Sources before treating orientation as diligence.",
      whyEmpty: "Branches always appear when this help topic loads.",
      whereToConfigurePrerequisite: "Start or finalize a review when your goal needs product evidence, not just orientation.",
    },
  },
  {
    prefix: "/help/enterprise-onboarding",
    entry: {
      whatIsThisPage:
        "Enterprise onboarding checklist - configure SSO, roles, governance, policy packs, audit export, and optional Azure evidence for a hosted tenant.",
      whatToDoNext:
        "Open Identity providers for SSO, Users and roles for access, then Assurance status for assurance orientation.",
      whyEmpty: "This guide is always available; live identity and role surfaces appear after workspace configuration.",
      whereToConfigurePrerequisite:
        "SSO and role changes need System Admin authority in the current workspace.",
    },
  },
  {
    prefix: "/help/pilot-roi-model",
    entry: {
      whatIsThisPage:
        "Pilot ROI model - how sponsor ROI figures are labeled, sourced, and kept buyer-safe in proof packets.",
      whatToDoNext:
        "Open Architecture scorecard or ROI summary for live numbers, or Workspace baseline when anchors need capture.",
      whyEmpty: "This guide is always available; scorecard and baseline surfaces populate after reviews and tenant setup.",
      whereToConfigurePrerequisite:
        "Baseline and scorecard numbers need a role that can read tenant settings and finalized reviews.",
    },
  },
  {
    prefix: "/help/pilot-feedback",
    entry: {
      whatIsThisPage:
        "Pilot feedback help — human judgment signals, ranked improvement opportunities, and how triage differs from recommendation learning.",
      whatToDoNext:
        "Open Pilot feedback for live aggregates, then Improvement planning when opportunities become themes or draft plans.",
      whyEmpty: "This guide is always available; live feedback rows appear after architects capture review outcomes.",
      whereToConfigurePrerequisite:
        "Pilot feedback is an Internal Ops surface — System Admin authority is typically required.",
      whatToDoNextAction: {
        label: "Open Pilot feedback",
        href: PRODUCT_LEARNING_PATH,
      },
      whereToConfigureAction: {
        label: "Open Improvement planning",
        href: PLANNING_PATH,
      },
    },
  },
  {
    prefix: "/help/executive-summary",
    entry: {
      whatIsThisPage:
        "Executive summary help — sponsor-safe pilot proof, ROI framing, and what executives should expect in exports.",
      whatToDoNext:
        "Open the live executive value report or dashboard, then review Pilot ROI model when methodology needs clarity.",
      whyEmpty: "This guide is always available; live sponsor reports populate after finalized reviews exist.",
      whereToConfigurePrerequisite:
        "Sponsor exports need a role that can read finalized architecture reviews in this workspace.",
    },
  },
  {
    prefix: "/help/policy-pack-delta-demo",
    entry: {
      whatIsThisPage:
        "SE and Admin demo script showing how stricter policy-pack enforcement changes finalize-gate outcomes on one review.",
      whatToDoNext:
        "Open policy packs, run the dry-run arc, then cite the audit trail before treating simulation as certification.",
      whyEmpty: "This runbook always shows the demo arc when the help topic loads.",
      whereToConfigurePrerequisite: "Use a committed review with findings and Admin access to policy packs and audit export.",
    },
  },
  {
    prefix: "/help/configuration-reference",
    entry: {
      whatIsThisPage:
        "Admin configuration task guide for SSO, identity providers, and production-like hosting posture.",
      whatToDoNext:
        "Open the matching settings CTA (SSO or identity providers), then expand the key catalog appendix only if needed.",
      whyEmpty: "This guide always shows configuration tasks when the help topic loads.",
      whereToConfigurePrerequisite: "Admin access to identity settings and the configuration summary.",
    },
  },
  {
    prefix: "/help/cli-usage",
    entry: {
      whatIsThisPage:
        "CLI usage engineering runbook — non-interactive archlucid commands, environment variables, exit codes, and API starter fixtures.",
      whatToDoNext:
        "Prefer customer Troubleshooting and System health first, then use CLI detail; open engineering troubleshooting when logs need deeper triage.",
      whyEmpty: "This reference always shows when the help topic loads.",
      whereToConfigurePrerequisite:
        "CLI and API automation need credentials and workspace scope configured for the target environment.",
    },
  },
  {
    prefix: "/help/first-review",
    entry: {
      whatIsThisPage:
        "Admin and SE printable first-run evidence checklist for Azure extractor Tier 1, finalize, and sponsor-packet proof.",
      whatToDoNext:
        "Send customer architects to Your first architecture review, start a demo review when ready, then cite the audit trail.",
      whyEmpty: "This checklist always shows when the help topic loads.",
      whereToConfigurePrerequisite: "Admin access plus a workspace that can run extractor ingest and finalize.",
    },
  },
  {
    prefix: "/help/first-value-20-minutes",
    entry: {
      whatIsThisPage:
        "Admin SE time-boxed checklist for first value in about 20 minutes when platform wiring is already green.",
      whatToDoNext:
        "Send customers to Your first architecture review; use this runbook only for Admin SE proof collection.",
      whyEmpty: "Orientation and the 20-minute checklist always show when this Admin help topic loads.",
      whereToConfigurePrerequisite: "Admin access with healthy API and persistence before starting the time box.",
    },
  },
  {
    prefix: "/help/developer-troubleshooting",
    entry: {
      whatIsThisPage:
        "Admin engineering troubleshooting runbook for CLI, environment, and log triage after customer Troubleshooting.",
      whatToDoNext:
        "Prefer Customer Troubleshooting and System health first, then use eng CLI/env detail; open Report a problem when filing a ticket.",
      whyEmpty: "This runbook always shows when the help topic loads for Admins.",
      whereToConfigurePrerequisite: "Admin access; Architects should use the customer Troubleshooting guide instead.",
    },
  },
  {
    prefix: "/help/governance-api-contracts",
    entry: {
      whatIsThisPage:
        "Admin HTTP and OpenAPI contract reference for integrators — not the buyer Governance approval FAQ.",
      whatToDoNext:
        "Open CLI usage or Configuration reference for tooling, or Governance approval if you need buyer approval workflows.",
      whyEmpty: "Orientation and stripped contract reference always show when this Admin help topic loads.",
      whereToConfigurePrerequisite: "Admin access; treat OpenAPI as the contract of record when prose disagrees.",
    },
  },
  {
    prefix: "/governance/standards-and-rules",
    entry: {
      whatIsThisPage:
        "Inspect standards and policy rules applied to a review, including enforcement mode, source pack, and linked evidence.",
      whatToDoNext:
        "Open linked findings or the evidence trail for a rule, then export a resolution snapshot when you need a citeable record.",
      whyEmpty: "Rules appear after a policy pack or governance configuration applies checks to a review.",
      whereToConfigurePrerequisite: "Assign and order policy packs for the current workspace and project scope.",
    },
  },
  {
    prefix: "/governance/policy-packs",
    entry: {
      whatIsThisPage:
        "Review policy pack rules, versions, and how packs apply to architecture reviews in this workspace.",
      whatToDoNext:
        "Open a pack to inspect rules, return to the library to compare packs, or apply a pack when starting a review.",
      whyEmpty: "Packs appear after the library is populated for this workspace.",
      whereToConfigurePrerequisite:
        "Policy packs respect the workspace and project selected in the header switcher.",
    },
  },
  {
    prefix: "/governance/decision-register",
    entry: {
      whatIsThisPage:
        "Browse architecture decisions locked with signed review records — category, confidence, findings, and lineage.",
      whatToDoNext:
        "Filter by date or category, open a decision card, then follow the linked review or findings when needed.",
      whyEmpty: "Decisions appear after reviews are signed with recorded architecture decisions.",
      whereToConfigurePrerequisite:
        "Decision register respects the workspace and project selected in the header switcher.",
      whatToDoNextAction: {
        label: "Open architecture reviews",
        href: REVIEWS_LIST_PATH,
      },
    },
  },
  {
    prefix: "/architecture/reviews/new",
    entry: {
      whatIsThisPage:
        "Start an architecture review by choosing an intake path and submitting evidence for analysis.",
      whatToDoNext:
        "Pick quick, guided, or detailed intake, complete the required fields, then submit to create the review.",
      whyEmpty: "Path choices appear immediately; review results appear after you submit intake.",
      whereToConfigurePrerequisite:
        "Reviews use the workspace and project selected in the header switcher.",
    },
  },
  {
    prefix: "/architecture/architectures",
    entry: {
      whatIsThisPage:
        "Architectures list - browse and resume saved architecture drafts before filing evidence for review.",
      whatToDoNext:
        "Open a draft to continue editing, or Create architecture when you need a new brief, then Start a review when ready.",
      whyEmpty: "Drafts appear after the architectures API responds; empty lists mean no drafts are saved yet.",
      whereToConfigurePrerequisite:
        "Drafting uses the workspace and project selected in the header switcher; listing drafts does not start a review.",
    },
  },
  {
    prefix: "/architecture/architectures/new",
    entry: {
      whatIsThisPage:
        "Create architecture - start a new architecture draft or continue a saved draft before filing evidence for review.",
      whatToDoNext:
        "Start a new draft or resume a recent one, then open Start a review when the brief is ready for evidence intake.",
      whyEmpty:
        "Recent drafts appear after the architectures API responds; empty lists mean no drafts are saved yet.",
      whereToConfigurePrerequisite:
        "Drafting uses the workspace and project selected in the header switcher; creating a draft does not start a review.",
    },
  },
  {
    prefix: "/architecture/architecture-intelligence",
    entry: {
      whatIsThisPage:
        "Architecture intelligence - run closed-loop architecture reasoning or the golden regression harness against a free-form description, then publish findings into the workspace review trail when ready.",
      whatToDoNext:
        "Paste or edit a description, choose Run architecture reasoning or Run golden harness, then use Publish findings into review when the output is ready to attach as findings.",
      whyEmpty:
        "Results appear after a successful run; empty panels mean you have not submitted a description yet or the last run returned no structured output.",
      whereToConfigurePrerequisite:
        "Requires an authenticated Core API session and LLM/reasoning configuration for the tenant; sibling Start a review files evidence for a full review pipeline.",
    },
  },
  {
    prefix: "/architecture/first-review-guide",
    entry: {
      whatIsThisPage:
        "First review guide - checklist onboarding for your first architecture review, including required setup and optional workspace steps.",
      whatToDoNext:
        "Clear required setup blockers, follow the walkthrough next step, then Start a review when the workspace is ready for evidence intake.",
      whyEmpty: "Progress updates as you complete walkthrough steps; empty optional setup means those integrations are not required yet.",
      whereToConfigurePrerequisite:
        "Required setup uses the current workspace and project scope from the header switcher.",
    },
  },
  {
    prefix: "/governance/audit",
    entry: {
      whatIsThisPage:
        "Search and export workspace audit events for reviews, governance actions, and integrity checks in this workspace.",
      whatToDoNext:
        "Filter by review or action, refresh the trail, then export or open the related architecture review when needed.",
      whyEmpty: "Events appear after architects take actions that the audit coverage matrix records.",
      whereToConfigurePrerequisite:
        "Audit retention and export privileges follow workspace role and enterprise controls.",
    },
  },
  {
    prefix: "/administration/system-health",
    entry: {
      whatIsThisPage:
        "Confirm workspace service health, required dependencies, and deployment identity for this tenant.",
      whatToDoNext:
        "Refresh readiness, then open Connection status when a dependency needs follow-up.",
      whyEmpty: "Health rows appear after the readiness probe returns for this workspace.",
      whereToConfigurePrerequisite:
        "Dependency connectivity is configured under Administration → Connection status.",
      whatToDoNextAction: {
        label: "Open Connection status",
        href: "/administration/connection-status",
      },
      whereToConfigureAction: {
        label: "Open Connection status",
        href: "/administration/connection-status",
      },
    },
  },
  {
    prefix: "/administration/connection-status",
    entry: {
      whatIsThisPage:
        "Connection status - see which notification, ticketing, publishing, and delivery integrations are ready, recommended, or optional for this workspace.",
      whatToDoNext:
        "Open a connector that needs configuration, or System health when dependency checks need follow-up.",
      whyEmpty:
        "Readiness tiles appear after connector probes load; optional connectors stay listed until configured.",
      whereToConfigurePrerequisite:
        "Configuring connectors needs a role that can manage workspace integrations.",
      whatToDoNextAction: {
        label: "Open System health",
        href: "/administration/system-health",
      },
    },
  },
  {
    prefix: "/administration/developer",
    entry: {
      whatIsThisPage:
        "Internal developer tools - evaluate branded themes and try CLI demos for workspace diagnostics; not part of the customer settings navigation.",
      whatToDoNext:
        "Use the theme selector for visual evaluation, try the CLI demo card when validating local tooling, then open Engineering troubleshooting or System health for live runbooks.",
      whyEmpty:
        "Theme and CLI cards always render for authorized architects; empty results only appear inside the CLI demo after a command returns no output.",
      whereToConfigurePrerequisite:
        "Requires an authenticated Admin session with advanced/developer route access; customer settings hubs do not deep-link here.",
    },
  },
  {
    prefix: DIGESTS_HUB_PATH,
    entry: DIGESTS_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: LEGACY_DIGESTS_HUB_PATH,
    entry: DIGESTS_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: LEGACY_DIGEST_SUBSCRIPTIONS_PATH,
    entry: DIGESTS_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: "/help/digests",
    entry: {
      whatIsThisPage:
        "Architecture digests — how scheduled digest summaries are configured, delivered, and browsed.",
      whatToDoNext: "Open the Digests hub Schedule tab to set cadence and recipients, then manage subscriptions.",
      whyEmpty: "This guide is always available; generated digests appear after schedule and recipients are configured.",
      whereToConfigurePrerequisite:
        "Cadence and recipients live on Digests Schedule; destinations live on Subscriptions.",
      whatToDoNextAction: {
        label: "Open Schedule tab",
        href: DIGESTS_SCHEDULE_TAB_PATH,
      },
      whereToConfigureAction: {
        label: "Open Subscriptions tab",
        href: DIGESTS_SUBSCRIPTIONS_TAB_PATH,
      },
    },
  },
  {
    prefix: "/insights/improvement-planning/plans",
    entry: {
      whatIsThisPage:
        "Review one prioritized improvement plan derived from captured feedback, including status and linked themes.",
      whatToDoNext:
        "Return to Improvement planning for peer plans, or open reviews and findings when this plan needs follow-up.",
      whyEmpty: "Plan detail appears after a plan is generated from captured feedback.",
      whereToConfigurePrerequisite:
        "Plans respect the workspace and project selected in the header switcher.",
      whatToDoNextAction: {
        label: "Open Improvement planning",
        href: PLANNING_PATH,
      },
    },
  },
  {
    prefix: "/insights/improvement-planning",
    entry: {
      whatIsThisPage:
        "Convert review feedback into recurring themes, prioritized improvement plans, and exportable summaries.",
      whatToDoNext: "Capture review feedback or run pilot feedback analysis to generate themes and plans.",
      whyEmpty: "Themes and plans appear after feedback is captured and analyzed.",
      whereToConfigurePrerequisite:
        "Planning insights respect the workspace and project selected in the header switcher.",
      whatToDoNextAction: {
        label: "Open Pilot feedback",
        href: PRODUCT_LEARNING_PATH,
      },
    },
  },
  {
    // TB-2050 — Learn more omitted (no specialty); Category-1 still mounts.
    prefix: "/insights/impact-preview",
    entry: {
      whatIsThisPage:
        "Estimate before-and-after effects of proposed architecture changes against a finalized review baseline.",
      whatToDoNext: "Select a finalized review baseline, set comparison scope, then run the impact preview.",
      whyEmpty: "Preview results appear after you choose a baseline review and run a simulation.",
      whereToConfigurePrerequisite:
        "Impact preview needs at least one finalized architecture review in this workspace.",
      whatToDoNextAction: {
        label: "Open architecture reviews",
        href: REVIEWS_LIST_PATH,
      },
      whereToConfigureAction: {
        label: "Open architecture reviews",
        href: REVIEWS_LIST_PATH,
      },
    },
  },
  {
    prefix: "/internal/product-learning",
    entry: {
      whatIsThisPage:
        "Pilot feedback — aggregate review signals, ranked improvement opportunities, and exports for product triage.",
      whatToDoNext:
        "Filter by time range, open Improvement planning for themes and plans, or start a review when the dataset is empty.",
      whyEmpty: "Feedback rows appear after architects capture review outcomes in this workspace.",
      whereToConfigurePrerequisite:
        "Pilot feedback is an Internal Ops surface — System Admin authority is typically required.",
      whatToDoNextAction: {
        label: "Open Improvement planning",
        href: PLANNING_PATH,
      },
    },
  },
  {
    prefix: "/why-archlucid",
    entry: {
      whatIsThisPage:
        "Why ArchLucid — internal demo/proof page with seeded telemetry, sponsor pack, and first-value report for the demo review.",
      whatToDoNext:
        "Inspect snapshot and sponsor pack sections, open marketing /why for buyer comparison, or Assurance status for assurance orientation.",
      whyEmpty: "Sections populate after the demo tenant snapshot and related read endpoints load.",
      whereToConfigurePrerequisite:
        "A seeded demo review is required; Claims/Retail labels stay withheld until the demo identity is unambiguous.",
    },
  },
  {
    prefix: "/demo/explain",
    entry: {
      whatIsThisPage:
        "Demo explain — example provenance graph and citations-bound explanation for a seeded architecture review.",
      whatToDoNext:
        "Inspect the provenance and explanation panels, then start a real review or open Validate review for live packages.",
      whyEmpty: "Panels appear after the demo explain API returns a seeded review payload.",
      whereToConfigurePrerequisite:
        "A seeded demo tenant review is required; this route stays hidden from buyer nav when demo explain is unavailable.",
    },
  },
  {
    prefix: "/governance/advisory-scans",
    entry: {
      whatIsThisPage: "Generate prioritized follow-up recommendations from finalized reviews.",
      whatToDoNext: "Select a finalized review and generate a scan, or open Schedules for recurring runs.",
      whyEmpty: "Scans appear after you generate one from a finalized review.",
      whereToConfigurePrerequisite:
        "Finalize a review first; optional baseline comparison highlights drift.",
      whatToDoNextAction: {
        label: "Open Schedules tab",
        href: ADVISORY_SCANS_SCHEDULES_HREF,
      },
      whereToConfigureAction: {
        label: "Open architecture reviews",
        href: REVIEWS_LIST_PATH,
      },
    },
  },
  {
    prefix: "/insights/executive-summary",
    entry: {
      whatIsThisPage:
        "Sponsor executive summary — period preview of finalized reviews, findings, governance activity, and directional ROI for exports.",
      whatToDoNext: "Set the report period, refresh the preview, then generate sponsor exports when data is ready.",
      whyEmpty: "The preview fills in after you finalize reviews in the selected period.",
      whereToConfigurePrerequisite: "ROI estimates use baseline settings from workspace configuration.",
    },
  },
  {
    prefix: "/insights/pilot-outcomes",
    entry: {
      whatIsThisPage:
        "Pilot outcomes — period summary of finalized review activity, material findings, governance decisions, and measurable pilot results.",
      whatToDoNext:
        "Set the reporting period, apply it, then open Executive summary or ROI summary when you need sibling sponsor packaging.",
      whyEmpty: "Outcomes fill in after you finalize architecture reviews in the selected period.",
      whereToConfigurePrerequisite:
        "Report windows use the current tenant, workspace, and project selected in the shell header.",
    },
  },
  {
    prefix: "/governance/alert-rules",
    entry: {
      whatIsThisPage:
        "Configure when completed reviews raise alerts, where notifications are delivered, advanced composite rules, and simulation tests.",
      whatToDoNext:
        "Set Conditions first, then open Notifications to add destinations, or use Test alerts to simulate behavior.",
      whyEmpty: "Rules and destinations appear after you create them for this workspace.",
      whereToConfigurePrerequisite:
        "Alert delivery often needs channel integrations (email, Teams, Slack, or webhooks) configured under Integrations.",
    },
  },
  {
    prefix: "/governance/approval-queue",
    entry: {
      whatIsThisPage:
        "Governance approval queue — submit, approve, or reject architecture-review decisions for this workspace.",
      whatToDoNext:
        "Load a review context, submit an approval request when ready, then approve or reject with an audit-friendly comment.",
      whyEmpty: "Pending requests appear after a finalized architecture review is submitted for governance decision.",
      whereToConfigurePrerequisite:
        "Open Findings or Workspace health when you need triage or KPI context before deciding.",
      whatToDoNextAction: {
        label: "Open findings",
        href: "/governance/findings",
      },
      whereToConfigureAction: {
        label: "Open workspace health",
        href: GOVERNANCE_WORKSPACE_HEALTH_HREF,
      },
    },
  },
  {
    prefix: "/governance/approval-requests",
    entry: {
      whatIsThisPage:
        "Approval lineage — inspect how an approval request links to its review, findings, risk posture, and signed-record version.",
      whatToDoNext:
        "Open the linked review or findings, return to the approval queue, or check Audit when you need the activity trail.",
      whyEmpty: "Lineage appears after an approval request exists for a finalized architecture review.",
      whereToConfigurePrerequisite:
        "Submit or open an approval from the governance approval queue after a review is ready for decision.",
      whatToDoNextAction: {
        label: "Open approval queue",
        href: GOVERNANCE_APPROVAL_QUEUE_PATH,
      },
    },
  },
  {
    prefix: "/governance/signed-records",
    entry: {
      whatIsThisPage:
        "Signed review record — the finalized package of decisions, findings, and downloadable artifacts for one architecture review.",
      whatToDoNext:
        "Review the summary and decisions, open related findings, or export the review bundle when downloads are ready.",
      whyEmpty: "A signed review record appears after you finalize an architecture review.",
      whereToConfigurePrerequisite:
        "Finalize a review from the architecture review workspace before opening its signed record.",
    },
  },
  {
    prefix: INTERNAL_TENANT_HEALTH_PATH,
    entry: {
      whatIsThisPage:
        "Tenant health — internal customer-success scores for engagement, governance activity, and pilot funnel stage by tenant scope.",
      whatToDoNext:
        "Refresh the table, sort attention to low engagement rows, then open System health or Audit when a tenant needs follow-up.",
      whyEmpty: "Rows appear after tenant scopes have recorded review or governance activity.",
      whereToConfigurePrerequisite:
        "This page requires tenant administrator access; customer tenants never see other tenants here.",
    },
  },
  {
    prefix: INTERNAL_RECOMMENDATION_LEARNING_PATH,
    entry: {
      whatIsThisPage:
        "Recommendation learning — inspect and rebuild the recommendation-ranking profile from historical advisory outcomes.",
      whatToDoNext:
        "Refresh eligibility counts, preview a rebuild when enough outcomes exist, then open Advisory scans or Pilot feedback for live trails.",
      whyEmpty: "A profile appears after eligible accepted, deferred, rejected, or implemented outcomes exist in scope.",
      whereToConfigurePrerequisite:
        "Preview and rebuild require ExecuteAuthority; this Internal Ops surface typically needs System Admin access.",
    },
  },
  {
    prefix: INTERNAL_TENANTS_PATH,
    entry: {
      whatIsThisPage:
        "Tenants — provision new tenant scopes or shut off existing tenants without deleting retained data.",
      whatToDoNext:
        "Create a tenant when onboarding a customer, shut off access when needed, then open Tenant health or Audit for follow-up.",
      whyEmpty: "Rows appear after platform administrators provision tenant registry entries.",
      whereToConfigurePrerequisite:
        "This page requires tenant administrator access; customer tenants never see other tenants here.",
    },
  },
  {
    prefix: INTERNAL_TRIAL_FUNNEL_PATH,
    entry: {
      whatIsThisPage:
        "Trial funnel — internal conversion KPIs and cohort rows for trial-stage progress across tenants.",
      whatToDoNext:
        "Adjust the date range, refresh, then open Tenant health or Billing when a cohort needs follow-up.",
      whyEmpty: "Cohort rows appear after trial tenants record signup and review activity in the selected period.",
      whereToConfigurePrerequisite:
        "This page requires tenant administrator access; customer tenants never see other tenants here.",
    },
  },
  {
    prefix: INTERNAL_DEMO_READINESS_PATH,
    entry: {
      whatIsThisPage:
        "Demo readiness - internal employee diagnostic checklist for buyer CTO demo preflight across this workspace.",
      whatToDoNext:
        "Run the readiness checks, open System health when a dependency fails, or Trial funnel when conversion context is needed.",
      whyEmpty: "Checklist rows appear after the internal readiness probe returns for this deployment.",
      whereToConfigurePrerequisite:
        "This page requires tenant administrator access; customer tenants never see this diagnostic.",
    },
  },
  {
    prefix: INTERNAL_DEPLOYMENT_STATUS_PATH,
    entry: {
      whatIsThisPage:
        "Deployment status - internal release identity, health, and BUILD_ID agreement across frontend, API, and worker.",
      whatToDoNext:
        "Refresh status, open System health when readiness fails, or Diagnostics dashboard for deeper platform probes.",
      whyEmpty: "Identity fields appear after the admin deployment-status probe returns for this environment.",
      whereToConfigurePrerequisite:
        "This page requires ArchLucid personnel access; customer tenants never see deployment identity here.",
    },
  },
  {
    prefix: "/help",
    entry: {
      whatIsThisPage:
        "In-app help topic — curated product documentation for architects and evaluators in this workspace.",
      whatToDoNext:
        "Read the topic, then open Getting started or Troubleshooting when you need the next step.",
      whyEmpty: "Help topics are always available; live workspace data appears on workspace surfaces after reviews start.",
      whereToConfigurePrerequisite:
        "Workspace and project scope come from the shell header switcher once you are signed in.",
      whatToDoNextAction: {
        label: "Open Getting started",
        href: "/help/getting-started",
      },
      whereToConfigureAction: {
        label: "Open Troubleshooting",
        href: "/help/troubleshooting",
      },
    },
  },
  {
    prefix: "/help/accelerator-chooser",
    entry: {
      whatIsThisPage:
        "Pick an accelerator pack — map buyer jobs to accelerator packs after your first finalized architecture review.",
      whatToDoNext:
        "Pick a pack that matches the buyer job, then start the review with the matching accelerator pack.",
      whyEmpty:
        "This guide is always available; accelerator packs appear on Home after you finalize a first review.",
      whereToConfigurePrerequisite:
        "Accelerator packs assume a workspace with at least one finalized architecture review.",
      whatToDoNextAction: {
        label: "Open Path chooser",
        href: "/help/path-chooser",
      },
      whereToConfigureAction: {
        label: "Start a review",
        href: "/architecture/reviews/new",
      },
    },
  },
  {
    prefix: "/help/admin-diagnostics",
    entry: {
      whatIsThisPage:
        "Admin diagnostics — system status, workspace readiness, assistant diagnostics, and observability signals for platform health.",
      whatToDoNext:
        "Open System health for live probes, or Engineering troubleshooting when CLI and log triage are required.",
      whyEmpty: "This guide is always available; live probe tiles appear on System health after the workspace responds.",
      whereToConfigurePrerequisite:
        "Deep diagnostics often require ArchLucid personnel or admin roles; customer tenants use Troubleshooting first.",
      whatToDoNextAction: {
        label: "Open System health",
        href: "/administration/system-health",
      },
      whereToConfigureAction: {
        label: "Open Engineering troubleshooting",
        href: "/help/developer-troubleshooting",
      },
    },
  },
  {
    prefix: "/help/authentication-sign-in",
    entry: {
      whatIsThisPage:
        "Authentication and sign-in — passwordless work or school accounts, email one-time codes, invitations, SSO, and recovery.",
      whatToDoNext:
        "Sign in when ready, or open Users and roles / Sign-in methods when you need workspace access or recovery steps.",
      whyEmpty: "This guide is always available; live invitations and SSO settings appear after your tenant configures identity.",
      whereToConfigurePrerequisite:
        "SSO and identity-provider changes usually need an Admin role; evaluators can still use email one-time codes when enabled.",
      whatToDoNextAction: {
        label: "Open Users and roles help",
        href: "/help/users-and-roles",
      },
      whereToConfigureAction: {
        label: "Open Sign-in methods",
        href: "/administration/account-security",
      },
    },
  },
  {
    prefix: "/help/azure-boards",
    entry: {
      whatIsThisPage:
        "Azure Boards integration — connect Azure DevOps for work item creation from ArchLucid findings.",
      whatToDoNext:
        "Open Azure Boards settings to connect or test the destination, then confirm Integration readiness.",
      whyEmpty: "This guide is always available; live connector status appears after Azure DevOps is configured for the workspace.",
      whereToConfigurePrerequisite:
        "Outbound work-item creation needs a role that can manage integrations for this workspace.",
      whatToDoNextAction: {
        label: "Open Azure Boards settings",
        href: "/integrations/azure-boards",
      },
      whereToConfigureAction: {
        label: "Open Integration readiness help",
        href: "/help/integration-readiness",
      },
    },
  },
  {
    prefix: "/help/integration-readiness",
    entry: {
      whatIsThisPage:
        "Integration readiness — which notification, ticketing, publishing, and delivery connectors are ready, recommended, or optional.",
      whatToDoNext:
        "Open Connection status for live labels, then configure recommended chat connectors before optional ITSM destinations.",
      whyEmpty: "This guide is always available; live connector status appears on Connection status after setup.",
      whereToConfigurePrerequisite:
        "Connector configuration needs a role that can manage integrations for this workspace.",
      whatToDoNextAction: {
        label: "Open Connection status",
        href: "/administration/connection-status",
      },
    },
  },
  {
    prefix: "/help/caiq-sig-response",
    entry: {
      whatIsThisPage:
        "CAIQ / SIG questionnaire responses — pre-filled CAIQ Lite and SIG Core mapped to in-repo evidence for procurement reviewers.",
      whatToDoNext:
        "Use the questionnaire pre-fills with counsel, then open SOC 2 self-assessment or Trust Center for related assurance surfaces.",
      whyEmpty: "This guide is always available; live diligence packs appear after your tenant publishes Trust Center materials.",
      whereToConfigurePrerequisite:
        "CPA SOC 2 attestation and third-party pen-test publication remain owner programs outside this page.",
      whatToDoNextAction: {
        label: "Open SOC 2 self-assessment",
        href: "/help/soc2-self-assessment",
      },
      whereToConfigureAction: {
        label: "Open Trust Center",
        href: "/trust",
      },
    },
  },
  {
    prefix: "/help/comparison-replay",
    entry: {
      whatIsThisPage:
        "Compare and replay — diff two architecture reviews, replay a saved comparison, and verify drift without re-running a full review.",
      whatToDoNext:
        "Open Compare two reviews for a live pair diff, or Validate review when you need to re-check a finalized package.",
      whyEmpty: "This guide is always available; live compare and validate tools appear after you finalize architecture reviews.",
      whereToConfigurePrerequisite:
        "Pairwise compare needs two finalized reviews in this workspace; validate needs one finalized package.",
      whatToDoNextAction: {
        label: "Open Compare two reviews",
        href: "/insights/compare-two-reviews",
      },
      whereToConfigureAction: {
        label: "Open Validate review",
        href: INTERNAL_REPLAY_PATH,
      },
    },
  },
  {
    prefix: "/help/getting-started",
    entry: {
      whatIsThisPage:
        "Getting started guide — how ArchLucid turns evidence into findings, decisions, and governance-ready review outputs.",
      whatToDoNext:
        "Start a review, open the sample walkthrough, or pick a path from Choose your next step when you know your goal.",
      whyEmpty: "This guide is always available; review metrics appear after you create or finalize reviews.",
      whereToConfigurePrerequisite:
        "Choose a workspace in the header scope switcher before starting a real (non-sample) review.",
    },
  },
  {
    prefix: "/help/troubleshooting",
    entry: {
      whatIsThisPage:
        "Troubleshooting — symptom-first guidance to unblock reviews, connections, and architect workflows.",
      whatToDoNext:
        "Start with System health, download a support bundle when needed, then open the matching common-issue card.",
      whyEmpty: "This guide is always available; live dependency status appears on System health.",
      whereToConfigurePrerequisite:
        "Confirm workspace scope in the header switcher before diagnosing tenant-specific failures.",
    },
  },
  {
    prefix: "/help/alerts",
    entry: {
      whatIsThisPage:
        "How alerts work — how ArchLucid raises, routes, and resolves governance notifications for architects.",
      whatToDoNext:
        "Open the alerts inbox or Alert rules, then confirm destinations and conditions for this workspace.",
      whyEmpty: "This guide is always available; live inbox and rules appear after reviews raise alerts.",
      whereToConfigurePrerequisite:
        "Alert delivery often needs channel integrations configured under Integrations.",
    },
  },
  {
    prefix: "/help/billing-and-plans",
    entry: {
      whatIsThisPage:
        "Billing and plans — how evaluation and paid plans, usage, and invoices show up for architects.",
      whatToDoNext:
        "Open Billing settings for this workspace, or Pricing when you need public packaging before changing plans.",
      whyEmpty: "This guide is always available; live plan and usage cards appear after billing data loads.",
      whereToConfigurePrerequisite:
        "Changing plans or payment methods needs a role that can manage workspace billing.",
    },
  },
  {
    prefix: "/help/security-trust",
    entry: {
      whatIsThisPage:
        "Security and trust help — assurance ladder, data handling, subprocessors, and diligence materials for architects and buyers.",
      whatToDoNext:
        "Open Assurance status or Trust Center for live assurance surfaces, or Audit when you need governed trails.",
      whyEmpty: "This guide is always available; downloadable diligence packs appear on Trust Center when published.",
      whereToConfigurePrerequisite:
        "No configuration is required — this page is assurance orientation vocabulary only.",
    },
  },
  {
    prefix: "/help/procurement",
    entry: {
      whatIsThisPage:
        "Procurement FAQ — buyer-facing answers on diligence packs, questionnaires, and how to request security review materials.",
      whatToDoNext:
        "Open Assurance status or Trust Center for public assurance, or settings Security & trust when requesting NDA-gated packs.",
      whyEmpty: "This FAQ is always available; NDA packs require contacting the security mailbox listed in the guide.",
      whereToConfigurePrerequisite:
        "No workspace toggle is required — this page is procurement orientation vocabulary only.",
    },
  },
  {
    prefix: "/help/scope",
    entry: {
      whatIsThisPage:
        "Workspace and scope guide — how tenant, workspace, and project boundaries work with the header switcher.",
      whatToDoNext:
        "Confirm the header scope switcher, then open Users and roles or Users settings when access needs adjustment.",
      whyEmpty: "This guide is always available; live scope labels appear in the workspace header after sign-in.",
      whereToConfigurePrerequisite:
        "Changing tenant or project membership needs Admin authority in the target workspace.",
    },
  },
  {
    prefix: "/help/audit-trail",
    entry: {
      whatIsThisPage:
        "Audit trail help — how immutable audit events, correlation identifiers, and export posture support governed review.",
      whatToDoNext:
        "Open Audit for live activity, Findings when a concern needs triage, or Assurance status for assurance surfaces.",
      whyEmpty: "This guide is always available; live audit rows appear after workspace actions are recorded.",
      whereToConfigurePrerequisite:
        "Audit visibility follows workspace roles; confirm the header workspace before exporting trails.",
    },
  },
  {
    prefix: "/help/evidence-trail",
    entry: {
      whatIsThisPage:
        "Evidence graph guide — how to trace findings, artifacts, and provenance without exposing raw engineering logs.",
      whatToDoNext:
        "Open the live Evidence graph, Search review evidence, or Validate review when you need package-level trails.",
      whyEmpty: "This guide is always available; live graph nodes appear after finalized reviews exist.",
      whereToConfigurePrerequisite:
        "Evidence graph depth follows finalized reviews in the current workspace and project scope.",
    },
  },
  {
    prefix: "/help/evidence-intake",
    entry: {
      whatIsThisPage:
        "Start a review guide — how to begin from a brief, diagram, document, or cloud evidence and verify intake before finalize.",
      whatToDoNext:
        "Open New architecture review to start intake, or Your first architecture review when you need the guided walkthrough.",
      whyEmpty: "This guide is always available; live intake drafts appear after you create architecture reviews.",
      whereToConfigurePrerequisite:
        "Creating reviews needs a role that can start architecture reviews in this workspace.",
    },
  },
  {
    prefix: "/help/findings",
    entry: {
      whatIsThisPage:
        "Findings — how architecture concerns are inspected, severity-ranked, and moved through governance resolution.",
      whatToDoNext:
        "Open the findings queue, search supporting evidence, or check the decision register for related outcomes.",
      whyEmpty: "This guide is always available; live findings appear after reviews produce architecture concerns.",
      whereToConfigurePrerequisite:
        "Findings respect the workspace and project selected in the header switcher.",
    },
  },
  {
    prefix: "/help/governance-approval",
    entry: {
      whatIsThisPage:
        "Governance approval — how architecture decisions move through submit, review, and finalize for architects.",
      whatToDoNext:
        "Open the approval queue or Workspace Health, then use Findings when you need the risk register behind a decision.",
      whyEmpty: "This guide is always available; live approval queues appear after reviews enter governance.",
      whereToConfigurePrerequisite:
        "Approval authority follows workspace roles; confirm the header workspace before acting on requests.",
    },
  },
  {
    prefix: "/help/review-guide",
    entry: {
      whatIsThisPage:
        "Review guide — field reference for naming a review, uploading evidence, confirming scope, and finalizing the package.",
      whatToDoNext:
        "Start an architecture review, or open the First review guide when you need the walkthrough instead of field detail.",
      whyEmpty: "This guide is always available; live architecture reviews appear after you create them in this workspace.",
      whereToConfigurePrerequisite:
        "Creating reviews needs a role that can start architecture reviews in this workspace.",
    },
  },
  {
    prefix: "/help/repeat-review-loop",
    entry: {
      whatIsThisPage:
        "Repeat-review loop - compare packages, replay authority, and collect second-review proof after the first finalized review.",
      whatToDoNext:
        "Open Compare two reviews, start the next review, or Validate review when you need live package trails.",
      whyEmpty: "This guide is always available; compare and replay surfaces populate after finalized reviews exist.",
      whereToConfigurePrerequisite:
        "Stickiness workflows need at least one finalized architecture review in this workspace.",
    },
  },
  {
    prefix: "/help/pilot-guide",
    entry: {
      whatIsThisPage:
        "Pilot guide — how to prepare for a pilot, run the first architecture review, interpret outputs, and get support.",
      whatToDoNext:
        "Start an architecture review, or open Your first architecture review when you need the step-by-step walkthrough.",
      whyEmpty: "This guide is always available; live pilot outcomes appear after reviews and sponsor reports exist.",
      whereToConfigurePrerequisite:
        "Running a pilot needs a workspace where architects can create and finalize architecture reviews.",
    },
  },
  {
    prefix: "/help/first-architecture-review",
    entry: {
      whatIsThisPage:
        "Your first architecture review — guided path from evidence intake to a finalized package and sponsor-ready exports.",
      whatToDoNext:
        "Start an architecture review from the hero CTA, or open the sample review when you want a completed outcome first.",
      whyEmpty: "This guide is always available; live architecture reviews appear after you create them.",
      whereToConfigurePrerequisite:
        "Creating reviews needs a role that can start architecture reviews in this workspace.",
    },
  },
  {
    prefix: "/help/cloud-connections/azure",
    entry: {
      whatIsThisPage:
        "Connect Azure securely — workload identity federation, read-only roles, and validation without long-lived secrets.",
      whatToDoNext:
        "Follow the federation steps, then open the Azure cloud connection wizard to validate the attachment.",
      whyEmpty: "This guide is always available; live Azure connection status appears on the Cloud connections hub.",
      whereToConfigurePrerequisite:
        "Azure attachment is optional — evidence-only reviews work without a cloud connector.",
    },
  },
  {
    prefix: "/help/cloud-connections/aws",
    entry: {
      whatIsThisPage:
        "Connect AWS securely — OIDC-federated read-only IAM, Resource Explorer inventory, and validation without long-lived access keys.",
      whatToDoNext:
        "Follow the federation steps, then open the AWS cloud connection settings to validate the attachment.",
      whyEmpty: "This guide is always available; live AWS connection status appears on the Cloud connections hub.",
      whereToConfigurePrerequisite:
        "AWS attachment is optional — evidence-only reviews work without a cloud connector.",
      whatToDoNextAction: {
        label: "Open AWS connection settings",
        href: "/integrations/cloud-connections/aws",
      },
      whereToConfigureAction: {
        label: "Open Cloud connections help",
        href: "/help/cloud-connections",
      },
    },
  },
  {
    prefix: "/help/cloud-connections/gcp",
    entry: {
      whatIsThisPage:
        "Connect GCP securely — Workload Identity Federation, Cloud Asset Viewer, project scope, and validation without service-account JSON keys.",
      whatToDoNext:
        "Follow the federation steps, then open the GCP cloud connection settings to validate the attachment.",
      whyEmpty: "This guide is always available; live GCP connection status appears on the Cloud connections hub.",
      whereToConfigurePrerequisite:
        "GCP attachment is optional — evidence-only reviews work without a cloud connector.",
      whatToDoNextAction: {
        label: "Open GCP connection settings",
        href: "/integrations/cloud-connections/gcp",
      },
      whereToConfigureAction: {
        label: "Open Cloud connections help",
        href: "/help/cloud-connections",
      },
    },
  },
  {
    prefix: "/help/azure-permissions",
    entry: {
      whatIsThisPage:
        "Azure permissions — read-only roles, scopes, and verification steps for ArchLucid cloud connections.",
      whatToDoNext:
        "Open Cloud connections to configure Azure, or Connect Azure securely when you need the federation walkthrough.",
      whyEmpty: "This guide is always available; live permission checks appear after you configure an Azure connection.",
      whereToConfigurePrerequisite:
        "Assigning Azure roles needs cloud-admin authority in the target subscription.",
    },
  },
  {
    prefix: "/help/glossary",
    entry: {
      whatIsThisPage:
        "Glossary — searchable product terms for architects and buyers reviewing ArchLucid vocabulary.",
      whatToDoNext:
        "Look up a term, then open Getting started or Assurance status when you need live workflow or assurance orientation.",
      whyEmpty: "Glossary terms are always listed; search filters the catalog without needing a live review.",
      whereToConfigurePrerequisite:
        "No configuration is required — this page is orientation vocabulary only.",
    },
  },
  {
    prefix: "/help/users-and-roles",
    entry: {
      whatIsThisPage:
        "Users and roles — ArchLucid app roles, capabilities, and how architects invite teammates for this workspace.",
      whatToDoNext:
        "Open Users settings to invite or assign roles, or Assurance status when you need assurance orientation.",
      whyEmpty: "This guide is always available; live directory rows appear after users are invited or provisioned.",
      whereToConfigurePrerequisite:
        "Managing users needs Admin authority; SSO may be required before invited users can sign in.",
    },
  },
  {
    prefix: "/help/cloud-connections",
    entry: {
      whatIsThisPage:
        "Cloud connections help — how optional Azure, AWS, and GCP connectors supply read-only evidence for reviews.",
      whatToDoNext:
        "Open the Cloud connections hub to configure a provider, or read Connect Azure securely for federation steps.",
      whyEmpty: "This guide is always available; live connection status appears on the Cloud connections hub.",
      whereToConfigurePrerequisite:
        "Cloud connectors are optional — evidence-only reviews work without attaching a cloud account.",
    },
  },
  {
    prefix: "/administration/users/invite-reviewer",
    entry: {
      whatIsThisPage:
        "Invite a reviewer — send Reader or Auditor access so a teammate can sign off on architecture reviews.",
      whatToDoNext:
        "Enter the reviewer's email, send the invitation, then open Users and roles when you need the full directory or role matrix.",
      whyEmpty: "The invitation form is ready when you have Admin authority in this workspace.",
      whereToConfigurePrerequisite:
        "Workspace Admin authority is required; SSO may need to be configured before invited users can sign in.",
    },
  },
  {
    prefix: "/administration/users",
    entry: {
      whatIsThisPage:
        "Invite users and assign ArchLucid app roles for this workspace tenant.",
      whatToDoNext:
        "Invite a teammate, then open Roles and permissions to adjust authority.",
      whyEmpty: "Directory rows appear after invitations are accepted or users are provisioned for this tenant.",
      whereToConfigurePrerequisite:
        "SSO and identity-provider mapping may be required before enterprise users can sign in.",
    },
  },
  {
    prefix: "/administration/identity-providers",
    entry: {
      whatIsThisPage:
        "SSO and identity - configure federation, sign-in domains, and identity-provider health for this workspace.",
      whatToDoNext:
        "Review overview status, open SAML or OIDC setup, then validate role mapping before inviting shared users.",
      whyEmpty:
        "Summary cards load after auth diagnostics respond; local development sign-in may be enabled until production SSO is configured.",
      whereToConfigurePrerequisite:
        "Changing federation settings needs Admin authority and a verified sign-in domain when enforcement is required.",
    },
  },
  {
    prefix: "/administration/identity-providers/oidc",
    entry: {
      whatIsThisPage:
        "OIDC/JWT - review discovery status, authority, audience, and role-claim readiness for this workspace.",
      whatToDoNext:
        "Confirm discovery health, open the SSO wizard when authority needs updates, then validate role mapping before inviting users.",
      whyEmpty:
        "Status cards load after OIDC diagnostics respond; Not configured means no OIDC authority is published yet.",
      whereToConfigurePrerequisite:
        "Changing OIDC settings needs Admin authority and a reachable identity-provider discovery endpoint.",
    },
  },
  {
    prefix: "/administration/identity-providers/saml",
    entry: {
      whatIsThisPage:
        "SAML - configure SP metadata URL, issuer, signing, and IdP claim mapping for workspace federation.",
      whatToDoNext:
        "Fetch IdP metadata, confirm issuer and role claim fields, save the SP configuration, then open diagnostics or role mapping before inviting users.",
      whyEmpty:
        "The configuration form always renders for authorized Admins; empty claim tables mean metadata has not been fetched or mapping rows are not filled yet.",
      whereToConfigurePrerequisite:
        "Changing SAML settings needs Admin authority and a reachable IdP metadata URL; signing certificate health is reviewed on Identity diagnostics.",
    },
  },
  {
    prefix: "/administration/identity/sso-wizard",
    entry: {
      whatIsThisPage:
        "SSO wizard - guided OIDC or SAML setup that discovers provider metadata, maps roles, tests connection, then activates SSO for this workspace.",
      whatToDoNext:
        "Choose a protocol, fetch metadata, map IdP claims to ArchLucid roles, run a test connection, then activate only after the test succeeds.",
      whyEmpty:
        "Wizard steps always render for authorized Admins; empty issuer or mapping fields mean metadata has not been fetched or claims are not filled yet.",
      whereToConfigurePrerequisite:
        "Activating SSO needs Admin authority and a reachable IdP metadata or discovery URL; current sign-in stays unchanged until the final activate step.",
    },
  },
  {
    prefix: "/administration/scim-provisioning",
    entry: {
      whatIsThisPage:
        "SCIM provisioning - issue, verify, and revoke inbound directory tokens so your IdP can sync users into this workspace.",
      whatToDoNext:
        "Copy the SCIM base URL, create a token, verify it against Service Provider Config, then revoke tokens you no longer need.",
      whyEmpty:
        "Active tokens appear after creation; an empty list means no inbound provisioning tokens exist yet for this tenant.",
      whereToConfigurePrerequisite:
        "Managing SCIM tokens needs Admin authority; pair tokens with SSO and identity setup before enforcing directory sync.",
    },
  },
  {
    prefix: "/administration/tenant",
    entry: {
      whatIsThisPage:
        "Tenant settings - configure workspace defaults, quality gates, cost settings, and tenant-wide options for this organization.",
      whatToDoNext:
        "Review workspace scope, adjust quality gates or cost settings when needed, then open Projects recycle bin to restore deleted architecture projects.",
      whyEmpty:
        "Cards always render for authorized Admins; empty technical scope values mean the workspace switcher has not selected a tenant, workspace, or project yet.",
      whereToConfigurePrerequisite:
        "Changing tenant defaults needs Admin authority; active workspace and project selection lives in the header workspace switcher.",
    },
  },
  {
    prefix: "/administration/tenant/recycle-bin",
    entry: {
      whatIsThisPage:
        "Projects recycle bin - browse soft-deleted architecture projects for this tenant and restore them when names are free.",
      whatToDoNext:
        "Refresh the list, restore a deleted project when you have Execute authority, then open Architectures or Tenant settings to continue work.",
      whyEmpty:
        "Empty means no soft-deleted projects remain in the retention window, or the recycle-bin API has not returned rows yet.",
      whereToConfigurePrerequisite:
        "Browsing needs Admin access; restore requires Execute authority. Retention and workspace scope live under Tenant settings.",
    },
  },
  {
    prefix: "/administration/identity-providers/role-mapping",
    entry: {
      whatIsThisPage:
        "Role mapping - see how IdP groups or claims become ArchLucid app roles for this workspace tenant.",
      whatToDoNext:
        "Review mapping status, edit SAML role mapping when needed, then open diagnostics to test claims before inviting users.",
      whyEmpty:
        "Status cards load after auth diagnostics respond; Unmapped means no elevated roles until a matching claim is configured.",
      whereToConfigurePrerequisite:
        "Editing mappings needs Admin authority and a configured SAML or OIDC identity source.",
    },
  },
  {
    prefix: "/administration/identity-providers/diagnostics",
    entry: {
      whatIsThisPage:
        "Identity diagnostics - validate federation health probes, OIDC and SAML strips, and token test mapping before enabling SSO for all users.",
      whatToDoNext:
        "Refresh probes, review failing health strips, run token test mapping when claims look wrong, then return to OIDC or Role mapping to fix configuration.",
      whyEmpty:
        "Health and checklist panels appear after diagnostics APIs respond; empty strips mean probes have not loaded yet or the provider is not configured.",
      whereToConfigurePrerequisite:
        "Running diagnostics needs Admin authority and configured identity-provider endpoints; technical detail panels may require the internal admin workspace.",
    },
  },
  {
    prefix: "/administration/api-keys",
    entry: {
      whatIsThisPage:
        "API keys - host automation credential controls (parked in product UI until Internal Operations maturity).",
      whatToDoNext:
        "Use Users and roles for people access. Prefer Key Vault / host configuration for machine credentials until this surface returns under Internal Operations.",
      whyEmpty:
        "This page stays restricted while in-product API key management is deferred.",
      whereToConfigurePrerequisite:
        "Re-enable requires flipping isApiKeysSettingsSurfaceEnabled and Admin authority; some tenants require SSO-only sign-in.",
    },
  },
  {
    prefix: "/administration/preferences",
    entry: {
      whatIsThisPage:
        "Preferences - personal appearance settings saved to your ArchLucid account for this device and signed-in profile.",
      whatToDoNext:
        "Choose a theme, then open Sign-in methods when sign-in controls need attention or Getting started for onboarding.",
      whyEmpty:
        "Theme controls are ready whenever you are signed in; saved preferences sync after the preferences API responds.",
      whereToConfigurePrerequisite:
        "No Admin role is required - preferences write only your own account record.",
    },
  },
  {
    prefix: "/administration/account-security",
    entry: {
      whatIsThisPage:
        "Sign-in methods — manage personal sign-in methods linked to your ArchLucid account for this workspace.",
      whatToDoNext:
        "Review linked methods, add email with a one-time code while signed in when needed, then open Preferences or Security and trust help for related controls.",
      whyEmpty:
        "Method rows load after the sign-in methods API responds; empty lists mean no secondary methods are linked yet.",
      whereToConfigurePrerequisite:
        "Removing a method may require signing in again when your session is stale; email matches alone never link accounts.",
    },
  },
  {
    prefix: "/administration/auth-domains",
    entry: {
      whatIsThisPage:
        "Sign-in domains - verify email domain ownership, test SSO routing, and enable domain enforcement for this workspace.",
      whatToDoNext:
        "Add and verify a domain, test routing, then open Identity providers before enabling SSO enforcement.",
      whyEmpty:
        "Domain rows load after the auth-domains API responds; unverified domains stay pending until DNS TXT succeeds.",
      whereToConfigurePrerequisite:
        "Enforcement needs Admin authority, a verified domain, recovery admins, and a configured identity provider.",
    },
  },
  {
    prefix: "/administration/extract-upload",
    entry: {
      whatIsThisPage:
        "Extract and Upload - run the read-only Azure extractor locally, validate the ZIP, then upload inventory for architecture reviews.",
      whatToDoNext:
        "Copy the quick-start command, upload a validated ZIP, then open Start a review when the package is ready.",
      whyEmpty:
        "Upload controls are ready when you have Admin or Execute authority; progress rows appear after a package is selected.",
      whereToConfigurePrerequisite:
        "Uploading packages needs workspace authority; cloud connectors are optional for evidence-only ZIP intake.",
    },
  },
  {
    prefix: "/administration/model-governance",
    entry: {
      whatIsThisPage:
        "AI and model governance - manage the workspace default execution profile and governed model aliases used on reviews.",
      whatToDoNext:
        "Review the effective profile, set or clear a tenant override, then open AI usage when spend signals need attention.",
      whyEmpty:
        "Catalog rows load after the model-governance API responds; empty registries mean aliases are not published yet.",
      whereToConfigurePrerequisite:
        "Changing execution profiles needs Admin authority in this workspace.",
    },
  },
  {
    prefix: "/administration/security-trust",
    entry: {
      whatIsThisPage:
        "Operator Security & trust — procurement-oriented materials, tenant isolation posture, retention notes, and NDA-gated diligence requests for this workspace.",
      whatToDoNext:
        "Open Assurance status or Trust Center for assurance surfaces, or Audit when you need governed activity trails.",
      whyEmpty:
        "Public materials list here when published; NDA-gated packs require contacting security@archlucid.net.",
      whereToConfigurePrerequisite:
        "No workspace toggle is required — this page orients architects to published and NDA diligence paths.",
    },
  },
  {
    prefix: "/administration/billing",
    entry: {
      whatIsThisPage:
        "Billing & plans - view the current subscription, compare available plans, and manage usage and wallet controls for this workspace.",
      whatToDoNext:
        "Review the current plan card, compare Available plans, then open AI usage or Billing help when spend questions need methodology.",
      whyEmpty:
        "Plan and usage cards appear after billing data loads for this tenant; wallet controls need Admin authority to mutate.",
      whereToConfigurePrerequisite:
        "Changing plans or payment methods needs a role that can manage workspace billing.",
    },
  },
  {
    prefix: "/administration/ai-usage",
    entry: {
      whatIsThisPage:
        "AI usage and cost - monitor estimated AI spend, remaining budget, and the workflows driving cost for this workspace.",
      whatToDoNext:
        "Review KPIs and daily usage, then open Billing & plans when budget caps or plan changes are needed.",
      whyEmpty:
        "Spend cards appear after cost-reporting data loads; quiet empty periods hide zeroed cockpit noise until activity resumes.",
      whereToConfigurePrerequisite:
        "Budget edits need a role that can manage workspace billing; estimated spend is not invoice-accurate.",
    },
  },
  {
    prefix: "/administration/baseline",
    entry: {
      whatIsThisPage:
        "Baseline settings - capture ROI measurement anchors (review cycle hours, prep time, people per review) for this workspace.",
      whatToDoNext:
        "Save or clear baseline anchors, then open Pilot ROI model help or Architecture scorecard when numbers need methodology.",
      whyEmpty:
        "Fields load after tenant baseline API responds; empty values mean conservative defaults until you save anchors.",
      whereToConfigurePrerequisite:
        "Saving baseline anchors needs Execute authority in this workspace.",
    },
  },
  {
    prefix: "/integrations/cloud-connections",
    entry: {
      whatIsThisPage:
        "Connect Azure, AWS, or Google Cloud for optional read-only evidence collection, or start evidence-only reviews without a cloud connector.",
      whatToDoNext:
        "Choose platforms to show, open a provider to configure federation, or start an evidence-only review from uploaded packages.",
      whyEmpty:
        "Provider cards stay Not connected until you configure a Tier 2 connection; evidence-only upload stays available anytime.",
      whereToConfigurePrerequisite:
        "Choose a workspace in the header scope switcher before changing which platforms appear — filters save per workspace.",
    },
  },
  {
    prefix: "/integrations/cloud-connections/aws",
    entry: {
      whatIsThisPage:
        "AWS cloud connection — configure a read-only federated IAM role for Resource Explorer inventory collection.",
      whatToDoNext:
        "Complete security preflight, enter the role ARN, save the connection, then re-poll to validate access.",
      whyEmpty: "Saved connections and last poll timestamps appear after you save a federated role.",
      whereToConfigurePrerequisite:
        "Creating the IAM trust role usually needs cloud-admin authority; saving the connection in ArchLucid needs Operate authority.",
    },
  },
  {
    prefix: "/integrations/cloud-connections/azure",
    entry: {
      whatIsThisPage:
        "Azure cloud connection — configure read-only federated service-principal access for subscription inventory collection.",
      whatToDoNext:
        "Complete security preflight, run the Tier 2 wizard, save and validate, then return to Cloud connections for workspace status.",
      whyEmpty: "Saved connections and recent collection runs appear after you validate federated credentials.",
      whereToConfigurePrerequisite:
        "Provisioning the service principal usually needs cloud-admin authority; saving the connection in ArchLucid needs Operate authority.",
    },
  },
  {
    prefix: "/integrations/cloud-connections/gcp",
    entry: {
      whatIsThisPage:
        "GCP cloud connection — configure read-only Cloud Asset Inventory through Workload Identity Federation.",
      whatToDoNext:
        "Complete security preflight, record the pool provider and service-account email, save the connection, then re-poll to validate access.",
      whyEmpty: "Saved connections and last poll timestamps appear after you save a project.",
      whereToConfigurePrerequisite:
        "Provisioning Workload Identity Federation usually needs cloud-admin authority; saving the connection in ArchLucid needs Operate authority.",
    },
  },
  {
    prefix: "/integrations/jira",
    entry: {
      whatIsThisPage:
        "Jira integration — outbound work-item settings, connection health, and tenant overrides for creating Jira issues from ArchLucid.",
      whatToDoNext:
        "Test the connector, set project and severity mappings, then open Integration readiness when the path is not ready.",
      whyEmpty: "Health and settings load after this workspace can reach the ITSM connector configuration.",
      whereToConfigurePrerequisite:
        "Platform credentials are often configured by an administrator; tenant overrides on this page need Operate authority.",
    },
  },
  {
    prefix: "/integrations/azure-boards",
    entry: {
      whatIsThisPage:
        "Azure Boards integration — outbound work-item settings, connection health, and default behavior for creating Azure Boards work items from ArchLucid.",
      whatToDoNext:
        "Test the connector, set organization project and work-item defaults, then open Integration readiness when the path is not ready.",
      whyEmpty: "Health and settings load after this workspace can reach the Azure Boards connector configuration.",
      whereToConfigurePrerequisite:
        "Organization URL and credential references are often configured by an administrator; saving settings needs Operate authority.",
    },
  },
  {
    prefix: "/integrations/itsm/oauth/callback",
    entry: {
      whatIsThisPage:
        "Atlassian OAuth callback — completes Jira connector consent after Atlassian redirects back to ArchLucid.",
      whatToDoNext:
        "When consent succeeds, return to Jira integration settings to run a health probe; on failure, retry Connect with Atlassian.",
      whyEmpty: "This page only appears after an OAuth redirect; status text replaces empty layouts.",
      whereToConfigurePrerequisite:
        "Starting OAuth requires Operate authority and a configured Atlassian app registration.",
    },
  },
  {
    prefix: "/integrations/servicenow",
    entry: {
      whatIsThisPage:
        "ServiceNow integration — outbound incident settings, connection health, and CMDB overrides for creating ServiceNow records from ArchLucid.",
      whatToDoNext:
        "Test the connector, adjust CMDB auto-create if needed, then open Integration readiness when the path is not ready.",
      whyEmpty: "Health and settings load after this workspace can reach the ITSM connector configuration.",
      whereToConfigurePrerequisite:
        "Platform credentials are often configured by an administrator; tenant overrides on this page need Operate authority.",
    },
  },
  {
    prefix: "/integrations/slack",
    entry: {
      whatIsThisPage:
        "Slack integration — configure incoming webhook destinations that receive governance alerts for this workspace.",
      whatToDoNext:
        "Add or test a Slack destination, then open Alert rules when you need to change which events fire notifications.",
      whyEmpty: "Destinations appear after you save an incoming webhook URL for this workspace.",
      whereToConfigurePrerequisite:
        "Creating or changing destinations requires a role that can manage alert routing.",
    },
  },
  {
    prefix: "/integrations/webhooks",
    entry: {
      whatIsThisPage:
        "Webhooks — configure HTTPS webhook subscriptions that receive governance alerts for this workspace.",
      whatToDoNext:
        "Add or test a subscription, then open Alert rules when you need to change which events fire notifications.",
      whyEmpty: "Subscriptions appear after you save a webhook URL for this workspace.",
      whereToConfigurePrerequisite:
        "Creating or changing subscriptions requires a role that can manage alert routing.",
    },
  },
  {
    prefix: "/operate/integration-events/dlq",
    entry: {
      whatIsThisPage:
        "Integration event dead letters — Internal Operations queue for outbound integration publishes that exceeded retries.",
      whatToDoNext:
        "Inspect the failing event, fix connector or destination root cause, then retry or suppress; open Integration readiness or System health for posture.",
      whyEmpty: "An empty list means no dead-lettered outbox rows are waiting across tenants.",
      whereToConfigurePrerequisite:
        "Admin authority is required to retry or suppress; the queue spans all tenants, not only the header workspace.",
    },
  },
  {
    prefix: "/integrations/teams",
    entry: {
      whatIsThisPage:
        "Microsoft Teams integration — configure a Teams channel destination that receives governance alerts for this workspace.",
      whatToDoNext:
        "Save or test the Teams connector, then open Alert rules when you need to change which events fire notifications.",
      whyEmpty: "Connection status appears after this workspace can load Teams notification settings.",
      whereToConfigurePrerequisite:
        "Creating or changing the Teams destination requires a role that can manage alert routing.",
    },
  },
];

/** All registry rows — exported for content-constraint Vitest guards. */
export function allPageContextualHelpRows(): readonly PageContextualHelpRow[] {
  return PAGE_CONTEXTUAL_HELP;
}

/** Resolve short-form contextual help for an architect pathname, or `null` when not migrated yet. */
export function contextualHelpForPathname(pathname: string): PageContextualHelpEntry | null {
  const rawPath = (pathname ?? "").split("?")[0] ?? "";
  const path = (canonicalizeLegacyOperatorRoutePath(rawPath).split("?")[0] ?? rawPath).trim() || "/";

  if (pathIsRunProvenance(path)) {
    return PROVENANCE_CONTEXTUAL_HELP;
  }

  if (pathIsFindingEvidenceTrace(path)) {
    return EVIDENCE_TRACE_CONTEXTUAL_HELP;
  }

  if (pathIsArchitectureDraftDetail(path)) {
    return ARCHITECTURES_DRAFT_CONTEXTUAL_HELP;
  }

  const sorted = [...PAGE_CONTEXTUAL_HELP].sort((left, right) => right.prefix.length - left.prefix.length);

  for (const row of sorted) {
    if (path === row.prefix || path.startsWith(`${row.prefix}/`)) {
      return row.entry;
    }
  }

  return null;
}

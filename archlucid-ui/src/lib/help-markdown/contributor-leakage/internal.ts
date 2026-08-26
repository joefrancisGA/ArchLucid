import { stripMarkdownSectionsByTitlePrefix } from "@/lib/help-markdown/section-strips";
import { rewriteProcurementFaqBuyerPresentation } from "@/lib/procurement-help-presentation";
import {
  applyLeakageRewriteTable,
  applyLeakageRewriteTableThenCleanup,
} from "../leakage-rewrite-table";
import {
  CAIQ_SIG_LEAKAGE_REWRITES,
  DEVELOPER_TROUBLESHOOTING_LEAKAGE_REWRITES,
  DPA_TEMPLATE_LEAKAGE_REWRITES,
  PATH_CHOOSER_LEAKAGE_REWRITES,
  PROCUREMENT_LEAKAGE_REWRITES,
} from "../contributor-leakage-rewrite-tables";


/** H2 sections omitted from in-app configuration reference (contributor / marketing / test-only). */
export const CONFIGURATION_REFERENCE_OMITTED_SECTION_PREFIXES = [
  "testing (non-production)",
  "public marketing site",
] as const;

/**
 * TB-1327 — drops Testing / marketing-build sections from the product configuration help view.
 */


/** H2 sections omitted from in-app enterprise onboarding (ArchLucid CS / ops theater). */
export const ENTERPRISE_ONBOARDING_OMITTED_SECTION_PREFIXES = [
  "tenant provisioning",
  "onboarding hub",
  "sign-off",
] as const;

/**
 * Removes the duplicate Quick links blockquote — the interactive hub step list replaces it in-app.
 */


/**
 * TB-1339 — drops ArchLucid-internal tenant provisioning from the product onboarding help view.
 */


/**
 * TB-1339 — removes eng CLI/appsettings, Evidence-tier jargon, and demotes JwtBearer /
 * ClaimMappingJson vocabulary from in-app enterprise onboarding presentation.
 */


/**
 * TB-1346 — removes SE CLI / proof-collector disclosure and eng jargon from evaluator workbook help.
 */


/**
 * TB-1327 — removes backlog IDs, RC script/fixture paths, ADR deep links, and contributor
 * security/scope anchors from in-app configuration reference presentation.
 */


/** H2 sections omitted from in-app governance API contracts (CI / contributor PR process). */
export const GOVERNANCE_API_CONTRACTS_OMITTED_SECTION_PREFIXES = [
  "contract surface and ci controls",
  "changing the http contract",
] as const;

/**
 * TB-1388 — drops CI snapshot and PR-checklist sections from the governance API contracts help view.
 */


/**
 * TB-1388 — removes OpenAPI snapshot regenerate commands, CI fixture paths, runbooks, TB IDs,
 * and other contributor process leakage from in-app governance API contracts presentation.
 */


/**
 * TB-1390 / fold PI→SPE — removes contributor leakage from sponsor-report pilot ROI measurement section.
 */


/** @deprecated Folded into sponsor-report#pilot-roi-measurement — use stripSponsorReportPilotRoiMeasurementLeakage. */


/** H2 sections omitted from in-app repeat-review help (founder validation / proof theater). */
export const REPEAT_REVIEW_LOOP_OMITTED_SECTION_PREFIXES = [
  "recommended loop",
  "second-review habit loop validation",
  "related help",
] as const;

/**
 * TB-1396 — drops habit-loop validation and founder proof-theater sections from repeat-review help.
 */


/**
 * TB-1396 — removes CLI proof scripts, eng `.md` paths, fixtures, and TB IDs from repeat-review help.
 */


/** H2 sections omitted from in-app accelerator chooser help (contributor indexes / library dumps). */
export const ACCELERATOR_CHOOSER_OMITTED_SECTION_PREFIXES = ["policy packs", "canonical references"] as const;

/**
 * TB-1606 / TB-1604 — removes contributor intro prose and markdown table; specialty view owns the chooser grid.
 */


/**
 * TB-1606 — drops policy-pack index and canonical library sections from accelerator chooser help.
 */


/**
 * TB-1606 — removes templates-tree paths, policy-pack indexes, walkthrough `.md`, and TB IDs
 * from in-app accelerator chooser presentation.
 */


/**
 * TB-1621 — removes connector smoke repo paths and administrator smoke-validation disclosures
 * from in-app Azure Boards integration help.
 */


/**
 * TB-1632 — removes contributor repo-tree framing from in-app CAIQ/SIG questionnaire help.
 */


export function dedupeConsecutiveCaiqSigPhrase(text: string, phrase: string): string {
  const escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(${escapedPhrase})(?:\\s*,?\\s*\\1)+`, "gi");

  return text.replace(pattern, "$1");
}

export const SUBPROCESSORS_OMITTED_SECTION_PREFIXES = ["related documents"] as const;

/**
 * TB-1752 — drops contributor Related documents section from subprocessors help.
 */


export function isSubprocessorsContributorLeakageLine(line: string): boolean {
  if (/START_HERE\.md/i.test(line)) {
    return true;
  }

  if (/Spine doc:/i.test(line)) {
    return true;
  }

  if (/CUSTOMER_TRUST_AND_ACCESS/i.test(line)) {
    return true;
  }

  if (/SYSTEM_THREAT_MODEL/i.test(line)) {
    return true;
  }

  if (/terraform-azure-variables/i.test(line)) {
    return true;
  }

  if (/GEO_FAILOVER_DRILL/i.test(line)) {
    return true;
  }

  if (/trust-center\.md/i.test(line)) {
    return true;
  }

  if (/`infra\//i.test(line)) {
    return true;
  }

  if (/\binfra\//i.test(line)) {
    return true;
  }

  return false;
}

/**
 * TB-1752 — subprocessors help: strip contributor repo paths; in-app trust/DPA links.
 */


/**
 * TB-1755 — subprocessors help: buyer-safe residency posture; no contributor to-do voice.
 */


/**
 * TB-1756 — subprocessors register: buyer-safe data-category vocabulary.
 */


export const TENANT_ISOLATION_THREE_LAYERS_BUYER_BODY = [
  "ArchLucid isolates customer review data at three layers in the standard hosted posture:",
  "",
  "- **Layer 1 — Identity:** Microsoft Entra ID (or your configured IdP) issues tokens with app roles; API keys map to limited roles when used.",
  "- **Layer 2 — Application:** Authorization policies enforce tenant, workspace, and project scope before any data access.",
  "- **Layer 3 — Database:** Each tenant organization receives a dedicated product SQL catalog. **SQL row-level security is not the production isolation boundary**; application code still applies scope predicates within the catalog.",
  "",
  "For assurance questionnaires, isolation evidence, and diligence materials, see [Security and trust](/help/security-trust) and [Procurement FAQ](/help/procurement).",
].join("\n");

export {
  FIRST_VALUE_20_MINUTES_SECTION_HEADING_RE,
  extractFirstValue20MinutesSection,
  FIRST_REVIEW_EVIDENCE_OMITTED_SECTION_PREFIXES,
  CLI_USAGE_OMITTED_SECTION_PREFIXES,
  stripFirstValue20ExtractedSectionHeading,
  replaceFirstValue20OutsideBacktickSpans,
  applyFirstValue20ProseLeakageReplacements,
  applyFirstValue20CodeSpanLeakageReplacements,
} from "./first-value-20";

export {
  PILOT_FEEDBACK_OMITTED_SECTION_PREFIXES,
  isPilotFeedbackContributorLeakageLine,
} from "./pilot-feedback";

export {
  POLICY_PACK_DELTA_OMITTED_SECTION_PREFIXES,
  isPolicyPackDeltaContributorLeakageLine,
} from "./policy-pack-delta";
export function isProductOverviewContributorLeakageLine(line: string): boolean {
  if (/ExplainabilityTrace/i.test(line)) {
    return true;
  }

  if (/JSON\/YAML/i.test(line)) {
    return true;
  }

  if (/78 typed audit events/i.test(line)) {
    return true;
  }

  if (/POLICY_PACK_CONTENT_BACKLOG/i.test(line)) {
    return true;
  }

  if (/architecture\/adrs\//i.test(line)) {
    return true;
  }

  if (/ADR 0020/i.test(line)) {
    return true;
  }

  if (/REFERENCE_SAAS_STACK_ORDER/i.test(line)) {
    return true;
  }

  if (/POSITIONING\.md/i.test(line)) {
    return true;
  }

  if (/V1_DEFERRED\.md/i.test(line)) {
    return true;
  }

  if (/ELEVATOR_PITCH\.md/i.test(line)) {
    return true;
  }

  if (/\bM-245\b/i.test(line)) {
    return true;
  }

  if (/GTM \*\*M-/i.test(line)) {
    return true;
  }

  if (/\(M-\d+/i.test(line)) {
    return true;
  }

  if (/GTM_BACKLOG/i.test(line)) {
    return true;
  }

  if (/BUYER_PERSONAS/i.test(line)) {
    return true;
  }

  if (/QUOTE_TO_PROOF_PACKET/i.test(line)) {
    return true;
  }

  if (/ORDER_FORM_TEMPLATE/i.test(line)) {
    return true;
  }

  if (/PUBLIC_CLAIM_BOUNDARY/i.test(line)) {
    return true;
  }

  if (/Administrator \/ contributor related links/i.test(line)) {
    return true;
  }

  if (/START_HERE\.md|REPOSITORY_README|DEMO_QUICKSTART|PRODUCT_PACKAGING|FIRST_PILOT_OPERATOR_PATH|INTEGRATION_CATALOG|SPONSOR_BANNER|API_CONTRACTS/i.test(line)) {
    return true;
  }

  if (/docs\/go-to-market\/ELEVATOR_PITCH/i.test(line)) {
    return true;
  }

  if (/Former standalone:/i.test(line)) {
    return true;
  }

  if (/docs\/library\//i.test(line) && /\.md/i.test(line)) {
    return true;
  }

  if (/docs\/runbooks\//i.test(line)) {
    return true;
  }

  if (/Talk-track companions/i.test(line)) {
    return true;
  }

  if (/Persona-flavored openers/i.test(line)) {
    return true;
  }

  if (/Track 20 sends privately/i.test(line)) {
    return true;
  }

  if (/Framing rules/i.test(line)) {
    return true;
  }

  if (/LinkedIn connection-request note/i.test(line)) {
    return true;
  }

  if (/Warm outreach \(1st-degree/i.test(line)) {
    return true;
  }

  if (/Follow-up bump \(once/i.test(line)) {
    return true;
  }

  if (/M-18 outreach message templates/i.test(line)) {
    return true;
  }

  if (/Founder-led "20 warm contacts"/i.test(line)) {
    return true;
  }

  return false;
}

/**
 * TB-1686 — sponsor-report help: sponsor-brief sections with buyer-safe ROI link rewrites.
 */


/**
 * TB-1738 — product-overview help: strip eng/GTM paths, type names, and backlog IDs; buyer-safe pillars.
 */


/** H2 sections omitted from in-app SOC 2 self-assessment help (contributor/GTM index). */
export const SOC2_SELF_ASSESSMENT_OMITTED_SECTION_PREFIXES = ["related", "pending questions"] as const;

/**
 * TB-1747 — drops contributor Related / Pending Questions sections from SOC 2 self-assessment help.
 */


export function isSoc2SelfAssessmentContributorLeakageLine(line: string): boolean {
  if (/START_HERE\.md/i.test(line)) {
    return true;
  }

  if (/Spine doc:/i.test(line)) {
    return true;
  }

  if (/AUDIT_COVERAGE_MATRIX/i.test(line)) {
    return true;
  }

  if (/ADR 0037/i.test(line)) {
    return true;
  }

  if (/AuthSafetyGuard/i.test(line)) {
    return true;
  }

  if (/CodeQL/i.test(line)) {
    return true;
  }

  if (/Terraform/i.test(line)) {
    return true;
  }

  if (/V1_DEFERRED/i.test(line)) {
    return true;
  }

  if (/pen-test-summaries/i.test(line)) {
    return true;
  }

  if (/SecurityAssessmentPublished/i.test(line)) {
    return true;
  }

  if (/COMPLIANCE_MATRIX/i.test(line)) {
    return true;
  }

  if (/ASSURANCE_STATUS_CANONICAL/i.test(line)) {
    return true;
  }

  if (/CAIQ_LITE_2026|SIG_CORE_2026/i.test(line)) {
    return true;
  }

  if (/Schemathesis|OWASP ZAP/i.test(line)) {
    return true;
  }

  return false;
}

/**
 * TB-1748 — SOC 2 Type I roadmap: illustrative / budget-gated only; no calendar as product promise.
 */


/**
 * TB-1747 — SOC 2 self-assessment help: strip contributor repo paths and eng control names; buyer-safe summary.
 */


/** H2 sections rendered in HelpPathChooserGuideView chrome instead of markdown body. */
export const PATH_CHOOSER_STRUCTURED_UI_SECTION_TITLES = ["choose your next step", "related"] as const;

export const EVIDENCE_INTAKE_STRUCTURED_UI_SECTION_PREFIXES = [
  "choose a starting path",
  "related guides",
  "verify intake before finalize",
] as const;

export const EVIDENCE_TRAIL_STRUCTURED_UI_SECTION_PREFIXES = [
  "open the evidence graph",
  "related guides",
] as const;

/**
 * TB-1351 — buyer-safe wording for guided-intake path copy in product presentation.
 */


/**
 * TB-1350 — specialty chrome owns path strip, verify panel, and related guides.
 */


/**
 * TB-1360 — specialty chrome owns open-graph action panel, finding jump, and related guides.
 */






/**
 * TB-1653 / TB-1284 — soften absolute cross-tenant isolation claims in data-handling help.
 */


/**
 * TB-1633 — aligns CAIQ/SIG questionnaire help with assurance honesty talk-track
 * (ASSURANCE_STATUS_CANONICAL / TB-1144): SoW/program ≠ published third-party pen test;
 * never imply CPA SOC 2 attestation or "pen test in flight."
 */


export const TRUST_CENTER_SECURITY_DOC_REQUEST_DISCLOSURE =
  "Available on request during diligence — contact **security@archlucid.net**.";

/**
 * TB-2091 / HSE P0 — trust-center help: strip contributor CI, file-rename archaeology, HTTP caching
 * notes, and unreleased security-doc paths; rewrite pen-test lead-in to buyer wording.
 */


/** Emphasizes known inline guidance labels in help markdown when not already bold. */

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

/**
 * TB-1659 — tenant-isolation help: strip pack-alias / repo-path leakage; buyer-safe three-layer summary.
 */


/**
 * TB-1677 — DPA template help: strip contributor .md / pack-path leakage; in-app trust links.
 */


/**
 * TB-1688 — sponsor-report help (FAQ source): strip contributor FAQ / eng-path leakage.
 */


export const FIRST_VALUE_20_MINUTES_SECTION_HEADING_RE =
  /^## First value in 20 minutes \(time-boxed\)(?:\s*\{#[^}]+\})?\s*$/im;

/**
 * TB-1693 — keep only the first 20-minute time-box section from the full operator runbook.
 */
export function extractFirstValue20MinutesSection(markdown: string): string {
  const headingMatch = FIRST_VALUE_20_MINUTES_SECTION_HEADING_RE.exec(markdown);

  if (headingMatch === null || headingMatch.index === undefined) {
    return markdown;
  }

  const sectionStart = headingMatch.index;
  const afterHeading = markdown.slice(sectionStart);
  const nextMajorSection = afterHeading.search(/\n## (?!#)/);

  if (nextMajorSection < 0) {
    return afterHeading.trimEnd();
  }

  return afterHeading.slice(0, nextMajorSection).trimEnd();
}

/**
 * TB-1693 — first-value-20 help: strip CLI/dotnet / runbook-path leakage; bare archlucid CLI.
 */
/** H2 sections omitted from in-app first-review SE checklist (ops scripts / eng Related). */
export const FIRST_REVIEW_EVIDENCE_OMITTED_SECTION_PREFIXES = [
  "optional tier 2",
  "repeat review",
  "related",
] as const;

/**
 * Drops Tier-2 WIF, PowerShell proof, and eng Related sections from the folded first-review checklist section.
 */


/**
 * First-review help: soften API success signals and map eng .md hrefs to in-app help.
 */


/** H2 sections omitted from in-app CLI usage help (vendor-internal / GTM). */
export const CLI_USAGE_OMITTED_SECTION_PREFIXES = [
  "proof-packet gtm guardrails",
  "archlucid marketplace preflight",
] as const;

/**
 * HCX — drops GTM guardrails and marketplace preflight sections from `/help/cli-usage`.
 */


/**
 * HCX — vendor-internal leakage strip for `/help/cli-usage` (staging hosts, GTM paths, eng DB names).
 */


/**
 * HDX — map eng-library hrefs to in-app Admin/customer help where safe; keep CLI/env triage body.
 */


export function stripFirstValue20ExtractedSectionHeading(markdown: string): string {
  const lines = markdown.split("\n");
  let index = 0;

  while (index < lines.length && (lines[index] ?? "").trim().length === 0) {
    index++;
  }

  const firstLine = (lines[index] ?? "").trim();

  if (FIRST_VALUE_20_MINUTES_SECTION_HEADING_RE.test(firstLine)) {
    index++;

    while (index < lines.length && (lines[index] ?? "").trim().length === 0) {
      index++;
    }
  }

  return lines.slice(index).join("\n").trimStart();
}

export function replaceFirstValue20OutsideBacktickSpans(
  text: string,
  proseReplace: (segment: string) => string,
  codeReplace: (inner: string) => string,
): string {
  const parts = text.split(/(`[^`]*`)/g);

  return parts
    .map((part, index) => {
      if (index % 2 === 1 && part.startsWith("`") && part.endsWith("`")) {
        const inner = part.slice(1, -1);

        return `\`${codeReplace(inner)}\``;
      }

      return proseReplace(part);
    })
    .join("");
}

export function applyFirstValue20ProseLeakageReplacements(segment: string): string {
  return segment
    .replace(/\[ROLE_INDEX\.md\]/gi, "[role index]")
    .replace(/\[TROUBLESHOOTING\.md\]/gi, "[Troubleshooting]")
    .replace(/`?archlucid\.json`?/gi, "CLI configuration file")
    .replace(/`?ARCHLUCID_API_KEY`?/gi, "API key environment variable")
    .replace(/`GET \/health\/live`/gi, "health check endpoint")
    .replace(/`?ROLE_INDEX\.md`?/gi, "role index")
    .replace(/ROLE_INDEX\.md/gi, "role index")
    .replace(/`?CANONICAL_FIRST_RUN_PATH\.md`?/gi, "[Your first architecture review](/help/first-architecture-review)")
    .replace(/CANONICAL_FIRST_RUN_PATH\.md/gi, "/help/first-architecture-review")
    .replace(/`?CORE_PILOT\.md`?/gi, "[Your first architecture review](/help/first-architecture-review)")
    .replace(/CORE_PILOT\.md/gi, "/help/first-architecture-review")
    .replace(/`?PILOT_PREREQUISITES\.md`?/gi, "pilot prerequisites checklist")
    .replace(/PILOT_PREREQUISITES\.md/gi, "pilot prerequisites checklist")
    .replace(/`?FIRST_PILOT_PRODUCTION_LIKE_PREFLIGHT\.md`?/gi, "production-like preflight checklist")
    .replace(/FIRST_PILOT_PRODUCTION_LIKE_PREFLIGHT\.md/gi, "production-like preflight checklist")
    .replace(/`?TROUBLESHOOTING\.md`?/gi, "/help/troubleshooting")
    .replace(/TROUBLESHOOTING\.md/gi, "/help/troubleshooting")
    .replace(
      /`?PRODUCTION_LIKE_AUTH_HANDOFF_CHECKLIST\.md`?/gi,
      "production-like authentication checklist",
    )
    .replace(/PRODUCTION_LIKE_AUTH_HANDOFF_CHECKLIST\.md/gi, "production-like authentication checklist")
    .replace(/`?QUALITY_GATE_REJECTION\.md`?/gi, "quality gate rejection guide")
    .replace(/QUALITY_GATE_REJECTION\.md/gi, "quality gate rejection guide")
    .replace(/`?OPERATIONS_LLM_QUOTA\.md`?/gi, "LLM quota operations guide")
    .replace(/OPERATIONS_LLM_QUOTA\.md/gi, "LLM quota operations guide")
    .replace(/`?FIRST_PILOT_EVIDENCE_BUNDLE\.md`?/gi, "first-pilot evidence bundle guide")
    .replace(/FIRST_PILOT_EVIDENCE_BUNDLE\.md/gi, "first-pilot evidence bundle guide")
    .replace(/`?GOLDEN_ACCELERATOR_WALKTHROUGH\.md`?/gi, "golden accelerator walkthrough")
    .replace(/GOLDEN_ACCELERATOR_WALKTHROUGH\.md/gi, "golden accelerator walkthrough")
    .replace(/`?STARTER_PROOF_PACK_CHOOSER\.md`?/gi, "[Specialty walkthroughs](/help/specialty-walkthroughs)")
    .replace(/STARTER_PROOF_PACK_CHOOSER\.md/gi, "/help/specialty-walkthroughs")
    .replace(/\.\/scripts\/[^\s)`]*/gi, "<admin-automation-script>")
    .replace(/artifacts\/[^\s`|)]+/gi, "<output-folder>");
}

export function applyFirstValue20CodeSpanLeakageReplacements(inner: string): string {
  return inner
    .replace(/dotnet run --project ArchLucid\.Cli -- /gi, "archlucid ")
    .replace(/ROLE_INDEX\.md/gi, "role-index")
    .replace(/TROUBLESHOOTING\.md/gi, "troubleshooting")
    .replace(/\.\/scripts\/[^\s)`]*/gi, "<admin-automation-script>")
    .replace(/scripts\/[^\s)`]+/gi, "<admin-automation-script>")
    .replace(/artifacts\/[^\s`|)]+/gi, "<output-folder>");
}



/**
 * TB-1712 — path-chooser help: strip GTM/runbook .md and artifacts/ leakage; in-app trust links.
 */
/** H2 sections omitted from in-app pilot-feedback help (eng PRD / API theater). */
export const PILOT_FEEDBACK_OMITTED_SECTION_PREFIXES = ["4.2 planning bridge", "6. related docs"] as const;

/**
 * TB-1717 — drops planning-bridge eng PRD from in-app pilot-feedback help.
 */


export function isPilotFeedbackContributorLeakageLine(line: string): boolean {
  if (/\/v1\//i.test(line)) {
    return true;
  }

  if (/ArchLucid:/i.test(line)) {
    return true;
  }

  if (/Swagger/i.test(line)) {
    return true;
  }

  if (/x-tenant-id|x-workspace-id|x-project-id/i.test(line)) {
    return true;
  }

  if (/LearningController/i.test(line)) {
    return true;
  }

  if (/ProductLearningPlanningMaterializeResult/i.test(line)) {
    return true;
  }

  if (/LearningPlanningQueryParser/i.test(line)) {
    return true;
  }

  if (/OperatorApiProblem/i.test(line)) {
    return true;
  }

  if (/openapi/i.test(line)) {
    return true;
  }

  if (/DATA_MODEL/i.test(line)) {
    return true;
  }

  if (/\/help\/governance-api-contracts|\/help\/api-contracts/i.test(line)) {
    return true;
  }

  if (/change_set_series|change set series/i.test(line)) {
    return true;
  }

  if (/API_CONTRACTS/i.test(line)) {
    return true;
  }

  if (/TEST_STRUCTURE/i.test(line)) {
    return true;
  }

  if (/archive\/CHANGE_SET/i.test(line)) {
    return true;
  }

  if (/archlucid-ui/i.test(line)) {
    return true;
  }

  if (/ARCHLUCID_API_BASE_URL/i.test(line)) {
    return true;
  }

  if (/ChangeSet=58R|FullyQualifiedName~ProductLearning/i.test(line)) {
    return true;
  }

  if (/^\*\*API:\*\*/i.test(line.trim())) {
    return true;
  }

  if (/^\| Goal \| Call \|/i.test(line.trim())) {
    return true;
  }

  if (/^\|.*\/v1\//i.test(line)) {
    return true;
  }

  if (/Administrator details — API and storage/i.test(line)) {
    return true;
  }

  if (/API \(same scope headers\)/i.test(line)) {
    return true;
  }

  if (/Each full load issues/i.test(line)) {
    return true;
  }

  if (/expandable API notes/i.test(line)) {
    return true;
  }

  if (/Correlation IDs:/i.test(line)) {
    return true;
  }

  if (/ProductLearningPlanningMaterialized/i.test(line)) {
    return true;
  }

  if (/learning\.planning_materialize_clicked/i.test(line)) {
    return true;
  }

  if (/ui-e2e-live|release-smoke|appsettings/i.test(line)) {
    return true;
  }

  if (/PlanningBridgePanel/i.test(line)) {
    return true;
  }

  if (/ProductLearningOpportunityScoring/i.test(line)) {
    return true;
  }

  if (/§4\.2 \(this doc\)/i.test(line)) {
    return true;
  }

  if (/^\*\*Tests:\*\*/i.test(line.trim())) {
    return true;
  }

  return false;
}

/**
 * TB-1717 — pilot-feedback help: strip SQL/API/StorageProvider/Swagger leakage; UI-first Admin guide.
 */


/** H2 sections omitted from in-app policy-pack-delta help (scripts, CI rehearsal, GTM index). */
export const POLICY_PACK_DELTA_OMITTED_SECTION_PREFIXES = [
  "local automation",
  "policy-to-decision proof pilot",
  "related",
] as const;

/**
 * TB-1727 — drops script/CI/GTM appendix sections from in-app policy-pack-delta help.
 */


export function isPolicyPackDeltaContributorLeakageLine(line: string): boolean {
  if (/\/v1\//i.test(line)) {
    return true;
  }

  if (/demo-policy-pack-delta\.ps1/i.test(line)) {
    return true;
  }

  if (/PreCommitGateEnabled/i.test(line)) {
    return true;
  }

  if (/ArchLucid:/i.test(line)) {
    return true;
  }

  if (/ReadAuthority|PolicyPackMutationAuthority|RequireAuditor/i.test(line)) {
    return true;
  }

  if (/x-tenant-id|x-workspace-id|x-project-id/i.test(line)) {
    return true;
  }

  if (/\bscripts\//i.test(line)) {
    return true;
  }

  if (/dotnet test|npx vitest|FullyQualifiedName/i.test(line)) {
    return true;
  }

  if (/tests\/fixtures\//i.test(line)) {
    return true;
  }

  if (/artifacts\/policy-pack-delta/i.test(line)) {
    return true;
  }

  if (/127\.0\.0\.1:5128/i.test(line)) {
    return true;
  }

  if (/policy-ab-demo-fixture/i.test(line)) {
    return true;
  }

  if (/PolicyAbDemoRegressionTests/i.test(line)) {
    return true;
  }

  if (/PolicyPackBeforeAfterDiffDemoTests/i.test(line)) {
    return true;
  }

  if (/\*\*Automation:\*\*/i.test(line)) {
    return true;
  }

  if (/\*\*Pilot sequencing:\*\*/i.test(line)) {
    return true;
  }

  if (/GTM_BACKLOG|QUOTE_TO_PROOF_PACKET|BUYER_SECURITY_PROCUREMENT|DIFFERENTIATION_PROOF_PACKET/i.test(line)) {
    return true;
  }

  if (/LATEST_GPT55|assessments\//i.test(line)) {
    return true;
  }

  if (/gateResult\.blocked|wouldBlockCommit|blockCommitMinimumSeverity|blockCommitOnCritical/i.test(line)) {
    return true;
  }

  if (/policyPackContentJson|syntheticSeverity|syntheticCount|proposedThresholds|evaluateAgainstRunIds/i.test(line)) {
    return true;
  }

  if (/^### API\b/i.test(line.trim())) {
    return true;
  }

  if (/^```http\b/i.test(line.trim())) {
    return true;
  }

  if (/^```powershell\b/i.test(line.trim())) {
    return true;
  }

  if (/^\|\s*[-:| ]+\|\s*$/i.test(line.trim())) {
    return true;
  }

  return false;
}

/**
 * TB-1727 — policy-pack-delta help: strip HTTP/config/script/GUID leakage; UI-first Admin demo guide.
 */


/**
 * TB-1733 — prior-manifest help: strip host config keys; state default limit in operator language.
 */


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

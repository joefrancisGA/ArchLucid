import { stripMarkdownSectionsByTitlePrefix } from "@/lib/help-markdown/section-strips";
import { rewriteProcurementFaqBuyerPresentation } from "@/lib/procurement-help-presentation";

export function stripProcurementContributorLeakage(markdown: string): string {
  return rewriteProcurementFaqBuyerPresentation(
    markdown
    .replace(/Improvement archived\s*\*?\*?#?\d+\*?\*?/gi, "")
    .replace(/`?archlucid auth(?:\s+validate-saml)?`?/gi, "IdP federation validation")
    .replace(/`?V1_SCOPE\.md`?/gi, "product scope")
    .replace(/V1_SCOPE\.md/gi, "product scope")
    .replace(/`?CONFIGURATION_REFERENCE\.md`?/gi, "configuration documentation")
    .replace(/CONFIGURATION_REFERENCE\.md/gi, "configuration documentation")
    .replace(/`?SECURITY\.md`?/gi, "security documentation")
    .replace(/contributor-reference\/SECURITY\.md/gi, "security documentation")
    .replace(/`?PENDING_QUESTIONS\.md`?/gi, "owner diligence notes")
    .replace(/PENDING_QUESTIONS\.md/gi, "owner diligence notes")
    .replace(/infra\/terraform-entra\/?/gi, "hosted identity samples")
    .replace(/`infra\/`/gi, "hosted infrastructure")
    .replace(/\binfra\//gi, "hosted infrastructure ")
    .replace(/ArtifactLargePayload:[A-Za-z0-9]+/g, "regional storage configuration")
    .replace(/TenantProvisioning:[A-Za-z0-9]+/g, "tenant provisioning configuration")
    .replace(/dbo\.Tenants(?:\.[A-Za-z0-9_]+)?/gi, "tenant residency settings")
    .replace(/ArchLucidAuth:[A-Za-z0-9]+/g, "authentication configuration")
    .replace(/Order Form Addendum [A-Z]/gi, "Order Form addendum")
    .replace(/MSA_TEMPLATE\.md/gi, "MSA template")
    .replace(/ORDER_FORM_TEMPLATE\.md/gi, "Order Form template")
    .replace(/CUSTOM_POLICY_PACK_AUTHORING_SOW_TEMPLATE\.md/gi, "SoW template")
    .replace(/PRICING_PHILOSOPHY\.md/gi, "pricing documentation")
    .replace(/SLA_SUMMARY\.md/gi, "SLA summary")
    .replace(/SLA_TARGETS\.md/gi, "SLA targets"),
  );
}

/** H2 sections omitted from in-app configuration reference (contributor / marketing / test-only). */
const CONFIGURATION_REFERENCE_OMITTED_SECTION_PREFIXES = [
  "testing (non-production)",
  "public marketing site",
] as const;

/**
 * TB-1327 — drops Testing / marketing-build sections from the product configuration help view.
 */
export function stripConfigurationReferenceContributorSections(markdown: string): string {
  return stripMarkdownSectionsByTitlePrefix(markdown, CONFIGURATION_REFERENCE_OMITTED_SECTION_PREFIXES);
}

/** H2 sections omitted from in-app enterprise onboarding (ArchLucid CS / ops theater). */
const ENTERPRISE_ONBOARDING_OMITTED_SECTION_PREFIXES = [
  "tenant provisioning",
  "onboarding hub",
  "sign-off",
] as const;

/**
 * Removes the duplicate Quick links blockquote — the interactive hub step list replaces it in-app.
 */
export function stripEnterpriseOnboardingQuickLinksBlock(markdown: string): string {
  const lines = markdown.split("\n");
  const result: string[] = [];
  let omitBlockquote = false;

  for (const line of lines) {
    if (/^>\s*\*\*Quick links\*\*/i.test(line)) {
      omitBlockquote = true;
      continue;
    }

    if (omitBlockquote) {
      if (line.trim() === "---" || (line.startsWith("## ") && !line.startsWith("###"))) {
        omitBlockquote = false;

        if (line.trim() !== "---") {
          result.push(line);
        }
      }

      continue;
    }

    result.push(line);
  }

  return result.join("\n");
}

/**
 * TB-1339 — drops ArchLucid-internal tenant provisioning from the product onboarding help view.
 */
export function stripEnterpriseOnboardingContributorSections(markdown: string): string {
  return stripMarkdownSectionsByTitlePrefix(markdown, ENTERPRISE_ONBOARDING_OMITTED_SECTION_PREFIXES);
}

/**
 * TB-1339 — removes eng CLI/appsettings, Evidence-tier jargon, and demotes JwtBearer /
 * ClaimMappingJson vocabulary from in-app enterprise onboarding presentation.
 */
export function stripEnterpriseOnboardingContributorLeakage(markdown: string): string {
  const lines = markdown.split("\n");
  const result: string[] = [];
  let inFence = false;
  let detailsBuffer: string[] | null = null;

  const flushDetailsBuffer = (): void => {
    if (detailsBuffer === null) {
      return;
    }

    const block = detailsBuffer.join("\n");
    detailsBuffer = null;

    // Drop eng-only configuration-keys disclosure (CLI / appsettings helpers).
    if (
      /configuration keys/i.test(block) ||
      /archlucid auth\b/i.test(block) ||
      /archlucid saml\b/i.test(block) ||
      /\bappsettings\b/i.test(block)
    ) {
      return;
    }

    for (const bufferedLine of block.split("\n")) {
      result.push(bufferedLine);
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const trimmedStart = line.trimStart();

    if (trimmedStart.startsWith("```")) {
      inFence = !inFence;
    }

    if (!inFence && /^<details\b/i.test(trimmed)) {
      detailsBuffer = [line];
      continue;
    }

    if (detailsBuffer !== null) {
      detailsBuffer.push(line);

      if (/^<\/details>/i.test(trimmed)) {
        flushDetailsBuffer();
      }

      continue;
    }

    if (!inFence && /^\*\*Evidence tier:\*\*/i.test(trimmed)) {
      continue;
    }

    if (
      !inFence &&
      (/archlucid auth\b/i.test(line) || /archlucid saml\b/i.test(line) || /\bappsettings\b/i.test(line))
    ) {
      continue;
    }

    result.push(line);
  }

  flushDetailsBuffer();

  return result
    .join("\n")
    .replace(/\bOIDC JwtBearer\b/gi, "OpenID Connect (OIDC)")
    .replace(/\bJwtBearer\b/g, "OpenID Connect")
    .replace(/`ClaimMappingJson`/g, "role claim mapping")
    .replace(/\bClaimMappingJson\b/g, "role claim mapping")
    .replace(/`claim-mapping\.json`/gi, "role claim mapping file")
    .replace(/\bclaim-mapping\.json\b/gi, "role claim mapping file")
    .replace(/\n{3,}/g, "\n\n");
}

/**
 * TB-1346 — removes SE CLI / proof-collector disclosure and eng jargon from evaluator workbook help.
 */
export function stripEvaluatorWorkbookContributorLeakage(markdown: string): string {
  const lines = markdown.split("\n");
  const result: string[] = [];
  let inFence = false;
  let detailsBuffer: string[] | null = null;

  const flushDetailsBuffer = (): void => {
    if (detailsBuffer === null) {
      return;
    }

    const block = detailsBuffer.join("\n");
    detailsBuffer = null;

    if (
      /CLI and proof/i.test(block) ||
      /collect-first-pilot-proof/i.test(block) ||
      /ArchLucid\.Cli/i.test(block) ||
      /ARCHLUCID_API_URL/i.test(block)
    ) {
      return;
    }

    for (const bufferedLine of block.split("\n")) {
      result.push(bufferedLine);
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const trimmedStart = line.trimStart();

    if (trimmedStart.startsWith("```")) {
      inFence = !inFence;
    }

    if (!inFence && /^<details\b/i.test(trimmed)) {
      detailsBuffer = [line];
      continue;
    }

    if (detailsBuffer !== null) {
      detailsBuffer.push(line);

      if (/^<\/details>/i.test(trimmed)) {
        flushDetailsBuffer();
      }

      continue;
    }

    if (
      !inFence &&
      (/collect-first-pilot-proof/i.test(line) ||
        /ArchLucid\.Cli/i.test(line) ||
        /ARCHLUCID_API_URL/i.test(line) ||
        /\.\/scripts\//i.test(line))
    ) {
      continue;
    }

    result.push(line);
  }

  flushDetailsBuffer();

  return result
    .join("\n")
    .replace(/\(former EVALUATION_GUIDE\)/gi, "")
    .replace(/\bTier-1\b/g, "optional")
    .replace(/\bPilotStrict\b/g, "strict AI quality checks")
    .replace(/\bauthority pipeline\b/gi, "architecture analysis")
    .replace(/\[`?BUYER_FIRST_30_MINUTES\.md`?\]\([^)]+\)/gi, "[Your first architecture review](/help/first-architecture-review)")
    .replace(/\[`?SECOND_RUN\.md`?\]\([^)]+\)/gi, "[Repeat a review](/help/repeat-review-loop)")
    .replace(
      /\[`?FIRST_PILOT_OPERATOR_PATH\.md`?\]\([^)]+\)/gi,
      "[Your first architecture review](/help/first-architecture-review)",
    )
    .replace(
      /\[`?FIRST_PILOT_TROUBLESHOOTING\.md`?\]\([^)]+\)/gi,
      "[Troubleshooting](/help/troubleshooting)",
    )
    .replace(/`?BUYER_FIRST_30_MINUTES\.md`?/gi, "buyer first session guide")
    .replace(/`?SECOND_RUN\.md`?/gi, "second review guide")
    .replace(/`?FIRST_PILOT_OPERATOR_PATH\.md`?/gi, "complete review workflow")
    .replace(/`?FIRST_PILOT_TROUBLESHOOTING\.md`?/gi, "troubleshooting guide")
    .replace(/\n{3,}/g, "\n\n");
}

/**
 * TB-1327 — removes backlog IDs, RC script/fixture paths, ADR deep links, and contributor
 * security/scope anchors from in-app configuration reference presentation.
 */
export function stripConfigurationReferenceContributorLeakage(markdown: string): string {
  let inFence = false;

  const withoutSensitiveRows = markdown
    .split("\n")
    .filter((line) => {
      const trimmedStart = line.trimStart();

      if (trimmedStart.startsWith("```")) {
        inFence = !inFence;
        return true;
      }

      if (inFence) {
        return true;
      }

      if (/AllowRlsBypass/i.test(line)) {
        return false;
      }

      if (/InternalCrossTenantAnalytics/i.test(line)) {
        return false;
      }

      if (/\*\*Release-candidate gates/i.test(line)) {
        return false;
      }

      return true;
    })
    .join("\n");

  return withoutSensitiveRows
    .replace(/\s*\(TB-\d+\)/gi, "")
    .replace(/\bTB-\d+\b/gi, "")
    .replace(/\[ADR\s+\d+\]\([^)]+\)/gi, "production secrets guidance")
    .replace(/\bADR\s+\d+\b/gi, "production secrets guidance")
    .replace(/docs\/architecture\/adrs\/[^\s)]+/gi, "architecture guidance")
    .replace(/`?scripts\/[^`\s)]+`?/gi, "release readiness checks")
    .replace(/\bscripts\/[^\s)]+/gi, "release readiness checks")
    .replace(/`?fixtures\/release-candidate\/[^`\s)]*`?/gi, "release-candidate baseline config")
    .replace(/fixtures\/release-candidate\/[^\s)]*/gi, "release-candidate baseline config")
    .replace(/`?artifacts\/release-readiness\/[^`\s)]*`?/gi, "release readiness evidence")
    .replace(/artifacts\/release-readiness\/[^\s)]*/gi, "release readiness evidence")
    .replace(/\[([^\]]*)\]\(contributor-reference\/SECURITY\.md\)/gi, "security documentation")
    .replace(/contributor-reference\/SECURITY\.md/gi, "security documentation")
    .replace(/contributor-reference\//gi, "")
    .replace(/\[([^\]]*)\]\(V1_SCOPE\.md[^)]*\)/gi, "product scope")
    .replace(/`?V1_SCOPE\.md`?/gi, "product scope")
    .replace(/docs\/library\/V1_SCOPE\.md/gi, "product scope")
    .replace(/\[([^\]]*)\]\([^)]*SECURITY\.md\)/gi, "security documentation")
    .replace(/`?SECURITY\.md`?/gi, "security documentation")
    .replace(/PUBLIC_MARKETING_SITE_TOPOLOGY\.md/gi, "marketing site topology")
    .replace(/`?\.\\scripts\\[^`\s]+`?/gi, "prerequisite validation")
    .replace(/\.\\scripts\\[^\s)]+/gi, "prerequisite validation")
    // TB-1330 — map eng runbook/ADR hrefs to in-app help (or plain text) so product body stays product-routed.
    .replace(
      /\[([^\]]*)\]\((?:\.\.\/)?(?:docs\/)?runbooks\/GENERIC_OIDC_SETUP\.md\)/gi,
      "[Authentication and sign-in](/help/authentication-sign-in)",
    )
    .replace(
      /\[([^\]]*)\]\((?:\.\.\/)?(?:docs\/)?runbooks\/PILOT_PREREQUISITES\.md\)/gi,
      "[Enterprise onboarding](/help/enterprise-onboarding)",
    )
    .replace(
      /\[([^\]]*)\]\((?:\.\.\/)?(?:docs\/)?runbooks\/MINIMAL_AZURE_PILOT_DEPLOYMENT\.md\)/gi,
      "[Cloud connections](/help/cloud-connections)",
    )
    .replace(
      /\[([^\]]*)\]\((?:\.\.\/)?(?:docs\/)?runbooks\/SAML_SP_CERTIFICATE_ROTATION_RUNBOOK\.md\)/gi,
      "[Authentication and sign-in](/help/authentication-sign-in)",
    )
    .replace(
      /\[([^\]]*)\]\((?:\.\.\/)?(?:docs\/)?runbooks\/DATABASE_FAILOVER\.md\)/gi,
      "database failover guidance",
    )
    .replace(
      /\[([^\]]*)\]\((?:\.\.\/)?(?:docs\/)?runbooks\/LLM_COST_ESTIMATION\.md\)/gi,
      "LLM cost estimation guidance",
    )
    .replace(
      /\[([^\]]*)\]\((?:\.\.\/)?(?:docs\/)?runbooks\/MANIFEST_CHUNK_SUMMARIZATION\.md\)/gi,
      "manifest summarization guidance",
    )
    .replace(
      /\[([^\]]*)\]\((?:\.\.\/)?(?:docs\/)?runbooks\/[^)]+\)/gi,
      "$1",
    )
    .replace(/\[([^\]]*)\]\([^)]*architecture\/adrs\/[^)]+\)/gi, "$1")
    .replace(/\[([^\]]*)\]\(HOSTED_ENTERPRISE_ONBOARDING_CHECKLIST\.md[^)]*\)/gi, "[Enterprise onboarding](/help/enterprise-onboarding)")
    .replace(/\[([^\]]*)\]\(API_AUTH_BEHAVIOR_CONTRACT\.md[^)]*\)/gi, "[Authentication and sign-in](/help/authentication-sign-in)")
    .replace(/\[([^\]]*)\]\(READ_REPLICA_ROUTING\.md[^)]*\)/gi, "$1")
    .replace(/\n{3,}/g, "\n\n");
}

/** H2 sections omitted from in-app governance API contracts (CI / contributor PR process). */
const GOVERNANCE_API_CONTRACTS_OMITTED_SECTION_PREFIXES = [
  "contract surface and ci controls",
  "changing the http contract",
] as const;

/**
 * TB-1388 — drops CI snapshot and PR-checklist sections from the governance API contracts help view.
 */
export function stripGovernanceApiContractsContributorSections(markdown: string): string {
  return stripMarkdownSectionsByTitlePrefix(markdown, GOVERNANCE_API_CONTRACTS_OMITTED_SECTION_PREFIXES);
}

/**
 * TB-1388 — removes OpenAPI snapshot regenerate commands, CI fixture paths, runbooks, TB IDs,
 * and other contributor process leakage from in-app governance API contracts presentation.
 */
export function stripGovernanceApiContractsContributorLeakage(markdown: string): string {
  let inFence = false;

  const withoutSensitiveRows = markdown
    .split("\n")
    .filter((line) => {
      const trimmedStart = line.trimStart();

      if (trimmedStart.startsWith("```")) {
        inFence = !inFence;
        return true;
      }

      if (inFence) {
        return true;
      }

      if (/OpenApiContractSnapshotTests/i.test(line)) {
        return false;
      }

      if (/OpenApiBuyerContractSnapshotTests/i.test(line)) {
        return false;
      }

      if (/ARCHLUCID_UPDATE_OPENAPI_SNAPSHOT/i.test(line)) {
        return false;
      }

      if (/ARCHLUCID_UPDATE_BUYER_OPENAPI_SNAPSHOT/i.test(line)) {
        return false;
      }

      if (/ArchLucid\.Api\.Tests\/Contracts/i.test(line)) {
        return false;
      }

      if (/contracts\/bruno/i.test(line)) {
        return false;
      }

      if (/\bscripts\/(ci|v1-integration)/i.test(line)) {
        return false;
      }

      if (/docs\/runbooks\//i.test(line)) {
        return false;
      }

      if (/Integration starter fixtures/i.test(line)) {
        return false;
      }

      if (/v1-integration-correctness-drill/i.test(line)) {
        return false;
      }

      if (/npm run generate:api-types/i.test(line)) {
        return false;
      }

      if (/assert_api_types_in_sync/i.test(line)) {
        return false;
      }

      if (/Generated\/ArchLucidApiClient\.g\.cs/i.test(line)) {
        return false;
      }

      if (/OPENAPI_CONTRACT_DRIFT\.md/i.test(line)) {
        return false;
      }

      if (/archlucid reference-evidence/i.test(line)) {
        return false;
      }

      return true;
    })
    .join("\n");

  return withoutSensitiveRows
    .replace(/\s*\(TB-\d+\)/gi, "")
    .replace(/\bTB-\d+\b/gi, "")
    .replace(/`?START_HERE\.md`?/gi, "product documentation index")
    .replace(/START_HERE\.md/gi, "product documentation index")
    .replace(/`?ArchLucid\.Api\/[^`\s)]+`?/gi, "API host configuration")
    .replace(/ArchLucid\.Api\/[^\s)]+/gi, "API host configuration")
    .replace(/`?docs\/operator-shell\.md`?/gi, "operator console documentation")
    .replace(/docs\/operator-shell\.md/gi, "operator console documentation")
    .replace(/`?scripts\/[^`\s)]+`?/gi, "integration validation checks")
    .replace(/\bscripts\/[^\s)]+/gi, "integration validation checks")
    .replace(/`?docs\/runbooks\/[^`\s)]+`?/gi, "operations runbook")
    .replace(/docs\/runbooks\/[^\s)]+/gi, "operations runbook")
    .replace(/`?contracts\/bruno\/[^`\s)]*`?/gi, "API smoke collection")
    .replace(/contracts\/bruno\/[^\s)]*/gi, "API smoke collection")
    .replace(/`?ArchLucid\.Api\.Client`?/gi, "generated API client")
    .replace(/\bArchLucid\.Api\.Client\b/gi, "generated API client")
    .replace(/\n{3,}/g, "\n\n");
}

/**
 * TB-1390 / fold PI→SPE — removes contributor leakage from executive-summary pilot ROI measurement section.
 */
export function stripExecutiveSummaryPilotRoiMeasurementLeakage(markdown: string): string {
  let inFence = false;

  const withoutSensitiveRows = markdown
    .split("\n")
    .filter((line) => {
      const trimmedStart = line.trimStart();

      // Earlier sponsor-brief email templates use fenced blocks; reset at H2 so folded
      // scorecard sections are not treated as still inside a code fence.
      if (/^##\s+/.test(trimmedStart)) {
        inFence = false;
      }

      if (trimmedStart.startsWith("```")) {
        inFence = !inFence;
        return true;
      }

      if (inFence) {
        return true;
      }

      if (/Former standalone(?: body)?:/i.test(line)) {
        return false;
      }

      if (/path-stable alias for product\/ci strings/i.test(line)) {
        return false;
      }

      if (/Conservative value from\s+.+\boptions\b/i.test(line)) {
        return false;
      }

      if (/START_HERE\.md/i.test(line)) {
        return false;
      }

      if (/V1_SCOPE\.md/i.test(line)) {
        return false;
      }

      if (/CORE_PILOT\.md/i.test(line)) {
        return false;
      }

      if (/REPOSITORY_README/i.test(line)) {
        return false;
      }

      if (/archive\/gtm-internal/i.test(line)) {
        return false;
      }

      if (/OPERATOR_DECISION_GUIDE/i.test(line)) {
        return false;
      }

      if (/PRODUCT_PACKAGING/i.test(line)) {
        return false;
      }

      if (/PMF tracker/i.test(line)) {
        return false;
      }

      if (/CLI copy/i.test(line) && /CI strings/i.test(line)) {
        return false;
      }

      if (/docs\/go-to-market\/validation\//i.test(line)) {
        return false;
      }

      return true;
    })
    .join("\n");

  return withoutSensitiveRows
    .replace(/\s*\(TB-\d+\)/gi, "")
    .replace(/\bTB-\d+\b/gi, "")
    .replace(/`?START_HERE\.md`?/gi, "product documentation index")
    .replace(/`?V1_SCOPE\.md`?/gi, "product scope")
    .replace(/`?CORE_PILOT\.md`?/gi, "Your first architecture review")
    .replace(/`?REPOSITORY_README`?/gi, "repository overview")
    .replace(/`?OPERATOR_DECISION_GUIDE\.md`?/gi, "deployment decision guide")
    .replace(/`?PRODUCT_PACKAGING\.md`?/gi, "product packaging guide")
    .replace(
      /`?EXECUTIVE_SPONSOR_BRIEF\.md`?/gi,
      "[Executive summary](/help/executive-summary)",
    )
    .replace(/EXECUTIVE_SPONSOR_BRIEF\.md/gi, "/help/executive-summary")
    .replace(
      /`?PILOT_ROI_MODEL\.md`?/gi,
      "[Pilot ROI measurement](/help/executive-summary#pilot-roi-measurement)",
    )
    .replace(/PILOT_ROI_MODEL\.md/gi, "/help/executive-summary#pilot-roi-measurement")
    .replace(
      /`?ROI_MODEL\.md`?/gi,
      "[Pilot ROI measurement](/help/executive-summary#pilot-roi-measurement)",
    )
    .replace(/ROI_MODEL\.md/gi, "/help/executive-summary#pilot-roi-measurement")
    .replace(/`?docs\/go-to-market\/[^`\s)]+`?/gi, "go-to-market documentation")
    .replace(/docs\/go-to-market\/[^\s)]+/gi, "go-to-market documentation")
    .replace(/`?docs\/library\/[^`\s)]+`?/gi, "product documentation")
    .replace(/docs\/library\/[^\s)]+/gi, "product documentation")
    .replace(/\bPilot Roi Model options\b/gi, "pilot ROI methodology options")
    .replace(/\bPilot Roi Model\b/gi, "pilot ROI methodology")
    .replace(/\bCore Pilot\b/g, "Your first architecture review")
    .replace(/\n{3,}/g, "\n\n");
}

/** @deprecated Folded into executive-summary#pilot-roi-measurement — use stripExecutiveSummaryPilotRoiMeasurementLeakage. */
export function stripPilotRoiModelContributorLeakage(markdown: string): string {
  return stripExecutiveSummaryPilotRoiMeasurementLeakage(markdown);
}

/** H2 sections omitted from in-app repeat-review help (founder validation / proof theater). */
const REPEAT_REVIEW_LOOP_OMITTED_SECTION_PREFIXES = [
  "second-review habit loop validation",
  "related help",
] as const;

/**
 * TB-1396 — drops habit-loop validation and founder proof-theater sections from repeat-review help.
 */
export function stripRepeatReviewLoopContributorSections(markdown: string): string {
  return stripMarkdownSectionsByTitlePrefix(markdown, REPEAT_REVIEW_LOOP_OMITTED_SECTION_PREFIXES);
}

/**
 * TB-1396 — removes CLI proof scripts, eng `.md` paths, fixtures, and TB IDs from repeat-review help.
 */
export function stripRepeatReviewLoopContributorLeakage(markdown: string): string {
  const lines = markdown.split("\n");
  const result: string[] = [];
  let inFence = false;
  let fenceBuffer: string[] = [];
  let detailsBuffer: string[] | null = null;

  const flushFenceBuffer = (): void => {
    if (fenceBuffer.length === 0) {
      return;
    }

    const block = fenceBuffer.join("\n");
    fenceBuffer = [];

    if (/collect-first-pilot-proof/i.test(block) || /archlucid second-run/i.test(block)) {
      return;
    }

    for (const bufferedLine of block.split("\n")) {
      result.push(bufferedLine);
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const trimmedStart = line.trimStart();

    if (trimmedStart.startsWith("```")) {
      if (inFence) {
        fenceBuffer.push(line);
        flushFenceBuffer();
        inFence = false;
        continue;
      }

      inFence = true;
      fenceBuffer = [line];
      continue;
    }

    if (inFence) {
      fenceBuffer.push(line);
      continue;
    }

    if (/^<details\b/i.test(trimmed)) {
      detailsBuffer = [line];
      continue;
    }

    if (detailsBuffer !== null) {
      detailsBuffer.push(line);

      if (/^<\/details>/i.test(trimmed)) {
        detailsBuffer = null;
      }

      continue;
    }

    if (/^\*\*Habit-loop validation:\*\*/i.test(trimmed)) {
      continue;
    }

    if (/^\*\*Audience:\*\*/i.test(trimmed)) {
      continue;
    }

    if (/^\*\*Prerequisite:\*\*/i.test(trimmed)) {
      continue;
    }

    if (/SECOND_REVIEW_HABIT_LOOP_VALIDATION/i.test(line)) {
      continue;
    }

    if (/fixtures\/second-review/i.test(line)) {
      continue;
    }

    if (/THREE_REAL_MODE_PROOF_RUNS/i.test(line)) {
      continue;
    }

    if (/GENERIC_AI_BAKEOFF_PROTOCOL/i.test(line)) {
      continue;
    }

    if (/PRODUCT_LEARNING/i.test(line)) {
      continue;
    }

    if (/API_CONTRACTS/i.test(line)) {
      continue;
    }

    if (/CORE_PILOT\.md/i.test(line)) {
      continue;
    }

    if (/PRODUCT_PACKAGING/i.test(line)) {
      continue;
    }

    if (/collect-first-pilot-proof/i.test(line)) {
      continue;
    }

    if (/^-\s+\[[xX ]\]\s+/i.test(trimmedStart)) {
      result.push(trimmedStart.replace(/^-\s+\[[xX ]\]\s+/, "- "));
      continue;
    }

    if (/\.\/scripts\//i.test(line)) {
      continue;
    }

    if (/second-review-habit-loop-validation/i.test(line)) {
      continue;
    }

    result.push(line);
  }

  if (inFence) {
    flushFenceBuffer();
  }

  return result
    .join("\n")
    .replace(/\s*\(TB-\d+\)/gi, "")
    .replace(/\bTB-\d+\b/gi, "")
    .replace(/\]\(\/help\/core-pilot\)/gi, "](/help/first-architecture-review)")
    .replace(/`?CORE_PILOT\.md`?/gi, "Your first architecture review")
    .replace(/`?API_CONTRACTS\.md`?/gi, "API contracts reference")
    .replace(/`?PRODUCT_LEARNING\.md`?/gi, "product learning analytics")
    .replace(/`?PRODUCT_PACKAGING\.md`?/gi, "product packaging guide")
    .replace(/`?PILOT_ROI_MODEL\.md`?/gi, "pilot ROI methodology")
    .replace(/`?DEFAULT_POLICY_PACKS_V1\.md`?/gi, "default policy packs")
    .replace(/`?PILOT_SUCCESS_SCORECARD\.md`?/gi, "pilot success scorecard")
    .replace(/`?docs\/go-to-market\/[^`\s)]+`?/gi, "go-to-market documentation")
    .replace(/docs\/go-to-market\/[^\s)]+/gi, "go-to-market documentation")
    .replace(/`?docs\/library\/[^`\s)]+`?/gi, "product documentation")
    .replace(/docs\/library\/[^\s)]+/gi, "product documentation")
    .replace(/`?docs\/runbooks\/[^`\s)]+`?/gi, "operations runbook")
    .replace(/docs\/runbooks\/[^\s)]+/gi, "operations runbook")
    .replace(/\n{3,}/g, "\n\n");
}

/** H2 sections omitted from in-app accelerator chooser help (contributor indexes / library dumps). */
const ACCELERATOR_CHOOSER_OMITTED_SECTION_PREFIXES = ["policy packs", "canonical references"] as const;

/**
 * TB-1606 / TB-1604 — removes contributor intro prose and markdown table; specialty view owns the chooser grid.
 */
export function stripAcceleratorChooserIntroAndTable(markdown: string): string {
  const lines = markdown.split("\n");
  const result: string[] = [];
  let inTable = false;
  let pastChooserBody = false;

  for (const line of lines) {
    if (line.startsWith("### How to start") || line.startsWith("**Out of scope")) {
      pastChooserBody = true;
      inTable = false;
    }

    // GTM/V1.1 roadmap caveats stay in DEMO_QUICKSTART — not in-app buyer help.
    if (line.startsWith("**Out of scope")) {
      continue;
    }

    if (!pastChooserBody) {
      if (line.startsWith("## ") && !line.startsWith("###")) {
        continue;
      }

      if (/Former standalone body/i.test(line)) {
        continue;
      }

      if (/Path-stable alias/i.test(line)) {
        continue;
      }

      if (/CI pack-tree twin/i.test(line)) {
        continue;
      }

      if (/^\*\*Last reviewed:\*\*/i.test(line)) {
        continue;
      }

      if (/ACCELERATOR_CHOOSER/i.test(line)) {
        continue;
      }

      if (/templates\/starter-proof-packs/i.test(line)) {
        continue;
      }

      if (/no new templates/i.test(line)) {
        continue;
      }

      if (line.trim().length === 0) {
        if (!inTable) {
          continue;
        }

        inTable = false;
        continue;
      }

      if (line.trimStart().startsWith("|")) {
        inTable = true;
        continue;
      }

      if (inTable) {
        continue;
      }

      continue;
    }

    if (line.trimStart().startsWith("|")) {
      inTable = true;
      continue;
    }

    if (inTable && line.trim().length === 0) {
      inTable = false;
      continue;
    }

    if (inTable) {
      continue;
    }

    if (line.startsWith("### How to start in the architect workspace")) {
      continue;
    }

    result.push(line);
  }

  return result.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * TB-1606 — drops policy-pack index and canonical library sections from accelerator chooser help.
 */
export function stripAcceleratorChooserContributorSections(markdown: string): string {
  return stripMarkdownSectionsByTitlePrefix(markdown, ACCELERATOR_CHOOSER_OMITTED_SECTION_PREFIXES, {
    headingLevels: [2, 3],
    // Buyer help must not surface GTM deferred-scope / V1.1 roadmap inventory.
    dropLinesStartingWith: ["**Out of scope"],
    keepLinesContaining: ["/help/first-architecture-review"],
  });
}

/**
 * TB-1606 — removes templates-tree paths, policy-pack indexes, walkthrough `.md`, and TB IDs
 * from in-app accelerator chooser presentation.
 */
export function stripAcceleratorChooserContributorLeakage(markdown: string): string {
  let inFence = false;

  const withoutSensitiveRows = markdown
    .split("\n")
    .filter((line) => {
      const trimmedStart = line.trimStart();

      if (trimmedStart.startsWith("```")) {
        inFence = !inFence;
        return true;
      }

      if (inFence) {
        return true;
      }

      if (/POLICY_PACK_/i.test(line)) {
        return false;
      }

      if (/DEFAULT_POLICY_PACKS_V1/i.test(line)) {
        return false;
      }

      if (/STARTER_PROOF_PACK_CHOOSER/i.test(line)) {
        return false;
      }

      if (/walkthroughs\//i.test(line)) {
        return false;
      }

      if (/GOLDEN_ACCELERATOR_WALKTHROUGH/i.test(line)) {
        return false;
      }

      return true;
    })
    .join("\n");

  return withoutSensitiveRows
    .replace(/\s*\(TB-\d+\)/gi, "")
    .replace(/\bTB-\d+\b/gi, "")
    .replace(/`?templates\/starter-proof-packs\/?`?/gi, "in-product accelerator packs")
    .replace(/templates\/starter-proof-packs\/?/gi, "in-product accelerator packs")
    .replace(/`?POLICY_PACK_[A-Z0-9_]+\.md`?/gi, "policy pack documentation")
    .replace(/POLICY_PACK_[A-Z0-9_]+\.md/gi, "policy pack documentation")
    .replace(/`?DEFAULT_POLICY_PACKS_V1\.md`?/gi, "default policy packs")
    .replace(/DEFAULT_POLICY_PACKS_V1\.md/gi, "default policy packs")
    .replace(/`?STARTER_PROOF_PACK_CHOOSER\.md`?/gi, "accelerator pack chooser")
    .replace(/STARTER_PROOF_PACK_CHOOSER\.md/gi, "accelerator pack chooser")
    .replace(/`?walkthroughs\/[^`\s)]+`?/gi, "product walkthrough")
    .replace(/walkthroughs\/[^\s)]+/gi, "product walkthrough")
    .replace(/`?starter-pack\.json`?/gi, "pack manifest")
    .replace(/starter-pack\.json/gi, "pack manifest")
    .replace(/`?ACCELERATOR_CHOOSER\.md`?/gi, "accelerator pack chooser")
    .replace(/ACCELERATOR_CHOOSER\.md/gi, "accelerator pack chooser")
    .replace(/from the pack folder/gi, "when starting the review")
    .replace(/in the pack folder/gi, "with the review")
    .replace(/\n{3,}/g, "\n\n");
}

/**
 * TB-1621 — removes connector smoke repo paths and administrator smoke-validation disclosures
 * from in-app Azure Boards integration help.
 */
export function stripAzureBoardsContributorLeakage(markdown: string): string {
  const lines = markdown.split("\n");
  const result: string[] = [];
  let inFence = false;
  let detailsBuffer: string[] | null = null;

  const flushDetailsBuffer = (): void => {
    if (detailsBuffer === null) {
      return;
    }

    const block = detailsBuffer.join("\n");
    detailsBuffer = null;

    if (
      /CONNECTOR_SMOKE_/i.test(block) ||
      /docs\/integrations\/smoke/i.test(block) ||
      /smoke validation/i.test(block)
    ) {
      return;
    }

    for (const bufferedLine of block.split("\n")) {
      result.push(bufferedLine);
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const trimmedStart = line.trimStart();

    if (trimmedStart.startsWith("```")) {
      inFence = !inFence;
      result.push(line);
      continue;
    }

    if (inFence) {
      result.push(line);
      continue;
    }

    if (/^<details\b/i.test(trimmed)) {
      detailsBuffer = [line];
      continue;
    }

    if (detailsBuffer !== null) {
      detailsBuffer.push(line);

      if (/^<\/details>/i.test(trimmed)) {
        flushDetailsBuffer();
      }

      continue;
    }

    if (/docs\/integrations\/smoke/i.test(line)) {
      continue;
    }

    if (/CONNECTOR_SMOKE_/i.test(line)) {
      continue;
    }

    result.push(line);
  }

  flushDetailsBuffer();

  return result
    .join("\n")
    .replace(/`?docs\/integrations\/smoke\/[^`\s)]+`?/gi, "connector validation runbook")
    .replace(/docs\/integrations\/smoke\/[^\s)]+/gi, "connector validation runbook")
    .replace(/\n{3,}/g, "\n\n");
}

/**
 * TB-1632 — removes contributor repo-tree framing from in-app CAIQ/SIG questionnaire help.
 */
export function stripCaiqSigContributorLeakage(markdown: string): string {
  const substituted = markdown
    .replace(/\|\s*Response \(summary\)\s*\|/gi, "| Response |")
    .replace(/\|\s*Evidence in repo\s*\|/gi, "| Evidence |")
    .replace(/Evidence in repo/gi, "Evidence")
    .replace(/`?\.github\/[^`\s)]+`?/gi, "automated security testing in CI")
    .replace(/\.github\/[^\s)`]+/gi, "automated security testing in CI")
    .replace(/`?infra\/[^`\s)]*`?/gi, "hosted infrastructure")
    .replace(/\binfra\//gi, "hosted infrastructure ")
    .replace(/`?SECURITY\.md`?/gi, "security documentation")
    .replace(/contributor-reference\/SECURITY\.md/gi, "security documentation")
    .replace(/`?PENDING_QUESTIONS\.md`?/gi, "owner diligence notes")
    .replace(/PENDING_QUESTIONS\.md/gi, "owner diligence notes")
    .replace(/`?pen-test-summaries\/[^`\s)]+`?/gi, "penetration test program documentation")
    .replace(/pen-test-summaries\/[^\s`)]+/gi, "penetration test program documentation")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();

  return dedupeConsecutiveCaiqSigPhrase(substituted, "automated security testing in CI");
}

function dedupeConsecutiveCaiqSigPhrase(text: string, phrase: string): string {
  const escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(${escapedPhrase})(?:\\s*,?\\s*\\1)+`, "gi");

  return text.replace(pattern, "$1");
}

const SUBPROCESSORS_OMITTED_SECTION_PREFIXES = ["related documents"] as const;

/**
 * TB-1752 — drops contributor Related documents section from subprocessors help.
 */
export function stripSubprocessorsContributorSections(markdown: string): string {
  return stripMarkdownSectionsByTitlePrefix(markdown, SUBPROCESSORS_OMITTED_SECTION_PREFIXES);
}

function isSubprocessorsContributorLeakageLine(line: string): boolean {
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
export function stripSubprocessorsContributorLeakage(markdown: string): string {
  const sectionStripped = stripSubprocessorsContributorSections(markdown);
  const lines = sectionStripped.split("\n");
  const result: string[] = [];

  for (const line of lines) {
    if (
      /^ArchLucid uses the following \*\*subprocessors\*\* to deliver the hosted service\./i.test(line.trim())
    ) {
      result.push(
        "ArchLucid uses the following **subprocessors** to deliver the hosted service. The list reflects the **Azure-first** hosted service architecture. For trust posture and data handling, see [Security and trust](/help/security-trust).",
      );
      continue;
    }

    if (/^Production deployments are \*\*Azure-region scoped\*\*/i.test(line.trim())) {
      result.push(
        "Production deployments are **Azure-region scoped**; the **primary region** is selected when the hosted service is provisioned for your subscription or order.",
      );
      continue;
    }

    if (/^\*\*Roadmap:\*\* Document \*\*multi-region\*\*/i.test(line.trim())) {
      result.push(
        "**Roadmap:** Document **multi-region** active/active or failover when offered (not yet published as a standard hosted offering).",
      );
      continue;
    }

    if (/^\*\*Non-Microsoft:\*\*/i.test(line.trim())) {
      result.push(
        "**Non-Microsoft:** Core hosted ArchLucid API functionality runs on Microsoft Azure services listed above. Additional third-party subprocessors (for example observability, CRM, or support tools) are listed here when they process customer content. Contact your account team during procurement if you need confirmation of the current register.",
      );
      continue;
    }

    if (/^Until a single public \*\*primary production region\*\*/i.test(line.trim())) {
      result.push(
        "For **hosted ArchLucid SaaS**, primary data-processing regions are **confirmed in your order or security diligence pack** unless a single public primary region is published on [Security and trust](/help/security-trust). Customer-managed deployments follow the Azure region selected at provisioning.",
      );
      continue;
    }

    if (isSubprocessorsContributorLeakageLine(line)) {
      continue;
    }

    if (/^\| \*\*Microsoft Corporation\*\* \| \*\*Azure Container Apps\*\*/i.test(line)) {
      result.push(
        "| **Microsoft Corporation** | **Azure Container Apps** (or equivalent compute), **Azure SQL**, **Azure Blob Storage**, **Azure Key Vault**, optional **Azure Service Bus**, **Azure Cache for Redis** (or compatible), **Azure Front Door**, optional **Azure API Management**, monitoring integrations | Customer architecture content, run metadata, manifests, findings, audit events, blobs (including optional agent traces), secrets by reference | **Primary Azure region(s)** chosen at deployment time (see **Data residency** below) | Host application, store and encrypt data at rest, edge routing, optional queue/cache |",
      );
      continue;
    }

    if (/see \[DPA_TEMPLATE\.md\]/i.test(line)) {
      result.push(
        "- **Material change:** Updated DPA schedule or subprocessors exhibit available on request; see [DPA template](/help/dpa-template).",
      );
      continue;
    }

    result.push(line);
  }

  return alignSubprocessorsResidencyHonesty(
    result
      .join("\n")
      .replace(/`?DPA_TEMPLATE\.md`?/gi, "[DPA template](/help/dpa-template)")
      .replace(/DPA_TEMPLATE\.md/gi, "/help/dpa-template")
      .replace(/`?START_HERE\.md`?/gi, "product documentation hub")
      .replace(/START_HERE\.md/gi, "product documentation hub")
      .replace(/`?infra\/[^`\s)]*`?/gi, "hosted infrastructure")
      .replace(/\binfra\//gi, "hosted infrastructure ")
      .replace(/`?terraform-azure-variables\.md`?/gi, "infrastructure configuration documentation")
      .replace(/terraform-azure-variables\.md/gi, "infrastructure configuration documentation")
      .replace(/`?GEO_FAILOVER_DRILL\.md`?/gi, "operational drill documentation")
      .replace(/GEO_FAILOVER_DRILL\.md/gi, "operational drill documentation")
      .replace(/`?CUSTOMER_TRUST_AND_ACCESS\.md`?/gi, "[Security and trust](/help/security-trust)")
      .replace(/CUSTOMER_TRUST_AND_ACCESS\.md/gi, "/help/security-trust")
      .replace(/`?SYSTEM_THREAT_MODEL\.md`?/gi, "security documentation")
      .replace(/SYSTEM_THREAT_MODEL\.md/gi, "security documentation")
      .replace(/`?trust-center\.md`?/gi, "[Security and trust](/help/security-trust)")
      .replace(/trust-center\.md/gi, "/help/security-trust")
      .replace(/\n{3,}/g, "\n\n")
      .trimEnd(),
  );
}

/**
 * TB-1755 — subprocessors help: buyer-safe residency posture; no contributor to-do voice.
 */
export function alignSubprocessorsResidencyHonesty(markdown: string): string {
  return markdown
    .replace(
      /\*\*Non-Microsoft:\*\* The product codebase does not require[^\n]+/gi,
      "**Non-Microsoft:** Core hosted ArchLucid API functionality runs on Microsoft Azure services listed above. Additional third-party subprocessors (for example observability, CRM, or support tools) are listed here when they process customer content. Contact your account team during procurement if you need confirmation of the current register.",
    )
    .replace(
      /Until a single public \*\*primary production region\*\* is published for the ArchLucid SaaS offering, treat the region as \*\*["“]per deployment \/ subscription — confirm in order form or security pack\.["”]\*\*/gi,
      "For **hosted ArchLucid SaaS**, primary data-processing regions are **confirmed in your order or security diligence pack** unless a single public primary region is published on [Security and trust](/help/security-trust). Customer-managed deployments follow the Azure region selected at provisioning.",
    )
    .replace(/update this table before production use/gi, "confirm the current subprocessor register during procurement")
    .replace(/product codebase/gi, "core hosted service")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
}

const TENANT_ISOLATION_THREE_LAYERS_BUYER_BODY = [
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
export function stripTenantIsolationContributorLeakage(markdown: string): string {
  const hasTenantIsolationStub =
    /BUYER_SECURITY_PROCUREMENT_PACKET|generate_tenant_isolation_verification_pack|MULTI_TENANT_RLS\.md|0037-tenant-isolation/i.test(
      markdown,
    );

  if (!hasTenantIsolationStub) {
    return markdown;
  }

  let result = markdown
    .replace(/\*\*Canonical buyer overview:\*\*[^\n]*\n?/gi, "")
    .replace(/\*\*Related short handout:\*\*[^\n]*\n?/gi, "")
    .replace(/# ArchLucid — Tenant isolation \(buyer overview\)\s*\n+/gi, "")
    .replace(/\*\*Last reviewed:\*\*[^\n]*\n?/gi, "")
    .replace(/`?BUYER_SECURITY_PROCUREMENT_PACKET\.md[^`\s)]*`?/gi, "[Procurement FAQ](/help/procurement)")
    .replace(/BUYER_SECURITY_PROCUREMENT_PACKET\.md[^\s)`]*/gi, "/help/procurement")
    .replace(/`?SECURITY\.md`?/gi, "security documentation")
    .replace(/contributor-reference\/SECURITY\.md/gi, "security documentation")
    .replace(/`?MULTI_TENANT_RLS\.md`?/gi, "tenant scope enforcement documentation")
    .replace(/MULTI_TENANT_RLS\.md/gi, "tenant scope enforcement documentation")
    .replace(/`?TENANT_ISOLATION_DEFENSE_IN_DEPTH\.md`?/gi, "tenant isolation architecture documentation")
    .replace(/`?\.\.\/architecture\/adrs\/0037[^`\s)]*`?/gi, "tenant isolation architecture decision")
    .replace(/ADR 0037/gi, "tenant isolation architecture decision")
    .replace(/`?scripts\/generate_tenant_isolation_verification_pack\.py`?/gi, "tenant isolation verification materials")
    .replace(/generate_tenant_isolation_verification_pack\.py/gi, "tenant isolation verification materials")
    .replace(/`?scripts\/`/gi, "internal tooling ")
    .replace(/historical procurement-pack path stable[^\n]*/gi, "")
    .replace(/buyer ZIP checklists and CI allowlists[^\n]*/gi, "");

  result = result.replace(
    /## Three layers \{#three-layers\}[\s\S]*?(?=\n## |\n---\n|$)/i,
    `## Three layers {#three-layers}\n\n${TENANT_ISOLATION_THREE_LAYERS_BUYER_BODY}`,
  );

  result = result.replace(
    /Three-layer isolation \(identity, application, database-per-tenant catalogs\)[^\n]*/gi,
    TENANT_ISOLATION_THREE_LAYERS_BUYER_BODY,
  );

  return result.replace(/\n{3,}/g, "\n\n").trimEnd();
}

/**
 * TB-1677 — DPA template help: strip contributor .md / pack-path leakage; in-app trust links.
 */
export function stripDpaTemplateContributorLeakage(markdown: string): string {
  return markdown
    .replace(/> \*\*Spine doc:\*\*[^\n]*\n?/gi, "")
    .replace(/`?START_HERE\.md`?/gi, "product documentation hub")
    .replace(/START_HERE\.md/gi, "product documentation hub")
    .replace(/`?SECURITY\.md`?/gi, "security documentation")
    .replace(/contributor-reference\/SECURITY\.md/gi, "security documentation")
    .replace(/`?\.\.\/security\/PII_RETENTION_CONVERSATIONS\.md`?/gi, "conversation retention documentation")
    .replace(/PII_RETENTION_CONVERSATIONS\.md/gi, "conversation retention documentation")
    .replace(/`?BUYER_SECURITY_PROCUREMENT_PACKET\.md[^`\s)]*`?/gi, "[Procurement FAQ](/help/procurement)")
    .replace(/BUYER_SECURITY_PROCUREMENT_PACKET\.md[^\s)`]*/gi, "/help/procurement")
    .replace(/\[trust-center\.md\]\(trust-center\.md\)/gi, "[Security and trust](/help/security-trust)")
    .replace(/trust-center\.md/gi, "/help/security-trust")
    .replace(/`?SUBPROCESSORS\.md`?/gi, "[Subprocessors](/help/subprocessors)")
    .replace(/SUBPROCESSORS\.md/gi, "/help/subprocessors")
    .replace(/`?INCIDENT_COMMUNICATIONS_POLICY\.md`?/gi, "incident communications policy")
    .replace(/INCIDENT_COMMUNICATIONS_POLICY\.md/gi, "incident communications policy")
    .replace(/`?ASSURANCE_STATUS_CANONICAL\.md[^`\s)]*`?/gi, "assurance status documentation")
    .replace(/ASSURANCE_STATUS_CANONICAL\.md[^\s)`]*/gi, "assurance status documentation")
    .replace(/`?docs\/go-to-market\/CROSS_TENANT_DATA_PROCESSING_ADDENDUM\.md`?/gi, "cross-tenant processing addendum")
    .replace(/CROSS_TENANT_DATA_PROCESSING_ADDENDUM\.md/gi, "cross-tenant processing addendum")
    .replace(/`?\.\.\/architecture\/adrs\/0031[^`\s)]*`?/gi, "cross-tenant pattern library architecture decision")
    .replace(/ADR 0031/gi, "cross-tenant pattern library architecture decision")
    // TB-1680 — buyer wording: architecture reviews, not contributor "runs" jargon.
    .replace(/architecture runs/gi, "architecture reviews")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
}

/**
 * TB-1688 — executive-summary help (FAQ source): strip contributor FAQ / eng-path leakage.
 */
export function stripExecutiveSummaryContributorLeakage(markdown: string): string {
  let result = markdown
    .replace(
      /\*\*How do I try it locally\?\*\*[\s\S]*?(?=\n\n\*\*|\n## |\n---\n|$)/i,
      [
        "**How do I evaluate ArchLucid?**",
        "Start a guided pilot or first architecture review — see [Your first architecture review](/help/first-architecture-review).",
      ].join("\n"),
    )
    .replace(/`?day-one-developer\.md`?/gi, "[Getting started](/help/first-architecture-review)")
    .replace(/day-one-developer\.md/gi, "/help/first-architecture-review")
    .replace(/\*\*ArchLucid\.Api\*\*/g, "the hosted service")
    .replace(/`?archlucid-ui`?/gi, "the web application")
    .replace(/`?FIRST_REAL_VALUE\.md`?/gi, "deployment configuration documentation")
    .replace(/FIRST_REAL_VALUE\.md/gi, "deployment configuration documentation")
    .replace(/`?V1_SCOPE\.md`?/gi, "[Procurement FAQ](/help/procurement)")
    .replace(/V1_SCOPE\.md/gi, "/help/procurement")
    .replace(/`?SECURITY\.md`?/gi, "[Security and trust](/help/security-trust)")
    .replace(/contributor-reference\/SECURITY\.md/gi, "/help/security-trust")
    .replace(/`?MULTI_TENANT_RLS\.md`?/gi, "[Data handling and tenant isolation](/help/data-handling)")
    .replace(/MULTI_TENANT_RLS\.md/gi, "/help/data-handling")
    .replace(/`?ArchLucid\.Contracts`?/gi, "versioned API contracts")
    .replace(/ArchLucid\.Contracts/gi, "versioned API contracts")
    .replace(/\(\*\*TB-\d+\*\*\)/gi, "")
    .replace(/\*\*TB-\d+\*\*/gi, "enterprise OAuth upgrades")
    .replace(/\bTB-\d+\b/gi, "enterprise integration upgrades")
    .replace(/`?INTEGRATION_CATALOG\.md`?/gi, "[Integrations hub](/integrations)")
    .replace(/INTEGRATION_CATALOG\.md/gi, "/integrations")
    .replace(/`?PRICING_PHILOSOPHY\.md`?/gi, "[Procurement FAQ](/help/procurement)")
    .replace(/PRICING_PHILOSOPHY\.md/gi, "/help/procurement")
    .replace(/`?CONCEPT_VOCABULARY\.md`?/gi, "product terminology guide")
    .replace(/CONCEPT_VOCABULARY\.md/gi, "product terminology guide")
    .replace(/via CLI \(see[^)]+\)/gi, "from the product (see [Troubleshooting](/help/troubleshooting))")
    .replace(/`GET \/version`/gi, "version information")
    .replace(/`X-Correlation-ID`/gi, "correlation identifier")
    .replace(/row-level security/gi, "tenant isolation controls");

  result = result.replace(
    /\*\*Where does tenant data live\?\*\*[\s\S]*?(?=\n\n\*\*|\n## |\n---\n|$)/i,
    [
      "**Where does tenant data live?**",
      "Hosted deployments use Azure-native storage and SQL with dedicated tenant catalogs. See [Data handling and tenant isolation](/help/data-handling) and [Security and trust](/help/security-trust).",
    ].join("\n"),
  );

  return result.replace(/\n{3,}/g, "\n\n").trimEnd();
}

const FIRST_VALUE_20_MINUTES_SECTION_HEADING_RE =
  /^## First value in 20 minutes \(time-boxed\)(?:\s*\{#[^}]+\})?\s*$/im;

/**
 * TB-1693 — keep only the first 20-minute time-box section from the full operator runbook.
 */
function extractFirstValue20MinutesSection(markdown: string): string {
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
const FIRST_REVIEW_EVIDENCE_OMITTED_SECTION_PREFIXES = [
  "optional tier 2",
  "repeat review",
  "related",
] as const;

/**
 * Drops Tier-2 WIF, PowerShell proof, and eng Related sections from the folded first-review checklist section.
 */
export function stripFirstReviewEvidenceChecklistContributorSections(markdown: string): string {
  return stripMarkdownSectionsByTitlePrefix(markdown, FIRST_REVIEW_EVIDENCE_OMITTED_SECTION_PREFIXES);
}

/**
 * First-review help: soften API success signals and map eng .md hrefs to in-app help.
 */
export function stripFirstReviewEvidenceChecklistContributorLeakage(markdown: string): string {
  return markdown
    .replace(/`GET \/health\/ready`/gi, "API readiness check")
    .replace(/GET \/health\/ready/gi, "API readiness check")
    .replace(/`POST \/v1\/azure-extractor\/upload`/gi, "extractor ZIP upload")
    .replace(/POST \/v1\/azure-extractor\/upload/gi, "extractor ZIP upload")
    .replace(/`?\/version`?/gi, "version endpoint")
    .replace(/`?X-Correlation-ID`?/gi, "correlation id")
    .replace(/\[([^\]]*)\]\(\.\.\/library\/CONFIGURATION_REFERENCE\.md\)/gi, "[Configuration reference](/help/configuration-reference)")
    .replace(/\[([^\]]*)\]\(\.\.\/library\/contributor-reference\/SECURITY\.md\)/gi, "[Security and trust](/help/security-trust)")
    .replace(/\[([^\]]*)\]\(FIRST_PILOT_OPERATOR_PATH\.md\)/gi, "[Troubleshooting](/help/troubleshooting)")
    .replace(/\[([^\]]*)\]\(\.\.\/library\/customer-facing\/PILOT_GUIDE\.md\)/gi, "[Your first architecture review](/help/first-architecture-review)")
    .replace(/\[([^\]]*)\]\(\.\.\/library\/AZURE_EXTRACTOR\.md[^)]*\)/gi, "[Connect Azure securely](/help/cloud-connections/azure)")
    .replace(
      /\[([^\]]*)\]\(\.\.\/library\/CANONICAL_FIRST_RUN_PATH\.md[^)]*\)/gi,
      "[Your first architecture review](/help/first-architecture-review)",
    )
    .replace(
      /\[([^\]]*)\]\(\.\.\/library\/customer-facing\/WORKSPACE_NAVIGATION_GUIDE\.md\)/gi,
      "[Workspace navigation profile](/help/pilot-guide)",
    )
    .replace(/\[([^\]]*)\]\(\.\.\/runbooks\/TROUBLESHOOTING\.md\)/gi, "[Troubleshooting](/help/troubleshooting)")
    .replace(/\[([^\]]*)\]\(TROUBLESHOOTING\.md\)/gi, "[Troubleshooting](/help/troubleshooting)")
    .replace(/\[([^\]]*)\]\(\.\.\/library\/V1_SCOPE\.md[^)]*\)/gi, "product scope")
    .replace(/\[([^\]]*)\]\(\.\.\/library\/REPEAT_REVIEW_LOOP\.md\)/gi, "[Repeat-review loop](/help/repeat-review-loop)")
    .replace(/\[([^\]]*)\]\([^)]*contributor-reference\/[^)]+\)/gi, "$1")
    .replace(/\[([^\]]*)\]\([^)]*(?:runbooks|library|deploy)\/[^)]+\)/gi, "$1")
    .replace(/\[([^\]]*)\]\([^)]+\.md[^)]*\)/gi, "$1")
    .replace(/`?CONFIGURATION_REFERENCE\.md`?/gi, "configuration reference")
    .replace(/`?SECURITY\.md`?/gi, "security documentation")
    .replace(/`?FIRST_PILOT_OPERATOR_PATH\.md`?/gi, "first-pilot workspace guidance")
    .replace(/`?PILOT_GUIDE\.md`?/gi, "pilot guide")
    .replace(/`?AZURE_EXTRACTOR\.md`?/gi, "Azure extractor guidance")
    .replace(/`?CANONICAL_FIRST_RUN_PATH\.md`?/gi, "first architecture review walkthrough")
    .replace(/`?WORKSPACE_NAVIGATION_GUIDE\.md`?/gi, "workspace navigation guide")
    .replace(/`?TROUBLESHOOTING\.md`?/gi, "troubleshooting")
    .replace(/`?V1_SCOPE\.md`?/gi, "product scope")
    .replace(/`?PILOT_RESCUE_PLAYBOOK\.md`?/gi, "troubleshooting guide")
    .replace(/`?LIVE_E2E_HAPPY_PATH\.md`?/gi, "live happy-path guidance")
    .replace(/`?OPERATOR_PILOT_STICKINESS_CHECKLIST\.md`?/gi, "stickiness checklist")
    .replace(/`?REPEAT_REVIEW_LOOP\.md`?/gi, "repeat-review loop")
    .replace(/`?scripts\/[^`\s)]+`?/gi, "admin automation script")
    .replace(/\.\\scripts\\[^\s)`]*/gi, "admin automation script")
    .replace(/\.\/scripts\/[^\s)`]*/gi, "admin automation script")
    .replace(/collect-first-pilot-proof\.ps1/gi, "admin automation script")
    .replace(/deploy\/customer-templates\/[^\s)`]*/gi, "customer WIF templates")
    .replace(/python scripts\/[^\s)`]*/gi, "admin automation script")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
}

/** H2 sections omitted from in-app CLI usage help (vendor-internal / GTM). */
const CLI_USAGE_OMITTED_SECTION_PREFIXES = [
  "proof-packet gtm guardrails",
  "archlucid marketplace preflight",
] as const;

/**
 * HCX — drops GTM guardrails and marketplace preflight sections from `/help/cli-usage`.
 */
export function stripCliUsageContributorSections(markdown: string): string {
  return stripMarkdownSectionsByTitlePrefix(markdown, CLI_USAGE_OMITTED_SECTION_PREFIXES);
}

/**
 * HCX — vendor-internal leakage strip for `/help/cli-usage` (staging hosts, GTM paths, eng DB names).
 */
export function stripCliUsageContributorLeakage(markdown: string): string {
  return stripCliUsageContributorSections(markdown)
    .replace(/https:\/\/staging\.archlucid\.net/gi, "https://<your-archlucid-host>")
    .replace(/\[([^\]]*)\]\(\.\.\/runbooks\/TROUBLESHOOTING\.md[^)]*\)/gi, "[Developer troubleshooting](/help/developer-troubleshooting)")
    .replace(/\[([^\]]*)\]\(\.\.\/library\/TROUBLESHOOTING\.md[^)]*\)/gi, "[Developer troubleshooting](/help/developer-troubleshooting)")
    .replace(/\[([^\]]*)\]\(TROUBLESHOOTING\.md[^)]*\)/gi, "[Developer troubleshooting](/help/developer-troubleshooting)")
    .replace(/\[([^\]]*)\]\(\.\.\/runbooks\/TRIAL_FUNNEL_END_TO_END\.md[^)]*\)/gi, "[Developer troubleshooting](/help/developer-troubleshooting)")
    .replace(
      /\[([^\]]*)\]\(\.\.\/go-to-market\/ROI_MODEL\.md[^)]*\)/gi,
      "[Pilot ROI measurement](/help/executive-summary#pilot-roi-measurement)",
    )
    .replace(
      /\[([^\]]*)\]\(\.\.\/go-to-market\/SAMPLE_AGGREGATE_ROI_BULLETIN_SYNTHETIC\.md[^)]*\)/gi,
      "[Pilot ROI measurement](/help/executive-summary#pilot-roi-measurement)",
    )
    .replace(/\[([^\]]*)\]\(\.\.\/go-to-market\/PRICING_PHILOSOPHY\.md[^)]*\)/gi, "[Procurement](/help/procurement)")
    .replace(/\[([^\]]*)\]\(\.\.\/go-to-market\/AZURE_MARKETPLACE_SAAS_OFFER\.md[^)]*\)/gi, "")
    .replace(/\[([^\]]*)\]\(\.\.\/go-to-market\/[^)]+\)/gi, "")
    .replace(/`dbo\.AuditEvents`/gi, "audit trail")
    .replace(/dbo\.AuditEvents/gi, "audit trail")
    .replace(/without owner approval/gi, "without lowering the configured gate")
    .replace(/`--staging`/gi, "")
    .replace(/\s*\[--staging\]/gi, "")
    .replace(/\(--staging[^)]*\)/gi, "")
    .replace(/\s+--staging\b/gi, "")
    .replace(/C:\\ArchLucid[^\s)`]*/gi, "")
    .replace(/Partner Center/gi, "")
    .replace(/\bpayout\b/gi, "")
    .replace(/\btax\b/gi, "")
    .replace(/forbidden sales promises/gi, "")
    .replace(/Full checklist:\s*Developer [Tt]roubleshooting(?:\s*\([^)]*\))?\.?/g, "")
    .replace(/Full checklist:\s*Troubleshooting(?:\s*\([^)]*\))?\.?/g, "")
    .replace(/see \[[^\]]+\]\([^)]+\) and \[([^\]]+)\]\(\)/g, "see [$1](/help/developer-troubleshooting)")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
}

/**
 * HDX — map eng-library hrefs to in-app Admin/customer help where safe; keep CLI/env triage body.
 */
export function stripDeveloperTroubleshootingContributorLeakage(markdown: string): string {
  return markdown
    .replace(/\[([^\]]*)\]\(\.\.\/library\/CONFIGURATION_REFERENCE\.md\)/gi, "[Configuration reference](/help/configuration-reference)")
    .replace(/\[([^\]]*)\]\(CONFIGURATION_REFERENCE\.md\)/gi, "[Configuration reference](/help/configuration-reference)")
    .replace(/\[([^\]]*)\]\(\.\.\/library\/CLI_USAGE\.md\)/gi, "[CLI usage](/help/cli-usage)")
    .replace(/\[([^\]]*)\]\(CLI_USAGE\.md\)/gi, "[CLI usage](/help/cli-usage)")
    .replace(/\[([^\]]*)\]\([^)]*contributor-reference\/[^)]+\)/gi, "$1")
    .replace(/\[([^\]]*)\]\(\.\.\/architecture\/adrs\/[^)]+\)/gi, "$1")
    .replace(/\[([^\]]*)\]\([^)]*architecture\/adrs\/[^)]+\)/gi, "$1")
    .replace(/\[([^\]]*)\]\(\.\.\/library\/V1_SCOPE\.md[^)]*\)/gi, "product scope")
    .replace(/\[([^\]]*)\]\(V1_SCOPE\.md[^)]*\)/gi, "product scope")
    .replace(/\[([^\]]*)\]\(\.\.\/go-to-market\/[^)]+\)/gi, "$1")
    .replace(/\bTB-\d+\b/gi, "")
    .replace(/\s*\(TB-\d+\)/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
}

function stripFirstValue20ExtractedSectionHeading(markdown: string): string {
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

function replaceFirstValue20OutsideBacktickSpans(
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

function applyFirstValue20ProseLeakageReplacements(segment: string): string {
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

function applyFirstValue20CodeSpanLeakageReplacements(inner: string): string {
  return inner
    .replace(/dotnet run --project ArchLucid\.Cli -- /gi, "archlucid ")
    .replace(/ROLE_INDEX\.md/gi, "role-index")
    .replace(/TROUBLESHOOTING\.md/gi, "troubleshooting")
    .replace(/\.\/scripts\/[^\s)`]*/gi, "<admin-automation-script>")
    .replace(/scripts\/[^\s)`]+/gi, "<admin-automation-script>")
    .replace(/artifacts\/[^\s`|)]+/gi, "<output-folder>");
}

export function stripFirstValue20ContributorLeakage(markdown: string): string {
  const focused = extractFirstValue20MinutesSection(markdown);
  const withoutSectionHeading = stripFirstValue20ExtractedSectionHeading(focused);
  const withoutMojibake = withoutSectionHeading
    .replace(/Â§/g, "§")
    .replace(/Â/g, "")
    .replace(
      /For the full phased checklist, continue with §?\s*\*\*Phase A\*\* below\./gi,
      "Use this section when the platform is already wired — not the full phased first-pilot checklist.",
    )
    .replace(/continue with §?\s*\*\*Phase A\*\* below/gi, "use this time-boxed section");

  const sanitized = replaceFirstValue20OutsideBacktickSpans(
    withoutMojibake,
    applyFirstValue20ProseLeakageReplacements,
    applyFirstValue20CodeSpanLeakageReplacements,
  );

  return sanitized.replace(/\n{3,}/g, "\n\n").trimEnd();
}

/**
 * TB-1712 — path-chooser help: strip GTM/runbook .md and artifacts/ leakage; in-app trust links.
 */
/** H2 sections omitted from in-app pilot-feedback help (eng PRD / API theater). */
const PILOT_FEEDBACK_OMITTED_SECTION_PREFIXES = ["4.2 planning bridge", "6. related docs"] as const;

/**
 * TB-1717 — drops planning-bridge eng PRD from in-app pilot-feedback help.
 */
export function stripPilotFeedbackContributorSections(markdown: string): string {
  return stripMarkdownSectionsByTitlePrefix(markdown, PILOT_FEEDBACK_OMITTED_SECTION_PREFIXES);
}

function isPilotFeedbackContributorLeakageLine(line: string): boolean {
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
export function stripPilotFeedbackContributorLeakage(markdown: string): string {
  const sectionStripped = stripPilotFeedbackContributorSections(markdown);
  const lines = sectionStripped.split("\n");
  const result: string[] = [];
  let inFence = false;
  let fenceBuffer: string[] = [];
  let detailsBuffer: string[] | null = null;

  const flushFenceBuffer = (): void => {
    if (fenceBuffer.length === 0) {
      return;
    }

    const block = fenceBuffer.join("\n");
    fenceBuffer = [];

    if (/\/v1\/|product-learning|PlanningBridgePanel/i.test(block)) {
      return;
    }

    for (const bufferedLine of block.split("\n")) {
      result.push(bufferedLine);
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const trimmedStart = line.trimStart();

    if (trimmedStart.startsWith("```")) {
      if (inFence) {
        fenceBuffer.push(line);
        flushFenceBuffer();
        inFence = false;
        continue;
      }

      inFence = true;
      fenceBuffer = [line];
      continue;
    }

    if (inFence) {
      fenceBuffer.push(line);
      continue;
    }

    if (/^<details\b/i.test(trimmed)) {
      detailsBuffer = [line];
      continue;
    }

    if (detailsBuffer !== null) {
      detailsBuffer.push(line);

      if (/^<\/details>/i.test(trimmed)) {
        detailsBuffer = null;
      }

      continue;
    }

    if (/Rows are stored in \*\*`ProductLearningPilotSignals`/i.test(line)) {
      result.push(
        "- Signals are stored per **tenant**, **workspace**, and **project** — the same scope shown in your workspace shell.",
      );
      continue;
    }

    if (isPilotFeedbackContributorLeakageLine(line)) {
      continue;
    }

    if (/^\|\s*[-:| ]+\|\s*$/i.test(trimmed)) {
      continue;
    }

    if (/Sign in to the workspace UI \(local:/i.test(line)) {
      result.push(
        "1. Sign in to the workspace UI.",
      );
      continue;
    }

    result.push(line);
  }

  flushFenceBuffer();

  return result
    .join("\n")
    .replace(/`?ProductLearningPilotSignals`?/gi, "pilot feedback signals")
    .replace(/`ArchLucid:StorageProvider`/gi, "configured storage")
    .replace(/`Sql`/gi, "database")
    .replace(
      /- \*\*`POST \/v1\/learning\/planning\/materialize`\*\*[^.\n]*\./gi,
      "- Use the **Planning bridge** on **Pilot feedback** to materialize draft themes and plans from ranked opportunities.",
    )
    .replace(
      // Static pattern — avoid string→RegExp escape helpers that CodeQL flags as js/incomplete-sanitization.
      /- \*\*Operator\s+shell \(V1 GA\):\*\* \*\*`PlanningBridgePanel`\*\* on \*\*`\/(?:internal\/)?product-learning`\*\*[^\.\n]*\./gi,
      "- Open **Q&A & advisory** → **Pilot feedback**, then use the **Planning bridge** panel to create draft improvement themes and plans.",
    )
    .replace(/\*\*ExecuteAuthority\*\*/gi, "appropriate admin permission")
    .replace(
      /(## 4\.1[^\n]*\n\nWhen you want[^\n]*:\n\n)/i,
      "$1- Open **Q&A & advisory** → **Pilot feedback** (`/internal/product-learning`), then use the **Planning bridge** panel to materialize draft themes and plans from ranked opportunities.\n",
    )
    .replace(/\s*\(58R\)/gi, "")
    .replace(/\s*\(59R\)/gi, "")
    .replace(/\bin 58R\b/gi, "in pilot feedback")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
}

/** H2 sections omitted from in-app policy-pack-delta help (scripts, CI rehearsal, GTM index). */
const POLICY_PACK_DELTA_OMITTED_SECTION_PREFIXES = [
  "local automation",
  "policy-to-decision proof pilot",
  "related",
] as const;

/**
 * TB-1727 — drops script/CI/GTM appendix sections from in-app policy-pack-delta help.
 */
export function stripPolicyPackDeltaContributorSections(markdown: string): string {
  return stripMarkdownSectionsByTitlePrefix(markdown, POLICY_PACK_DELTA_OMITTED_SECTION_PREFIXES);
}

function isPolicyPackDeltaContributorLeakageLine(line: string): boolean {
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
export function stripPolicyPackDeltaContributorLeakage(markdown: string): string {
  const sectionStripped = stripPolicyPackDeltaContributorSections(markdown);
  const lines = sectionStripped.split("\n");
  const result: string[] = [];
  let inFence = false;
  let fenceBuffer: string[] = [];
  let fenceLanguage = "";
  let omitApiSubsection = false;

  const flushFenceBuffer = (): void => {
    if (fenceBuffer.length === 0) {
      return;
    }

    const block = fenceBuffer.join("\n");
    fenceBuffer = [];

    if (/^```http/i.test(block) || /\/v1\//i.test(block) || /demo-policy-pack-delta/i.test(block)) {
      return;
    }

    for (const bufferedLine of block.split("\n")) {
      result.push(bufferedLine);
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const trimmedStart = line.trimStart();

    if (/^### API\b/i.test(trimmed)) {
      omitApiSubsection = true;
      continue;
    }

    if (/^### /i.test(trimmed)) {
      omitApiSubsection = false;
    }

    if (omitApiSubsection) {
      continue;
    }

    if (trimmedStart.startsWith("```")) {
      if (inFence) {
        fenceBuffer.push(line);
        flushFenceBuffer();
        inFence = false;
        fenceLanguage = "";
        continue;
      }

      inFence = true;
      fenceLanguage = trimmedStart.slice(3).trim().toLowerCase();
      fenceBuffer = [line];

      if (fenceLanguage === "http" || fenceLanguage === "powershell") {
        fenceBuffer = [];
        inFence = true;
        continue;
      }

      continue;
    }

    if (inFence) {
      if (fenceLanguage === "http" || fenceLanguage === "powershell") {
        if (trimmedStart.startsWith("```")) {
          inFence = false;
          fenceLanguage = "";
        }

        continue;
      }

      fenceBuffer.push(line);
      continue;
    }

    if (isPolicyPackDeltaContributorLeakageLine(line)) {
      continue;
    }

    if (/^\| \*\*Committed run\*\*/i.test(line)) {
      result.push(
        "| **Committed run** | A finalized architecture review with a findings snapshot (demo workspace or your pilot run). |",
      );
      continue;
    }

    if (/^\| \*\*Scope headers\*\*/i.test(line)) {
      continue;
    }

    result.push(line);
  }

  flushFenceBuffer();

  return result
    .join("\n")
    .replace(/\b[a-f0-9]{32}\b/gi, "a-committed-review-run-id")
    .replace(/`eb81dd4972ad429e8d4e214f9934bfc0`/gi, "a committed review run id")
    .replace(/`?\{runId\}`?/gi, "the review run")
    .replace(/`?\{tenantId\}`?/gi, "your tenant")
    .replace(/`?\{workspaceId\}`?/gi, "your workspace")
    .replace(/`?\{projectId\}`?/gi, "your project")
    .replace(/`?\{token\}`?/gi, "your session")
    .replace(/`?\{policyPackId\}`?/gi, "the policy pack")
    .replace(/#governance-pre-commit-blocked/gi, "governance pre-commit block")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
}

/**
 * TB-1733 — prior-manifest help: strip host config keys; state default limit in operator language.
 */
export function stripPriorManifestRetrievalContributorLeakage(markdown: string): string {
  const lines = markdown.split("\n");
  const result: string[] = [];
  let detailsBuffer: string[] | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (/^<details\b/i.test(trimmed)) {
      detailsBuffer = [line];
      continue;
    }

    if (detailsBuffer !== null) {
      detailsBuffer.push(line);

      if (/^<\/details>/i.test(trimmed)) {
        detailsBuffer = null;
      }

      continue;
    }

    if (/Retrieval:PriorManifest/i.test(line)) {
      continue;
    }

    if (/MaxPriorManifestsPerIndex/i.test(line)) {
      continue;
    }

    if (/deployment configuration/i.test(line)) {
      continue;
    }

    if (/Administrator details — indexing limits/i.test(line)) {
      continue;
    }

    if (/Platform teams may adjust the limit/i.test(line)) {
      continue;
    }

    result.push(line);
  }

  return result
    .join("\n")
    .replace(
      new RegExp(
        "up to the configured limit of \\*\\*other finalized " +
          ["arch", "itecture packages"].join("") +
          "\\*\\*",
        "gi",
      ),
      "up to **five** other finalized reviews (most recent first)",
    )
    .replace(/\(see limits below\)/gi, "")
    .replace(
      /Cross-package prior attachment at index time is capped[^.\n]*\./gi,
      "Cross-package prior attachment keeps the **five** most recent finalized reviews in the same project, excluding the review being finalized and any archived records.",
    )
    .replace(/`Retrieval:PriorManifest:[^`]+`/gi, "the platform indexing limit")
    .replace(/Retrieval:PriorManifest:[^\s)]+/gi, "the platform indexing limit")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
}

function isProductOverviewContributorLeakageLine(line: string): boolean {
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
 * TB-1686 — executive-summary help: sponsor-brief sections with buyer-safe ROI link rewrites.
 */
export function stripExecutiveSummarySponsorBriefLeakage(markdown: string): string {
  return stripProductOverviewContributorLeakage(markdown)
    .replace(/^(##+)\s+\d+\.\s+/gm, "$1 ")
    .replace(/`?API_CONTRACTS\.md`?/gi, "[Configuration reference](/help/configuration-reference)")
    .replace(/API_CONTRACTS\.md/gi, "/help/configuration-reference")
    .replace(
      /`?PILOT_ROI_MODEL\.md`?/gi,
      "[Pilot ROI measurement](/help/executive-summary#pilot-roi-measurement)",
    )
    .replace(/PILOT_ROI_MODEL\.md/gi, "/help/executive-summary#pilot-roi-measurement")
    .replace(
      /`?ROI_MODEL\.md`?/gi,
      "[Pilot ROI measurement](/help/executive-summary#pilot-roi-measurement)",
    )
    .replace(/ROI_MODEL\.md/gi, "/help/executive-summary#pilot-roi-measurement")
    .replace(/\[Api Contracts\]\(/gi, "[API contracts](")
    .replace(/\[Pilot Roi Model\]\(/gi, "[Pilot ROI measurement](")
    .replace(/\[Roi Model\]\(/gi, "[Pilot ROI measurement](")
    .replace(/`?PRODUCT_PACKAGING\.md`?/gi, "[Executive summary](/help/executive-summary#what-archlucid-is)")
    .replace(/PRODUCT_PACKAGING\.md/gi, "/help/executive-summary#what-archlucid-is")
    .replace(/`\/value-report`/gi, "`/insights/executive-summary`")
    .replace(/\/value-report/gi, "/insights/executive-summary")
    .replace(/\/help\/pilot-roi-model/gi, "/help/executive-summary#pilot-roi-measurement")
    .replace(/`?SPONSOR_BANNER_FIRST_COMMIT_BADGE\.md`?/gi, "sponsor banner documentation")
    .replace(/SPONSOR_BANNER_FIRST_COMMIT_BADGE\.md/gi, "sponsor banner documentation");
}

/**
 * TB-1738 — product-overview help: strip eng/GTM paths, type names, and backlog IDs; buyer-safe pillars.
 */
export function stripProductOverviewContributorLeakage(markdown: string): string {
  const lines = markdown.split("\n");
  const result: string[] = [];
  let detailsBuffer: string[] | null = null;
  let omitM18Templates = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (/^### M-18 outreach message templates/i.test(trimmed)) {
      omitM18Templates = true;
      continue;
    }

    if (omitM18Templates && /^## /i.test(trimmed)) {
      omitM18Templates = false;
    }

    if (omitM18Templates) {
      continue;
    }

    if (/^<details\b/i.test(trimmed)) {
      detailsBuffer = [line];
      continue;
    }

    if (detailsBuffer !== null) {
      detailsBuffer.push(line);

      if (/^<\/details>/i.test(trimmed)) {
        detailsBuffer = null;
      }

      continue;
    }

    if (isProductOverviewContributorLeakageLine(line)) {
      continue;
    }

    if (/^\*\*Platform intent:\*\*/i.test(trimmed)) {
      result.push(
        "**Platform intent:** Production reference deployments and first-party operations are **Azure-native** (identity, data, messaging, and hosting). Hosted evaluation uses the public ArchLucid SaaS endpoints when your tenant is provisioned.",
      );
      continue;
    }

    result.push(line);
  }

  return result
    .join("\n")
    .replace(
      /Every architecture recommendation ArchLucid produces comes with a complete chain of evidence\.[\s\S]*?and here is the full trail\./i,
      "Every architecture recommendation ArchLucid produces comes with a complete chain of evidence: what was examined, which rules applied, what was concluded, and why — linked to review artifacts, not a chat transcript.",
    )
    .replace(
      /Architecture decisions in ArchLucid are not just analyzed — they are governed\.[\s\S]*?regulators and auditors expect\./i,
      "Architecture decisions in ArchLucid are not just analyzed — they are governed. **Policy packs** encode your governance rules. Approval workflows enforce segregation of duties. Pre-finalize gates can block finalized reviews when findings exceed severity thresholds. An append-only audit log records governance and review events for downstream audit.",
    )
    .replace(/`?POSITIONING\.md`?/gi, "positioning guide")
    .replace(/POSITIONING\.md/gi, "positioning guide")
    .replace(/`?V1_DEFERRED\.md`?/gi, "deferred capability documentation")
    .replace(/V1_DEFERRED\.md/gi, "deferred capability documentation")
    .replace(/ExplainabilityTrace/gi, "explainability trail")
    .replace(/\bM-\d+\b/gi, "")
    .replace(/open\s+\*\*\*\*/gi, "")
    .replace(/GTM\s+\*\*\*\*/gi, "go-to-market planning")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
}

/** H2 sections omitted from in-app SOC 2 self-assessment help (contributor/GTM index). */
const SOC2_SELF_ASSESSMENT_OMITTED_SECTION_PREFIXES = ["related", "pending questions"] as const;

/**
 * TB-1747 — drops contributor Related / Pending Questions sections from SOC 2 self-assessment help.
 */
export function stripSoc2SelfAssessmentContributorSections(markdown: string): string {
  return stripMarkdownSectionsByTitlePrefix(markdown, SOC2_SELF_ASSESSMENT_OMITTED_SECTION_PREFIXES);
}

function isSoc2SelfAssessmentContributorLeakageLine(line: string): boolean {
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
export function alignSoc2SelfAssessmentRoadmapHonesty(markdown: string): string {
  return markdown
    .replace(
      /## SOC 2 Type I — readiness planning \(Q2–Q3 2026\)/gi,
      "## SOC 2 Type I — readiness planning (illustrative — not a commitment)",
    )
    .replace(
      /\| Type I observation period start \| 2026-09-01 \|/gi,
      "| Type I observation period start | Illustrative — owner/budget gated |",
    )
    .replace(
      /\| Type I report \(stretch\) \| 2026-Q4 \|/gi,
      "| Type I report (stretch) | Illustrative — owner/budget gated |",
    )
    .replace(
      /\*\*Open\*\* — requires external readiness consultant shortlist and budget line \(see Pending Questions\)/gi,
      "**Open** — readiness planning only; CPA Type I attestation requires funded consultant engagement and executed agreement (not a product commitment)",
    )
    .replace(
      /\| G-001 \| No CPA SOC 2 report \| CFO \/ Security \| Fund external readiness consultant \+ CPA firm; Type I observation window \|/gi,
      "| G-001 | No CPA SOC 2 report | Security / leadership | Fund external readiness consultant + CPA firm when budget approves |",
    )
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
}

/**
 * TB-1747 — SOC 2 self-assessment help: strip contributor repo paths and eng control names; buyer-safe summary.
 */
export function stripSoc2SelfAssessmentContributorLeakage(markdown: string): string {
  const sectionStripped = stripSoc2SelfAssessmentContributorSections(markdown);
  const lines = sectionStripped.split("\n");
  const result: string[] = [];

  for (const line of lines) {
    if (/^\| G-001 \|/i.test(line)) {
      result.push(
        "| G-001 | No CPA SOC 2 report | Security / leadership | Fund external readiness consultant + CPA firm when budget approves | **Open** — readiness planning only; CPA Type I attestation requires funded consultant engagement and executed agreement (not a product commitment) |",
      );
      continue;
    }

    if (/^\| G-002 \|/i.test(line)) {
      result.push(
        "| G-002 | Third-party pen-test redacted summary not yet published | Security | Execute vendor programme when funded | **Open** — ArchLucid uses owner-conducted testing; independent third-party publication when a funded programme completes (not CPA SOC 2 attestation) |",
      );
      continue;
    }

    if (/^\| G-003 \|/i.test(line)) {
      result.push(
        "| G-003 | CAIQ / SIG not pre-filled | Security | Publish alongside trust center | **Closed (artifacts)** — [CAIQ / SIG questionnaire responses](/help/caiq-sig-response) |",
      );
      continue;
    }

    if (/^\| Security — logical access \|/i.test(line)) {
      result.push(
        "| Security — logical access | Entra / JWT roles, API keys, RBAC policies; privileged operations recorded in the product audit log | Partial |",
      );
      continue;
    }

    if (/^\| Security — data protection \|/i.test(line)) {
      result.push(
        "| Security — data protection | Database-per-tenant catalogs with defense-in-depth; private endpoint posture in hosted deployments | Partial |",
      );
      continue;
    }

    if (/^\| Security — secure SDLC \|/i.test(line)) {
      result.push(
        "| Security — secure SDLC | Automated security testing in CI (static analysis, contract tests, unit/integration tiers) | Strong |",
      );
      continue;
    }

    if (isSoc2SelfAssessmentContributorLeakageLine(line)) {
      continue;
    }

    if (/^> \*\*Scope:\*\*/i.test(line.trim())) {
      result.push(
        "> **Scope:** SOC 2 Trust Services Criteria — **self-assessment only** (not CPA attestation). CAIQ/SIG pre-fills are available; Type I scoping remains a **readiness planning** milestone (not yet an opinion).",
      );
      continue;
    }

    result.push(line);
  }

  return alignSoc2SelfAssessmentRoadmapHonesty(
    result.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd(),
  );
}

/** H2 sections rendered in HelpPathChooserGuideView chrome instead of markdown body. */
const PATH_CHOOSER_STRUCTURED_UI_SECTION_TITLES = ["choose your next step", "related"] as const;

const EVIDENCE_INTAKE_STRUCTURED_UI_SECTION_PREFIXES = [
  "choose a starting path",
  "related guides",
  "verify intake before finalize",
] as const;

const EVIDENCE_TRAIL_STRUCTURED_UI_SECTION_PREFIXES = [
  "open the evidence graph",
  "related guides",
] as const;

/**
 * TB-1351 — buyer-safe wording for guided-intake path copy in product presentation.
 */
export function softenEvidenceIntakeHelpPresentation(markdown: string): string {
  return markdown.replace(/admission gates/gi, "readiness checks");
}

/**
 * TB-1350 — specialty chrome owns path strip, verify panel, and related guides.
 */
export function stripEvidenceIntakeStructuredUiSections(markdown: string): string {
  return stripMarkdownSectionsByTitlePrefix(markdown, EVIDENCE_INTAKE_STRUCTURED_UI_SECTION_PREFIXES, {
    collapseBlankLines: true,
  });
}

/**
 * TB-1360 — specialty chrome owns open-graph action panel, finding jump, and related guides.
 */
export function stripEvidenceTrailStructuredUiSections(markdown: string): string {
  return stripMarkdownSectionsByTitlePrefix(markdown, EVIDENCE_TRAIL_STRUCTURED_UI_SECTION_PREFIXES, {
    collapseBlankLines: true,
  });
}

export function stripPathChooserStructuredUiSections(markdown: string): string {
  return stripMarkdownSectionsByTitlePrefix(markdown, PATH_CHOOSER_STRUCTURED_UI_SECTION_TITLES, {
    collapseBlankLines: true,
  });
}

export function stripPathChooserContributorLeakage(markdown: string): string {
  return markdown
    .replace(/> \*\*Start operators here:\*\*[^\n]*\n?/gi, "")
    .replace(/\*\*Start operators here:\*\*[^\n]*\n?/gi, "")
    .replace(/`?FIRST_PILOT_OPERATOR_PATH\.md`?/gi, "[Your first architecture review](/help/first-architecture-review)")
    .replace(/FIRST_PILOT_OPERATOR_PATH\.md/gi, "/help/first-architecture-review")
    .replace(/`?FIRST_EVALUATOR_DECISION\.md`?/gi, "[Your first architecture review](/help/first-architecture-review)")
    .replace(/FIRST_EVALUATOR_DECISION\.md/gi, "/help/first-architecture-review")
    .replace(/`?CORE_PILOT\.md`?/gi, "[Your first architecture review](/help/first-architecture-review)")
    .replace(/CORE_PILOT\.md/gi, "/help/first-architecture-review")
    .replace(/`?EXECUTIVE_SPONSOR_BRIEF\.md`?/gi, "[Executive summary](/help/executive-summary)")
    .replace(/EXECUTIVE_SPONSOR_BRIEF\.md/gi, "/help/executive-summary")
    .replace(/`?DIFFERENTIATION_PROOF_PACKET\.md`?/gi, "differentiation proof documentation")
    .replace(/DIFFERENTIATION_PROOF_PACKET\.md/gi, "differentiation proof documentation")
    .replace(/`first-pilot-command-center\.md`/gi, "pilot command center summary")
    .replace(/`go-no-go-summary\.md`/gi, "go/no-go summary")
    .replace(/`quote-to-proof-packet\.md`/gi, "quote-to-proof summary")
    .replace(/`commercial-closeout\.md`/gi, "commercial closeout summary")
    .replace(/`?FIRST_PILOT_EVIDENCE_BUNDLE\.md`?/gi, "first-pilot evidence bundle guide")
    .replace(/FIRST_PILOT_EVIDENCE_BUNDLE\.md/gi, "first-pilot evidence bundle guide")
    .replace(/artifacts\/first-pilot-proof\/?/gi, "proof working folder")
    .replace(/artifacts\/[^\s`|)]+/gi, "proof output folder")
    .replace(/`?V1_DEFERRED\.md`?/gi, "deferred capability documentation")
    .replace(/V1_DEFERRED\.md/gi, "deferred capability documentation")
    .replace(/`?PROCUREMENT_PACK_INDEX\.md[^`\s)]*`?/gi, "[Procurement FAQ](/help/procurement)")
    .replace(/PROCUREMENT_PACK_INDEX\.md[^\s)`]*/gi, "/help/procurement")
    .replace(/`?BUYER_SECURITY_PROCUREMENT_PACKET\.md[^`\s)]*`?/gi, "[Procurement FAQ](/help/procurement)")
    .replace(/BUYER_SECURITY_PROCUREMENT_PACKET\.md[^\s)`]*/gi, "/help/procurement")
    .replace(/`?AI_READINESS_POSTURE\.md[^`\s)]*`?/gi, "[Security and trust](/help/security-trust)")
    .replace(/AI_READINESS_POSTURE\.md[^\s)`]*/gi, "/help/security-trust")
    .replace(/\[trust-center\.md\]\(trust-center\.md\)/gi, "[Security and trust](/help/security-trust)")
    .replace(/trust-center\.md/gi, "/help/security-trust")
    .replace(/`?CLAIM_READINESS_STATUS\.md[^`\s)]*`?/gi, "claim readiness documentation")
    .replace(/CLAIM_READINESS_STATUS\.md[^\s)`]*/gi, "claim readiness documentation")
    .replace(/`?GTM_BACKLOG\.md`?/gi, "go-to-market planning documentation")
    .replace(/GTM_BACKLOG\.md/gi, "go-to-market planning documentation")
    .replace(/`?PRODUCT_PACKAGING\.md`?/gi, "product packaging guide")
    .replace(/PRODUCT_PACKAGING\.md/gi, "product packaging guide")
    .replace(/`?QUOTE_TO_PROOF_PACKET\.md[^`\s)]*`?/gi, "quote-to-proof documentation")
    .replace(/QUOTE_TO_PROOF_PACKET\.md[^\s)`]*/gi, "quote-to-proof documentation")
    .replace(/`?docs\/library\/[^`\s)]+`?/gi, "product documentation")
    .replace(/`?docs\/go-to-market\/[^`\s)]+`?/gi, "go-to-market documentation")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
}

/**
 * TB-1653 / TB-1284 — soften absolute cross-tenant isolation claims in data-handling help.
 */
export function alignDataHandlingIsolationHonesty(markdown: string): string {
  if (!/cross-tenant data access is not part of the product design/i.test(markdown)) {
    return markdown;
  }

  return markdown
    .replace(
      /Each customer tenant uses a dedicated database\.\s*Cross-tenant data access is not part of the product design\./gi,
      "Each customer tenant uses a dedicated database catalog. Tenant identity is decided at the host boundary, and API requests carry a tenant scope that the data layer enforces on tenant-facing queries — that is the standard customer path, not a claim that every staff or platform surface is free of cross-tenant aggregation. For isolation and assurance detail, see [Security and trust](/help/security-trust). For the three-layer isolation deep-dive, see [Data handling and tenant isolation](/help/data-handling).",
    )
    .replace(/\n{3,}/g, "\n\n");
}

/**
 * TB-1633 — aligns CAIQ/SIG questionnaire help with assurance honesty talk-track
 * (ASSURANCE_STATUS_CANONICAL / TB-1144): SoW/program ≠ published third-party pen test;
 * never imply CPA SOC 2 attestation or "pen test in flight."
 */
export function alignCaiqSigAssuranceHonesty(markdown: string): string {
  return markdown
    .replace(
      /\|\s*Third-party pen test\s*\|\s*In flight\s*\|/gi,
      "| Third-party pen test | Planned, not yet scheduled |",
    )
    .replace(
      /\*\*In flight\*\*, \*\*Inherited\*\*/gi,
      "**Planned, not yet scheduled**, **Inherited**",
    )
    .replace(/pen[- ]test in flight/gi, "third-party penetration test planned, not yet scheduled")
    .replace(/pen[- ]test underway/gi, "third-party penetration test planned, not yet scheduled")
    .replace(/SOC 2 ready/gi, "SOC 2 self-assessment (not CPA attestation)")
    .replace(/SOC 2 certified/gi, "SOC 2 self-assessment (not CPA attestation)")
    .replace(/SOC 2 in process/gi, "SOC 2 readiness planning (not CPA attestation)")
    .replace(/almost attested/gi, "self-assessment only (not CPA attestation)")
    .replace(/\n{3,}/g, "\n\n");
}

/** Emphasizes known inline guidance labels in help markdown when not already bold. */

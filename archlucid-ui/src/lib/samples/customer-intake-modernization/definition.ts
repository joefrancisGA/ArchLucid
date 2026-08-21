import type { SampleScenarioDefinition } from "@/lib/samples/types";

/** Public-marketing slug for the generic enterprise intake sample — no fixture-style token. */
export const CUSTOMER_INTAKE_SAMPLE_RUN_ID = "customer-intake-modernization";

export const CUSTOMER_INTAKE_PRIOR_COMPARE_RUN_ID = "customer-intake-run-v1";

export const CUSTOMER_INTAKE_LATER_COMPARE_RUN_ID = "customer-intake-run-v2";

export const CUSTOMER_INTAKE_MANIFEST_ID = "b2c3d4e5-f6a7-8901-bcde-f12345678901";

export const CUSTOMER_INTAKE_PRIMARY_FINDING_ID = "sensitive-data-minimization-risk";

export const CUSTOMER_INTAKE_PRIMARY_FINDING_TITLE = "Sensitive Data Minimization Risk";

export const CUSTOMER_INTAKE_BUYER_REVIEW_TITLE = "Enterprise Customer Intake Modernization Review";

export const CUSTOMER_INTAKE_BUYER_REVIEW_PACKAGE_TITLE = "Enterprise Customer Intake Modernization";

export const CUSTOMER_INTAKE_POLICY_PACK_DETAIL_HREF = "/governance/policy-packs/demo-enterprise-privacy-pack";

/** Pinned semver for the enterprise-privacy-v2 static demo spine. */
export const CUSTOMER_INTAKE_RULE_SET_VERSION = "2.1.0";

export const CUSTOMER_INTAKE_DEMO_TENANT_NAME = "Customer Intake Showcase";

export const CUSTOMER_INTAKE_DEMO_TENANT_CATALOG_ID = "al-tenant-customer-intake-showcase";

export const CUSTOMER_INTAKE_CANONICAL_PROOF_HREF = `/showcase/${CUSTOMER_INTAKE_SAMPLE_RUN_ID}` as const;

/** Canonical buyer-facing primary sentence (TB-980 / GTM M-133 / M-135). */
export const CUSTOMER_INTAKE_PRIMARY_BUYER_SENTENCE =
  "ArchLucid's primary buyer-facing sample is Enterprise Customer Intake Modernization — an architecture package for modernizing how an enterprise intakes and processes customer work, with evidence-backed findings you can finalize and export.";

/** Registry entry for the generic enterprise intake sample spine (TB-980). */
export const CUSTOMER_INTAKE_SAMPLE_DEFINITION: SampleScenarioDefinition = {
  slug: "customer-intake",
  runId: CUSTOMER_INTAKE_SAMPLE_RUN_ID,
  priorCompareRunId: CUSTOMER_INTAKE_PRIOR_COMPARE_RUN_ID,
  laterCompareRunId: CUSTOMER_INTAKE_LATER_COMPARE_RUN_ID,
  manifestId: CUSTOMER_INTAKE_MANIFEST_ID,
  primaryFindingId: CUSTOMER_INTAKE_PRIMARY_FINDING_ID,
  primaryFindingTitle: CUSTOMER_INTAKE_PRIMARY_FINDING_TITLE,
  buyerReviewTitle: CUSTOMER_INTAKE_BUYER_REVIEW_TITLE,
  buyerReviewPackageTitle: CUSTOMER_INTAKE_BUYER_REVIEW_PACKAGE_TITLE,
  policyPackDetailHref: CUSTOMER_INTAKE_POLICY_PACK_DETAIL_HREF,
  policyPackIdAliases: ["demo-enterprise-privacy-pack", "enterprise-privacy-v2", "enterprise_privacy"],
  ruleSetId: "enterprise-privacy-v2",
  ruleSetVersion: CUSTOMER_INTAKE_RULE_SET_VERSION,
  tenantName: CUSTOMER_INTAKE_DEMO_TENANT_NAME,
  tenantCatalogId: CUSTOMER_INTAKE_DEMO_TENANT_CATALOG_ID,
  workspaceLabel: "Customer Intake Demo",
  disclosureKind: "illustrative-static",
  categoryTokens: ["sensitive-data", "privacy", "pii"],
  spineCounts: {
    findingCount: 9,
    warningCount: 1,
    decisionCount: 12,
  },
  graphLinkedRecordCount: 15,
  auditTrailEventCount: 7,
  illustrativeAnnualizedExtractionUsd: 88_420,
  canonicalProofHref: CUSTOMER_INTAKE_CANONICAL_PROOF_HREF,
  universeTextSignals: ["customer intake", "enterprise intake"],
  primaryBuyerSentence: CUSTOMER_INTAKE_PRIMARY_BUYER_SENTENCE,
};

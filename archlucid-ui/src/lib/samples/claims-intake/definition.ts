import type { SampleScenarioDefinition } from "@/lib/samples/types";

/** Public-marketing slug for demos and screenshots — no fixture-style token. */
export const CLAIMS_INTAKE_SAMPLE_RUN_ID = "claims-intake-modernization";

export const CLAIMS_INTAKE_PRIOR_COMPARE_RUN_ID = "claims-intake-run-v1";

export const CLAIMS_INTAKE_LATER_COMPARE_RUN_ID = "claims-intake-run-v2";

export const CLAIMS_INTAKE_MANIFEST_ID = "a1c2e3f4-a5b6-7890-abcd-ef1234567890";

export const CLAIMS_INTAKE_PRIMARY_FINDING_ID = "phi-minimization-risk";

export const CLAIMS_INTAKE_PRIMARY_FINDING_TITLE = "PHI Minimization Risk";

export const CLAIMS_INTAKE_BUYER_REVIEW_TITLE = "Claims Intake Modernization Review";

export const CLAIMS_INTAKE_BUYER_REVIEW_PACKAGE_TITLE = "Claims Intake Modernization";

export const CLAIMS_INTAKE_POLICY_PACK_DETAIL_HREF = "/governance/policy-packs/demo-healthcare-claims-pack";

export const CLAIMS_INTAKE_DEMO_TENANT_NAME = "Claims Intake Showcase";

export const CLAIMS_INTAKE_DEMO_TENANT_CATALOG_ID = "al-tenant-claims-intake-showcase";

export const CLAIMS_INTAKE_CANONICAL_PROOF_HREF = `/showcase/${CLAIMS_INTAKE_SAMPLE_RUN_ID}` as const;

/** Secondary regulated-depth sample sentence — not the primary buyer-facing line (TB-980). */
export const CLAIMS_INTAKE_SECONDARY_BUYER_SENTENCE =
  "Claims Intake Modernization is ArchLucid's regulated-depth healthcare sample — a governed architecture package for intake-to-adjudication flows with HIPAA-aligned evidence you can finalize and export.";

/** Registry entry for the Claims Intake regulated-depth sample spine (TB-979). */
export const CLAIMS_INTAKE_SAMPLE_DEFINITION: SampleScenarioDefinition = {
  slug: "claims-intake",
  runId: CLAIMS_INTAKE_SAMPLE_RUN_ID,
  priorCompareRunId: CLAIMS_INTAKE_PRIOR_COMPARE_RUN_ID,
  laterCompareRunId: CLAIMS_INTAKE_LATER_COMPARE_RUN_ID,
  manifestId: CLAIMS_INTAKE_MANIFEST_ID,
  primaryFindingId: CLAIMS_INTAKE_PRIMARY_FINDING_ID,
  primaryFindingTitle: CLAIMS_INTAKE_PRIMARY_FINDING_TITLE,
  buyerReviewTitle: CLAIMS_INTAKE_BUYER_REVIEW_TITLE,
  buyerReviewPackageTitle: CLAIMS_INTAKE_BUYER_REVIEW_PACKAGE_TITLE,
  policyPackDetailHref: CLAIMS_INTAKE_POLICY_PACK_DETAIL_HREF,
  policyPackIdAliases: ["demo-healthcare-claims-pack", "healthcare-claims-v3", "healthcare_claims"],
  ruleSetId: "healthcare-claims-v3",
  tenantName: CLAIMS_INTAKE_DEMO_TENANT_NAME,
  tenantCatalogId: CLAIMS_INTAKE_DEMO_TENANT_CATALOG_ID,
  workspaceLabel: "Claims Intake Demo",
  disclosureKind: "illustrative-static",
  categoryTokens: ["phi"],
  spineCounts: {
    findingCount: 9,
    warningCount: 1,
    decisionCount: 12,
  },
  graphLinkedRecordCount: 15,
  auditTrailEventCount: 7,
  illustrativeAnnualizedExtractionUsd: 94_360,
  canonicalProofHref: CLAIMS_INTAKE_CANONICAL_PROOF_HREF,
  universeTextSignals: ["claims intake", "healthcare claims"],
  primaryBuyerSentence: CLAIMS_INTAKE_SECONDARY_BUYER_SENTENCE,
};

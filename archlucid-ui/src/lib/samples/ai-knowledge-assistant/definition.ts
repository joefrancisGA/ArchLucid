import type { SampleScenarioDefinition } from "@/lib/samples/types";
import {
  SHOWCASE_CREATED_DEMO_TENANT_NAME,
  SHOWCASE_CREATED_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_CREATED_STATIC_DEMO_PRIMARY_FINDING_ID,
  SHOWCASE_CREATED_STATIC_DEMO_PRIMARY_FINDING_TITLE,
  SHOWCASE_CREATED_STATIC_DEMO_RUN_ID,
  SHOWCASE_CREATED_STATIC_DEMO_SPINE_COUNTS,
} from "@/lib/showcase-created-static-demo";

/** Public slug — route id stays `northwind-copilot-rag-platform` for SQL seed compatibility. */
export const AI_KNOWLEDGE_ASSISTANT_SAMPLE_RUN_ID = SHOWCASE_CREATED_STATIC_DEMO_RUN_ID;

export const AI_KNOWLEDGE_ASSISTANT_PRIOR_COMPARE_RUN_ID = "northwind-copilot-rag-v1";

export const AI_KNOWLEDGE_ASSISTANT_LATER_COMPARE_RUN_ID = "northwind-copilot-rag-v2";

export const AI_KNOWLEDGE_ASSISTANT_MANIFEST_ID = SHOWCASE_CREATED_STATIC_DEMO_MANIFEST_ID;

export const AI_KNOWLEDGE_ASSISTANT_PRIMARY_FINDING_ID = SHOWCASE_CREATED_STATIC_DEMO_PRIMARY_FINDING_ID;

export const AI_KNOWLEDGE_ASSISTANT_PRIMARY_FINDING_TITLE = SHOWCASE_CREATED_STATIC_DEMO_PRIMARY_FINDING_TITLE;

export const AI_KNOWLEDGE_ASSISTANT_BUYER_REVIEW_TITLE =
  "Enterprise AI Knowledge Assistant Review";

export const AI_KNOWLEDGE_ASSISTANT_BUYER_REVIEW_PACKAGE_TITLE =
  "Enterprise AI Knowledge Assistant";

export const AI_KNOWLEDGE_ASSISTANT_POLICY_PACK_DETAIL_HREF = "/governance/policy-packs/ai-llm-workload-v1";

export const AI_KNOWLEDGE_ASSISTANT_RULE_SET_VERSION = "1.2.0";

export const AI_KNOWLEDGE_ASSISTANT_DEMO_TENANT_NAME = SHOWCASE_CREATED_DEMO_TENANT_NAME;

export const AI_KNOWLEDGE_ASSISTANT_DEMO_TENANT_CATALOG_ID = "al-tenant-ai-knowledge-assistant-showcase";

export const AI_KNOWLEDGE_ASSISTANT_CANONICAL_PROOF_HREF =
  `/showcase/${AI_KNOWLEDGE_ASSISTANT_SAMPLE_RUN_ID}` as const;

/** Secondary created showcase sentence (TB-982 / GTM M-135). */
export const AI_KNOWLEDGE_ASSISTANT_SECONDARY_BUYER_SENTENCE =
  "Enterprise AI Knowledge Assistant is ArchLucid's governed copilot/RAG sample — a created architecture package for private inference, responsible-AI controls, and evidence you can finalize and export.";

/** Registry entry for the AI Knowledge Assistant created showcase (TB-982). */
export const AI_KNOWLEDGE_ASSISTANT_SAMPLE_DEFINITION: SampleScenarioDefinition = {
  slug: "ai-knowledge-assistant",
  runId: AI_KNOWLEDGE_ASSISTANT_SAMPLE_RUN_ID,
  priorCompareRunId: AI_KNOWLEDGE_ASSISTANT_PRIOR_COMPARE_RUN_ID,
  laterCompareRunId: AI_KNOWLEDGE_ASSISTANT_LATER_COMPARE_RUN_ID,
  manifestId: AI_KNOWLEDGE_ASSISTANT_MANIFEST_ID,
  primaryFindingId: AI_KNOWLEDGE_ASSISTANT_PRIMARY_FINDING_ID,
  primaryFindingTitle: AI_KNOWLEDGE_ASSISTANT_PRIMARY_FINDING_TITLE,
  buyerReviewTitle: AI_KNOWLEDGE_ASSISTANT_BUYER_REVIEW_TITLE,
  buyerReviewPackageTitle: AI_KNOWLEDGE_ASSISTANT_BUYER_REVIEW_PACKAGE_TITLE,
  policyPackDetailHref: AI_KNOWLEDGE_ASSISTANT_POLICY_PACK_DETAIL_HREF,
  policyPackIdAliases: ["ai-llm-workload-v1", "demo-ai-llm-workload-pack", "ai_llm_workload"],
  ruleSetId: "ai-llm-workload-v1",
  ruleSetVersion: AI_KNOWLEDGE_ASSISTANT_RULE_SET_VERSION,
  tenantName: AI_KNOWLEDGE_ASSISTANT_DEMO_TENANT_NAME,
  tenantCatalogId: AI_KNOWLEDGE_ASSISTANT_DEMO_TENANT_CATALOG_ID,
  workspaceLabel: "Enterprise AI Knowledge Assistant Showcase",
  disclosureKind: "illustrative-created-static",
  categoryTokens: ["copilot", "rag", "responsible-ai", "private-endpoint"],
  spineCounts: {
    findingCount: SHOWCASE_CREATED_STATIC_DEMO_SPINE_COUNTS.findingCount,
    warningCount: SHOWCASE_CREATED_STATIC_DEMO_SPINE_COUNTS.warningCount,
    decisionCount: SHOWCASE_CREATED_STATIC_DEMO_SPINE_COUNTS.decisionCount,
  },
  graphLinkedRecordCount: 11,
  auditTrailEventCount: 6,
  illustrativeAnnualizedExtractionUsd: 72_150,
  canonicalProofHref: AI_KNOWLEDGE_ASSISTANT_CANONICAL_PROOF_HREF,
  universeTextSignals: ["ai knowledge assistant", "copilot rag", "private inference"],
  primaryBuyerSentence: AI_KNOWLEDGE_ASSISTANT_SECONDARY_BUYER_SENTENCE,
};

import { buildAcceleratorReviewStartHref, type AcceleratorPackId } from "@/lib/accelerator-wizard-presets";

export type AcceleratorChooserEntry = {
  readonly id: string;
  readonly buyerJob: string;
  readonly packLabel: string;
  readonly summary: string;
  readonly requiredInputs: string;
  readonly expectedOutputs: string;
  readonly doNotUseWhen: string;
  readonly startHref: string;
  /** Cloud label when a pack is one of the cost-governance variants (Azure, AWS, GCP). */
  readonly cloudLabel?: string;
};

export const ACCELERATOR_COST_GOVERNANCE_PACK_IDS = [
  "azure-cost-governance",
  "aws-cost-governance",
  "gcp-cost-governance",
] as const;

export type AcceleratorCostGovernancePackId = (typeof ACCELERATOR_COST_GOVERNANCE_PACK_IDS)[number];

const ACCELERATOR_COST_GOVERNANCE_PACK_ID_SET = new Set<string>(ACCELERATOR_COST_GOVERNANCE_PACK_IDS);

export const ACCELERATOR_COST_GOVERNANCE_GROUP_ID = "cost-governance" as const;

export function isAcceleratorCostGovernancePackId(value: string): value is AcceleratorCostGovernancePackId {
  return ACCELERATOR_COST_GOVERNANCE_PACK_ID_SET.has(value);
}

export type AcceleratorCostGovernanceCloudOption = {
  readonly packId: AcceleratorCostGovernancePackId;
  readonly cloudLabel: string;
};

export const ACCELERATOR_COST_GOVERNANCE_CLOUD_OPTIONS: readonly AcceleratorCostGovernanceCloudOption[] = [
  { packId: "azure-cost-governance", cloudLabel: "Azure" },
  { packId: "aws-cost-governance", cloudLabel: "AWS" },
  { packId: "gcp-cost-governance", cloudLabel: "GCP" },
] as const;

export const ACCELERATOR_COST_GOVERNANCE_GROUP = {
  buyerJob: "Cost & orphan review",
  packLabel: "Cost governance pack",
  summary: "FinOps-oriented orphan and cost findings with ROI labels for finance stakeholders.",
  requiredInputs: "second-run.json (optional extractor ZIP)",
  expectedOutputs: "Findings with ROI labels and sponsor-ready export",
} as const;

/** Top buyer-job → accelerator pack rows surfaced on operator home (TB-170). */
export const ACCELERATOR_CHOOSER_ENTRIES: readonly AcceleratorChooserEntry[] = [
  {
    id: "regulated-saas-soc-procurement",
    buyerJob: "Regulated SaaS procurement",
    packLabel: "SOC-style diligence pack",
    summary: "Procurement-ready diligence findings with sponsor-safe export caveats for security reviewers.",
    requiredInputs: "second-run.json, policy-context.json",
    expectedOutputs: "Findings, signed review record, and sponsor-ready export checklist",
    doNotUseWhen: "Before any finalize; buyer demands CPA attestation",
    startHref: buildAcceleratorReviewStartHref("regulated-saas-soc-procurement"),
  },
  {
    id: "ai-llm-workload" satisfies AcceleratorPackId,
    buyerJob: "AI / LLM workload governance",
    packLabel: "AI governance pack",
    summary: "Responsible-AI governance storyline for model owners and platform architects.",
    requiredInputs: "second-run.json, policy-context.json",
    expectedOutputs: "Findings, evidence trail, and sponsor-ready export",
    doNotUseWhen: "Generic chat comparison only; no LLM in scope",
    startHref: buildAcceleratorReviewStartHref("ai-llm-workload"),
  },
  {
    id: "azure-cost-governance" satisfies AcceleratorPackId,
    buyerJob: "Azure cost & orphan review",
    cloudLabel: "Azure",
    packLabel: "Cost governance pack",
    summary: "Azure spend and orphan-resource findings with ROI labels for cloud finance owners.",
    requiredInputs: "second-run.json (optional extractor ZIP)",
    expectedOutputs: "Findings with ROI labels and sponsor-ready export",
    doNotUseWhen: "Non-Azure-only architecture with no Azure evidence",
    startHref: buildAcceleratorReviewStartHref("azure-cost-governance"),
  },
  {
    id: "aws-cost-governance" satisfies AcceleratorPackId,
    buyerJob: "AWS cost & orphan review",
    cloudLabel: "AWS",
    packLabel: "Cost governance pack",
    summary: "AWS spend and orphan-resource findings with ROI labels for cloud finance owners.",
    requiredInputs: "second-run.json (optional extractor ZIP)",
    expectedOutputs: "Findings with ROI labels and sponsor-ready export",
    doNotUseWhen: "Non-AWS-only architecture with no AWS evidence",
    startHref: buildAcceleratorReviewStartHref("aws-cost-governance"),
  },
  {
    id: "gcp-cost-governance" satisfies AcceleratorPackId,
    buyerJob: "GCP cost & orphan review",
    cloudLabel: "GCP",
    packLabel: "Cost governance pack",
    summary: "GCP spend and orphan-resource findings with ROI labels for cloud finance owners.",
    requiredInputs: "second-run.json (optional extractor ZIP)",
    expectedOutputs: "Findings with ROI labels and sponsor-ready export",
    doNotUseWhen: "Non-GCP-only architecture with no GCP evidence",
    startHref: buildAcceleratorReviewStartHref("gcp-cost-governance"),
  },
  {
    id: "healthcare-data-workflow" satisfies AcceleratorPackId,
    buyerJob: "Healthcare data workflow",
    packLabel: "Healthcare workflow pack",
    summary: "Clinical data-flow minimization narrative for privacy and compliance reviewers.",
    requiredInputs: "second-run.json, policy-context.json",
    expectedOutputs: "Findings, signed review record, and sponsor export checklist",
    doNotUseWhen: "Real PHI in inputs; HIPAA certification claims",
    startHref: buildAcceleratorReviewStartHref("healthcare-data-workflow"),
  },
  {
    id: "greenfield-web-app",
    buyerJob: "Multi-tier web architecture (greenfield)",
    packLabel: "Greenfield web app wizard preset",
    summary: "Structural architecture findings for engineering leads building a new multi-tier web app.",
    requiredInputs: "Architecture request via new-review wizard",
    expectedOutputs: "Signed review record and findings on your inputs",
    doNotUseWhen: "Buyer needs a specialty accelerator pack instead",
    startHref: "/architecture/reviews/new?preset=greenfield",
  },
] as const;

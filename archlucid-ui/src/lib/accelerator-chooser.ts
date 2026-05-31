import { buildAcceleratorReviewStartHref, type AcceleratorPackId } from "@/lib/accelerator-wizard-presets";

export type AcceleratorChooserEntry = {
  readonly id: string;
  readonly buyerJob: string;
  readonly packLabel: string;
  readonly summary: string;
  readonly requiredInputs: string;
  readonly expectedOutputs: string;
  readonly scopeLabel: "V1-ready" | "V1.1-deferred";
  readonly startHref: string;
};

/** Top buyer-job → starter proof pack rows surfaced on operator home (TB-114). */
export const ACCELERATOR_CHOOSER_ENTRIES: readonly AcceleratorChooserEntry[] = [
  {
    id: "regulated-saas-soc-procurement",
    buyerJob: "Regulated SaaS procurement",
    packLabel: "SOC-style diligence pack",
    summary: "Policy-pack findings and sponsor-safe caveats for procurement conversations — not CPA SOC 2.",
    requiredInputs: "second-run.json, policy-context.json",
    expectedOutputs: "Governance findings + proof checklist",
    scopeLabel: "V1-ready",
    startHref: buildAcceleratorReviewStartHref("regulated-saas-soc-procurement"),
  },
  {
    id: "ai-llm-workload" satisfies AcceleratorPackId,
    buyerJob: "AI / LLM workload governance",
    packLabel: "AI governance pack",
    summary: "Responsible-AI and LLM architecture review with faithfulness-friendly citations.",
    requiredInputs: "second-run.json, policy-context.json",
    expectedOutputs: "AI governance findings + checklist",
    scopeLabel: "V1-ready",
    startHref: buildAcceleratorReviewStartHref("ai-llm-workload"),
  },
  {
    id: "azure-cost-governance" satisfies AcceleratorPackId,
    buyerJob: "Azure cost & orphan review",
    packLabel: "Cost governance pack",
    summary: "Cost/orphan-oriented findings with ROI source labels for FinOps stakeholders.",
    requiredInputs: "second-run.json (optional extractor ZIP)",
    expectedOutputs: "Cost findings + ROI labels",
    scopeLabel: "V1-ready",
    startHref: buildAcceleratorReviewStartHref("azure-cost-governance"),
  },
  {
    id: "healthcare-data-workflow" satisfies AcceleratorPackId,
    buyerJob: "Healthcare data workflow",
    packLabel: "Healthcare workflow pack",
    summary: "PHI-minimization storyline for clinical platform reviews — not HIPAA certification.",
    requiredInputs: "second-run.json, policy-context.json",
    expectedOutputs: "Healthcare pack findings + checklist",
    scopeLabel: "V1-ready",
    startHref: buildAcceleratorReviewStartHref("healthcare-data-workflow"),
  },
] as const;

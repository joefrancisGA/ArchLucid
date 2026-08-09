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
};

/** Top buyer-job → accelerator pack rows surfaced on operator home (TB-170). */
export const ACCELERATOR_CHOOSER_ENTRIES: readonly AcceleratorChooserEntry[] = [
  {
    id: "regulated-saas-soc-procurement",
    buyerJob: "Regulated SaaS procurement",
    packLabel: "SOC-style diligence pack",
    summary: "Policy-pack findings and sponsor-safe caveats for procurement conversations — not certification evidence.",
    requiredInputs: "second-run.json, policy-context.json",
    expectedOutputs: "Findings, architecture package, and sponsor-ready export checklist",
    doNotUseWhen: "Before any finalize; buyer demands CPA attestation",
    startHref: buildAcceleratorReviewStartHref("regulated-saas-soc-procurement"),
  },
  {
    id: "ai-llm-workload" satisfies AcceleratorPackId,
    buyerJob: "AI / LLM workload governance",
    packLabel: "AI governance pack",
    summary: "Responsible-AI and LLM architecture review with faithfulness-friendly citations.",
    requiredInputs: "second-run.json, policy-context.json",
    expectedOutputs: "Findings, evidence trail, and sponsor-ready export",
    doNotUseWhen: "Generic chat comparison only; no LLM in scope",
    startHref: buildAcceleratorReviewStartHref("ai-llm-workload"),
  },
  {
    id: "azure-cost-governance" satisfies AcceleratorPackId,
    buyerJob: "Azure cost & orphan review",
    packLabel: "Cost governance pack",
    summary: "Cost/orphan-oriented findings with ROI source labels for FinOps stakeholders.",
    requiredInputs: "second-run.json (optional extractor ZIP)",
    expectedOutputs: "Findings with ROI labels and sponsor-ready export",
    doNotUseWhen: "Non-Azure-only architecture with no Azure evidence",
    startHref: buildAcceleratorReviewStartHref("azure-cost-governance"),
  },
  {
    id: "healthcare-data-workflow" satisfies AcceleratorPackId,
    buyerJob: "Healthcare data workflow",
    packLabel: "Healthcare workflow pack",
    summary: "PHI-minimization storyline for clinical platform reviews — not HIPAA certification.",
    requiredInputs: "second-run.json, policy-context.json",
    expectedOutputs: "Findings, architecture package, and sponsor export checklist",
    doNotUseWhen: "Real PHI in inputs; HIPAA certification claims",
    startHref: buildAcceleratorReviewStartHref("healthcare-data-workflow"),
  },
  {
    id: "greenfield-web-app",
    buyerJob: "Multi-tier web architecture (greenfield)",
    packLabel: "Greenfield web app wizard preset",
    summary: "Topology and compliance findings on your architecture inputs via the new-review wizard.",
    requiredInputs: "Architecture request via new-review wizard",
    expectedOutputs: "Architecture package and findings on your inputs",
    doNotUseWhen: "Buyer needs a specialty accelerator pack instead",
    startHref: "/architecture/reviews/new?preset=greenfield",
  },
] as const;

import {
  DEMO_PREVIEW_ARTIFACT_AUDIT_DESC,
  DEMO_PREVIEW_ARTIFACT_AUDIT_TITLE,
  DEMO_PREVIEW_ARTIFACT_EVIDENCE_DESC,
  DEMO_PREVIEW_ARTIFACT_EVIDENCE_TITLE,
  DEMO_PREVIEW_ARTIFACT_SPONSOR_DESC,
  DEMO_PREVIEW_ARTIFACT_SPONSOR_TITLE,
  DEMO_PREVIEW_ARTIFACT_GOVERNANCE_DESC,
  DEMO_PREVIEW_ARTIFACT_GOVERNANCE_TITLE,
  DEMO_PREVIEW_ARTIFACT_SIGNED_DESC,
  DEMO_PREVIEW_ARTIFACT_SIGNED_TITLE,
} from "@/lib/demo-preview-page-copy";

export type LiveDemoWalkthroughStepId =
  | "sponsor"
  | "signed-record"
  | "evidence"
  | "governance"
  | "audit-trail";

export type LiveDemoWalkthroughStep = {
  readonly id: LiveDemoWalkthroughStepId;
  readonly number: number;
  readonly title: string;
  /** Compact stepper label; full `title` stays on the active panel H2 (TB-1268). */
  readonly shortLabel: string;
  readonly description: string;
  readonly keyTakeaway: string;
};

export const LIVE_DEMO_WALKTHROUGH_STEPS: readonly LiveDemoWalkthroughStep[] = [
  {
    id: "sponsor",
    number: 1,
    title: DEMO_PREVIEW_ARTIFACT_SPONSOR_TITLE,
    shortLabel: "Sponsor",
    description: DEMO_PREVIEW_ARTIFACT_SPONSOR_DESC,
    keyTakeaway:
      "Sponsors see the decision, supporting evidence basis, and monitored conditions before drilling into artifacts.",
  },
  {
    id: "signed-record",
    number: 2,
    title: DEMO_PREVIEW_ARTIFACT_SIGNED_TITLE,
    shortLabel: "Signed record",
    description: DEMO_PREVIEW_ARTIFACT_SIGNED_DESC,
    keyTakeaway:
      "The signed review record captures finalized status, accountable reviewer, policy coverage, and integrity checks.",
  },
  {
    id: "evidence",
    number: 3,
    title: DEMO_PREVIEW_ARTIFACT_EVIDENCE_TITLE,
    shortLabel: "Evidence",
    description: DEMO_PREVIEW_ARTIFACT_EVIDENCE_DESC,
    keyTakeaway:
      "Conclusions trace back through captured context, graph relationships, and cited findings — not unsupported assertions.",
  },
  {
    id: "governance",
    number: 4,
    title: DEMO_PREVIEW_ARTIFACT_GOVERNANCE_TITLE,
    shortLabel: "Governance",
    description: DEMO_PREVIEW_ARTIFACT_GOVERNANCE_DESC,
    keyTakeaway:
      "Governance approval records who approved, what risks remain monitored, and which issues are still unresolved.",
  },
  {
    id: "audit-trail",
    number: 5,
    title: DEMO_PREVIEW_ARTIFACT_AUDIT_TITLE,
    shortLabel: "Audit trail",
    description: DEMO_PREVIEW_ARTIFACT_AUDIT_DESC,
    keyTakeaway:
      "A retained audit trail shows when evidence was captured, findings recorded, the review finalized, and deliverables produced.",
  },
] as const;

export function parseLiveDemoWalkthroughStepId(value: string | null | undefined): LiveDemoWalkthroughStepId {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";

  if (normalized === "signed-record" || normalized === "signed") {
    return "signed-record";
  }

  if (normalized === "evidence" || normalized === "evidence-graph") {
    return "evidence";
  }

  if (normalized === "governance" || normalized === "approval") {
    return "governance";
  }

  if (normalized === "audit-trail" || normalized === "audit") {
    return "audit-trail";
  }

  return "sponsor";
}

export function liveDemoWalkthroughStepIndex(stepId: LiveDemoWalkthroughStepId): number {
  const index = LIVE_DEMO_WALKTHROUGH_STEPS.findIndex((step) => step.id === stepId);

  if (index < 0) {
    return 0;
  }

  return index;
}

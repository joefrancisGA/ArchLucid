import {
  buildIntakeShowcaseStaticPayload,
  type IntakeShowcaseDecisionItem,
} from "@/lib/samples/build-intake-showcase-static-payload";
import { CUSTOMER_INTAKE_SAMPLE_DEFINITION } from "@/lib/samples/customer-intake-modernization/definition";

export const CUSTOMER_INTAKE_SHOWCASE_DECISION_ITEMS: readonly IntakeShowcaseDecisionItem[] = [
  { controlArea: "Integration", text: "Intake API remains system-of-record; channel adapters are stateless facades." },
  {
    controlArea: "Data classification",
    text: "Sensitive customer attributes are classified at ingress; audit lineage follows the correlation ID.",
  },
  {
    controlArea: "Performance",
    text: "Peak-load buffering uses bounded queues with explicit back-pressure to fulfillment.",
  },
  {
    controlArea: "Auditability",
    text: "Manual rework queues are capped; overflow routes to a supervised exception path.",
  },
  {
    controlArea: "Data classification",
    text: "Third-party OCR is optional; human confirm gates apply before downstream commit.",
  },
  {
    controlArea: "Integration",
    text: "Fulfillment handoff uses signed event envelopes with idempotent consumers.",
  },
  {
    controlArea: "Data classification",
    text: "Retention aligns to enterprise policy; cold paths avoid negotiable shorter windows.",
  },
  {
    controlArea: "Auditability",
    text: "Observability spans intake latency, queue depth, and exception-rate SLOs.",
  },
  {
    controlArea: "Auditability",
    text: "Disaster recovery favors replay-from-journal over dual-active intake writers.",
  },
  {
    controlArea: "Integration",
    text: "Feature flags scope rollout by cohort; kill switches are tested each release.",
  },
  {
    controlArea: "Auditability",
    text: "Data residency constraints are enforced at the storage account boundary.",
  },
  {
    controlArea: "Sponsor KPIs",
    text: "Sponsor KPI pack ties modernization outcomes to defensible operational metrics.",
  },
];

export const CUSTOMER_INTAKE_SHOWCASE_DECISION_SYNOPSES: readonly string[] =
  CUSTOMER_INTAKE_SHOWCASE_DECISION_ITEMS.map((item) => item.text);

export const CUSTOMER_INTAKE_SHOWCASE_WARNING_SYNOPSES: readonly string[] = [
  "Unstructured intake attachments require weekly exception-volume monitoring to maintain sensitive-data minimization coverage.",
];

export function buildCustomerIntakeShowcaseStaticPayload(urlRunId: string) {
  return buildIntakeShowcaseStaticPayload({
    scenario: CUSTOMER_INTAKE_SAMPLE_DEFINITION,
    urlRunId,
    demoStatusMessage: "Demonstration — Enterprise Customer Intake Modernization sample scenario",
    operatorSummary:
      "Finalized architecture review for Enterprise Customer Intake Modernization — integration boundaries, sensitive-data minimization posture, " +
      "and sponsor-facing KPIs consolidated for sign-off.",
    decisionItems: CUSTOMER_INTAKE_SHOWCASE_DECISION_ITEMS,
    warningSynopses: CUSTOMER_INTAKE_SHOWCASE_WARNING_SYNOPSES,
    runExplanationSummary: "Demonstration narrative for Enterprise Customer Intake Modernization.",
    keyDrivers: [
      "Sensitive-data boundary and egress control parity across intake channels",
      "Auditability of intake-to-fulfillment flow",
      "Latency under peak submission windows",
    ],
    riskImplications: [
      "Privacy controls must remain consistent while throughput and channel parity improve.",
    ],
    costImplications: ["Ops touch reduction on intake rework."],
    complianceImplications: ["Enterprise privacy and data-classification logging with segregation of duties."],
    detailedNarrative:
      "This demonstration summarizes a stable, sponsor-reviewable modernization path for enterprise customer intake with clear " +
      "decisions, bounded risks, and evidence-backed recommendations.",
    themeSummaries: ["Data classification", "Intake continuity", "Auditability", "Peak-load performance"],
    overallAssessment:
      "Proceed with customer intake modernization under monitored sensitive-data minimization controls — no blocking findings remain open.",
    riskPosture: "Approved with monitoring",
    complianceGapCount: 1,
    graphSnapshotLabel: "Evidence graph — sensitive-data minimization controls",
    contextSnapshotLabel: "Customer intake architecture brief — intake boundaries",
    primaryFindingConfidenceLevel: "High",
    primaryFindingEvaluationScore: 95,
    primaryFindingEvidenceRefCount: 3,
    sponsorBriefingArtifactName: "Sponsor briefing — Enterprise Customer Intake Modernization.md",
    contextDiagramArtifactName: "Customer intake modernization context diagram.mmd",
  });
}

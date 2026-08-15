import type { DemoCommitPagePreviewResponse } from "@/types/demo-preview";

import type { FindingProvenance } from "@/lib/api/finding-provenance";
import {
  buildIntakeShowcaseStaticPayload,
  type IntakeShowcaseDecisionItem,
} from "@/lib/samples/build-intake-showcase-static-payload";
import {
  CLAIMS_INTAKE_BUYER_REVIEW_PACKAGE_TITLE,
  CLAIMS_INTAKE_BUYER_REVIEW_TITLE,
  CLAIMS_INTAKE_CANONICAL_PROOF_HREF,
  CLAIMS_INTAKE_DEMO_TENANT_CATALOG_ID,
  CLAIMS_INTAKE_DEMO_TENANT_NAME,
  CLAIMS_INTAKE_LATER_COMPARE_RUN_ID,
  CLAIMS_INTAKE_MANIFEST_ID,
  CLAIMS_INTAKE_POLICY_PACK_DETAIL_HREF,
  CLAIMS_INTAKE_PRIMARY_FINDING_ID,
  CLAIMS_INTAKE_PRIMARY_FINDING_TITLE,
  CLAIMS_INTAKE_PRIOR_COMPARE_RUN_ID,
  CLAIMS_INTAKE_SAMPLE_DEFINITION,
  CLAIMS_INTAKE_SAMPLE_RUN_ID,
} from "@/lib/samples/claims-intake/definition";
import {
  CUSTOMER_INTAKE_PRIMARY_FINDING_ID,
  CUSTOMER_INTAKE_SAMPLE_DEFINITION,
  CUSTOMER_INTAKE_SAMPLE_RUN_ID,
} from "@/lib/samples/customer-intake-modernization/definition";
import {
  buildAiKnowledgeAssistantShowcaseStaticPayload,
} from "@/lib/samples/ai-knowledge-assistant/static-showcase-payload";
import {
  AI_KNOWLEDGE_ASSISTANT_SAMPLE_DEFINITION,
} from "@/lib/samples/ai-knowledge-assistant/definition";
import {
  buildCustomerIntakeShowcaseStaticPayload,
  CUSTOMER_INTAKE_SHOWCASE_DECISION_ITEMS,
  CUSTOMER_INTAKE_SHOWCASE_DECISION_SYNOPSES,
  CUSTOMER_INTAKE_SHOWCASE_WARNING_SYNOPSES,
} from "@/lib/samples/customer-intake-modernization/static-showcase-payload";
import { resolveSampleScenarioByRunId } from "@/lib/samples/registry";
import {
  PRIMARY_SHOWCASE_PROOF_HREF,
  SECONDARY_CLAIMS_PROOF_HREF,
} from "@/lib/samples/sample-scenario-surface-alignment";

export const SHOWCASE_STATIC_DEMO_RUN_ID = CUSTOMER_INTAKE_SAMPLE_RUN_ID;

export const CANONICAL_ANONYMOUS_PROOF_HREF = PRIMARY_SHOWCASE_PROOF_HREF;

export { SECONDARY_CLAIMS_PROOF_HREF };

export const SHOWCASE_STATIC_DEMO_PRIOR_COMPARE_RUN_ID = CUSTOMER_INTAKE_SAMPLE_DEFINITION.priorCompareRunId;

export const SHOWCASE_STATIC_DEMO_LATER_COMPARE_RUN_ID = CUSTOMER_INTAKE_SAMPLE_DEFINITION.laterCompareRunId;

export const SHOWCASE_BUYER_REVIEW_TITLE = CUSTOMER_INTAKE_SAMPLE_DEFINITION.buyerReviewTitle;

export const SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE = CUSTOMER_INTAKE_SAMPLE_DEFINITION.buyerReviewPackageTitle;

export const SHOWCASE_STATIC_DEMO_MANIFEST_ID = CUSTOMER_INTAKE_SAMPLE_DEFINITION.manifestId;

export const SHOWCASE_STATIC_DEMO_POLICY_PACK_DETAIL_HREF = CUSTOMER_INTAKE_SAMPLE_DEFINITION.policyPackDetailHref;

export const SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID = CUSTOMER_INTAKE_SAMPLE_DEFINITION.primaryFindingId;

export const SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_TITLE = CUSTOMER_INTAKE_SAMPLE_DEFINITION.primaryFindingTitle;

export const SHOWCASE_DEMO_TENANT_NAME = CUSTOMER_INTAKE_SAMPLE_DEFINITION.tenantName;

export const SHOWCASE_DEMO_TENANT_CATALOG_ID = CUSTOMER_INTAKE_SAMPLE_DEFINITION.tenantCatalogId;

export { CUSTOMER_INTAKE_SAMPLE_RUN_ID };

/** Static provenance chains for showcase finding deep links when the API is unavailable. */
export const SHOWCASE_FINDING_PROVENANCE: Readonly<Record<string, FindingProvenance>> = {
  "phi-minimization-risk": {
    findingId: "phi-minimization-risk",
    steps: [
      {
        kind: "input",
        label: "Architecture brief",
        detail:
          "Claims Intake Modernization — brief describing data flow between intake portal and claims processor.",
      },
      {
        kind: "evidence",
        label: "Data flow identified",
        detail:
          "Patient demographics field detected in claims payload transmitted over internal API without field-level encryption.",
      },
      {
        kind: "policy-check",
        label: "HIPAA §164.312(a)(2)(iv) evaluated",
        detail:
          "Policy pack rule: PHI must be minimized at data boundary. Transmission includes date-of-birth and SSN fields not required by downstream processor.",
      },
      {
        kind: "conclusion",
        label: "High severity finding raised",
        detail:
          "Unnecessary PHI exposure at claims API boundary — recommend field-level stripping before transmission.",
      },
    ],
  },
  [CUSTOMER_INTAKE_PRIMARY_FINDING_ID]: {
    findingId: CUSTOMER_INTAKE_PRIMARY_FINDING_ID,
    steps: [
      {
        kind: "input",
        label: "Architecture brief",
        detail:
          "Enterprise Customer Intake Modernization — brief describing data flow between intake channels and fulfillment services.",
      },
      {
        kind: "evidence",
        label: "Data flow identified",
        detail:
          "Customer profile attributes detected in intake payload transmitted over internal API without field-level encryption.",
      },
      {
        kind: "policy-check",
        label: "Enterprise privacy minimization evaluated",
        detail:
          "Policy pack rule: sensitive customer data must be minimized at the intake boundary. Transmission includes optional profile fields not required by downstream fulfillment.",
      },
      {
        kind: "conclusion",
        label: "High severity finding raised",
        detail:
          "Unnecessary sensitive-data exposure at intake API boundary — recommend field-level stripping before transmission.",
      },
    ],
  },
};

/**
 * Canonical counts for the static Claims Intake demo spine — Run detail, manifest summary, and showcase should
 * reflect the same numbers when serving this payload (see {@link getShowcaseStaticDemoPayload}).
 */
export const SHOWCASE_STATIC_DEMO_SPINE_COUNTS = CUSTOMER_INTAKE_SAMPLE_DEFINITION.spineCounts;

/**
 * Sponsor-facing headline used only when **`usedStaticDemoRun`** serves the primary static payload —
 * illustrative until live `cost-actual.json` + `orphan-candidates.json` artifacts exist on tenants.
 */
export const SHOWCASE_STATIC_DEMO_ILLUSTRATIVE_ANNUALIZED_EXTRACTION_USD =
  CUSTOMER_INTAKE_SAMPLE_DEFINITION.illustrativeAnnualizedExtractionUsd;

/** Grouped decision bullets for manifest detail (synopses are {@link SHOWCASE_STATIC_DEMO_DECISION_SYNOPSES}). */
export type ShowcaseStaticDemoDecisionItem = IntakeShowcaseDecisionItem;

/**
 * Curated synopses for the static Claims Intake manifest detail page (no list API on summary).
 * Keep length aligned with `manifest.decisionCount` / `warningCount` in this payload.
 */
export const SHOWCASE_STATIC_DEMO_DECISION_ITEMS: readonly ShowcaseStaticDemoDecisionItem[] =
  CUSTOMER_INTAKE_SHOWCASE_DECISION_ITEMS;

export const SHOWCASE_STATIC_DEMO_DECISION_SYNOPSES: readonly string[] = CUSTOMER_INTAKE_SHOWCASE_DECISION_SYNOPSES;

/** Buyer “at a glance” counts aligned with the demo graph and audit sample. */
export const SHOWCASE_STATIC_DEMO_GRAPH_LINKED_RECORD_COUNT =
  CUSTOMER_INTAKE_SAMPLE_DEFINITION.graphLinkedRecordCount;

export const SHOWCASE_STATIC_DEMO_AUDIT_TRAIL_EVENT_COUNT =
  CUSTOMER_INTAKE_SAMPLE_DEFINITION.auditTrailEventCount;

/** Single curated warning matching `manifest.warningCount` for the static showcase. */
export const SHOWCASE_STATIC_DEMO_WARNING_SYNOPSES: readonly string[] = CUSTOMER_INTAKE_SHOWCASE_WARNING_SYNOPSES;

function buildClaimsIntakeShowcaseStaticPayload(urlRunId: string): DemoCommitPagePreviewResponse {
  return buildIntakeShowcaseStaticPayload({
    scenario: CLAIMS_INTAKE_SAMPLE_DEFINITION,
    urlRunId,
    demoStatusMessage: "Demonstration — sample healthcare intake scenario",
    operatorSummary:
      "Finalized architecture review for Claims Intake Modernization — integration boundaries, PHI handling posture, " +
      "and sponsor-facing KPIs consolidated for sign-off.",
    decisionItems: SHOWCASE_STATIC_DEMO_DECISION_ITEMS,
    warningSynopses: SHOWCASE_STATIC_DEMO_WARNING_SYNOPSES,
    runExplanationSummary: "Demonstration narrative for Claims Intake Modernization.",
    keyDrivers: [
      "PHI boundary and egress control parity across intake channels",
      "Auditability of intake-to-adjudication flow",
      "Latency under peak submission windows",
    ],
    riskImplications: [
      "PHI controls must remain consistent while throughput and channel parity improve.",
    ],
    costImplications: ["Ops touch reduction on intake rework."],
    complianceImplications: ["HIPAA-aligned logging and segregation of duties."],
    detailedNarrative:
      "This demonstration summarizes a stable, sponsor-reviewable modernization path for intake with clear " +
      "decisions, bounded risks, and evidence-backed recommendations.",
    themeSummaries: ["PHI handling", "Intake continuity", "Auditability", "Peak-load performance"],
    overallAssessment:
      "Proceed with claims intake modernization under monitored PHI minimization controls — no blocking findings remain open.",
    riskPosture: "Approved with monitoring",
    complianceGapCount: 1,
    graphSnapshotLabel: "Evidence graph — PHI minimization controls",
    contextSnapshotLabel: "Claims intake architecture brief — intake boundaries",
    primaryFindingConfidenceLevel: "High",
    primaryFindingEvaluationScore: 95,
    primaryFindingEvidenceRefCount: 3,
    sponsorBriefingArtifactName: "Sponsor briefing — Claims Intake Modernization.md",
    contextDiagramArtifactName: "Intake modernization context diagram.mmd",
  });
}

export function getShowcaseDecisionSynopsesForRunId(runId: string): readonly string[] {
  const scenario = resolveSampleScenarioByRunId(runId);

  if (scenario?.slug === CUSTOMER_INTAKE_SAMPLE_DEFINITION.slug) {
    return CUSTOMER_INTAKE_SHOWCASE_DECISION_SYNOPSES;
  }

  return SHOWCASE_STATIC_DEMO_DECISION_SYNOPSES;
}

export function getShowcaseWarningSynopsesForRunId(runId: string): readonly string[] {
  const scenario = resolveSampleScenarioByRunId(runId);

  if (scenario?.slug === CUSTOMER_INTAKE_SAMPLE_DEFINITION.slug) {
    return CUSTOMER_INTAKE_SHOWCASE_WARNING_SYNOPSES;
  }

  return SHOWCASE_STATIC_DEMO_WARNING_SYNOPSES;
}

export function getShowcaseDecisionItemsForRunId(runId: string): readonly ShowcaseStaticDemoDecisionItem[] {
  const scenario = resolveSampleScenarioByRunId(runId);

  if (scenario?.slug === CUSTOMER_INTAKE_SAMPLE_DEFINITION.slug) {
    return CUSTOMER_INTAKE_SHOWCASE_DECISION_ITEMS;
  }

  return SHOWCASE_STATIC_DEMO_DECISION_ITEMS;
}

/**
 * Read-only static payload for `/showcase/[reviewId]` when no preview API is configured,
 * or for mock API responses in E2E. `urlRunId` is echoed into `run.runId` so the URL and body stay aligned.
 */
export function getShowcaseStaticDemoPayload(urlRunId: string): DemoCommitPagePreviewResponse {
  const runId = urlRunId.trim().length > 0 ? urlRunId.trim() : SHOWCASE_STATIC_DEMO_RUN_ID;
  const scenario = resolveSampleScenarioByRunId(runId);

  if (scenario?.slug === CUSTOMER_INTAKE_SAMPLE_DEFINITION.slug) {
    return buildCustomerIntakeShowcaseStaticPayload(runId);
  }

  if (scenario?.slug === AI_KNOWLEDGE_ASSISTANT_SAMPLE_DEFINITION.slug) {
    return buildAiKnowledgeAssistantShowcaseStaticPayload(runId);
  }

  return buildClaimsIntakeShowcaseStaticPayload(runId);
}

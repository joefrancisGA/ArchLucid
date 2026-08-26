import { canonicalizeDemoRunId, isShowcaseCreatedStaticDemoRunId } from "@/lib/demo-run-canonical";
import { policyPackBuyerLabel } from "@/lib/policy/policy-pack-buyer-label";
import { SHOWCASE_HOME_AHA_MOMENT } from "@/lib/showcase-home-aha-moment";
import { CUSTOMER_INTAKE_RULE_SET_VERSION } from "@/lib/samples/customer-intake-modernization/definition";
import { resolveSampleScenarioByManifestId, resolveSampleScenarioByRunId } from "@/lib/samples/registry";
import { sampleScenarioPolicyPackLabel } from "@/lib/samples/policy-pack-presentation";
import type {
  RunDetailCriticalPageBundle,
  RunDetailWorkspaceContextBundle,
} from "@/lib/fetch-run-detail-page-bundle-client";
import {
  getShowcaseDecisionSynopsesForRunId,
  getShowcaseStaticDemoPayload,
  getShowcaseWarningSynopsesForRunId,
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
  SHOWCASE_STATIC_DEMO_SPINE_COUNTS,
} from "@/lib/showcase-static-demo";
import type { RunSummary } from "@/types/authority";
import type {
  ArtifactDescriptor,
  ManifestSummary,
  PipelineTimelineItem,
  RunDetail,
  RunDetailAgentResult,
} from "@/types/authority";
import type { RunExplanationSummary } from "@/types/explanation";
import type { FindingInspectPayload } from "@/types/finding-inspect";

import {
  getShowcaseCreatedStaticDemoPayload,
  SHOWCASE_CREATED_STATIC_DEMO_DECISION_SYNOPSES,
  SHOWCASE_CREATED_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_CREATED_STATIC_DEMO_PRIMARY_FINDING_ID,
  SHOWCASE_CREATED_STATIC_DEMO_RUN_ID,
  SHOWCASE_CREATED_STATIC_DEMO_WARNING_SYNOPSES,
} from "@/lib/showcase-created-static-demo";

import {
  isDemoRunIdEligibleForStaticFallback,
  isShowcaseSpineStaticPayloadActiveForManifest,
  isShowcaseSpineStaticPayloadActiveForRun,
} from "./eligibility";

export function buildStaticDemoPrimaryFindingInspectPayload(effectiveRunId: string): FindingInspectPayload {
  const d = getShowcaseStaticDemoPayload(effectiveRunId);
  const scenario = resolveSampleScenarioByRunId(effectiveRunId);
  const isCustomerIntake = scenario?.slug === "customer-intake";

  if (isCustomerIntake && scenario !== null) {
    return {
      findingId: scenario.primaryFindingId,
      typedPayload: {
        title: scenario.primaryFindingTitle,
        description:
          "Sensitive customer profile attributes cross the intake API boundary without field-level encryption required by downstream fulfillment services.",
        whyThisMatters:
          "Downstream fulfillment only needs work identifiers — transmitting optional profile attributes expands breach scope and audit exposure under enterprise privacy policy.",
        severity: "Warning",
        category: "Compliance",
        status: "Accepted with monitoring",
        impactedArea:
          "Intake sensitive-data boundary, adapters, OCR exception paths, and downstream fulfillment handoff",
      },
      decisionRuleId: "privacy.minimization.intake",
      decisionRuleName: "Sensitive-data minimization at intake",
      evidence: [
        {
          artifactId: "intake-subgraph-v2",
          lineRange: "142-168",
          excerpt:
            "Customer intake subgraph retains qualifying attachment metadata used for downstream fulfillment references.",
        },
        {
          artifactId: "ingress-classifier-spec",
          lineRange: "28-41",
          excerpt: "Ingress data-classification rules applied before adapter handoff with exception logging.",
        },
        {
          artifactId: "ocr-bypass-monitor",
          lineRange: "12-19",
          excerpt: "OCR bypass path emits volume alerts when unstructured attachment rate exceeds threshold.",
        },
      ],
      reasoningSummary:
        "This monitored risk was recorded because sensitive-data minimization at intake requires observable controls at ingress, adapter " +
        "boundaries, and OCR exception paths. Three evidence citations support the approval decision record.",
      recommendedActions: [
        "Validate ingress data-classification rules against production traffic patterns.",
        "Monitor unstructured attachment exception volumes weekly and escalate threshold breaches.",
        "Confirm OCR bypass handling alerts fire before volume thresholds and review after go-live.",
      ],
      auditRowId: "audit-customer-intake-privacy-001",
      runId: d.run.runId,
      manifestVersion: sampleScenarioPolicyPackLabel(scenario),
      confidenceLevel: "Medium",
      evaluationConfidenceScore: 0.78,
    };
  }

  return {
    findingId: scenario?.primaryFindingId ?? "phi-minimization-risk",
    typedPayload: {
      title: scenario?.primaryFindingTitle ?? "PHI Minimization Risk",
      description: SHOWCASE_HOME_AHA_MOMENT.finding,
      whyThisMatters: SHOWCASE_HOME_AHA_MOMENT.whyItMatters,
      severity: "Warning",
      category: "Compliance",
      status: "Accepted with monitoring",
      impactedArea: "Intake PHI boundary, adapters, OCR exception paths, and downstream adjudication handoff",
    },
    decisionRuleId: "phi.minimization.intake",
    decisionRuleName: "PHI minimization at intake",
    evidence: [
      {
        artifactId: "intake-subgraph-v2",
        lineRange: "142-168",
        excerpt:
          "Claims intake subgraph retains qualifying attachment metadata used for downstream adjudication references.",
      },
      {
        artifactId: "ingress-classifier-spec",
        lineRange: "28-41",
        excerpt: "Ingress PHI classification rules applied before adapter handoff with exception logging.",
      },
      {
        artifactId: "ocr-bypass-monitor",
        lineRange: "12-19",
        excerpt: "OCR bypass path emits volume alerts when unstructured attachment rate exceeds threshold.",
      },
    ],
    reasoningSummary:
      "This monitored risk was recorded because PHI minimization at intake requires observable controls at ingress, adapter " +
      "boundaries, and OCR exception paths. Three evidence citations support the approval decision record.",
    recommendedActions: [
      "Validate ingress PHI classification rules against production traffic patterns.",
      "Monitor unstructured attachment exception volumes weekly and escalate threshold breaches.",
      "Confirm OCR bypass handling alerts fire before volume thresholds and review after go-live.",
    ],
    auditRowId: "audit-claims-intake-phi-001",
    runId: d.run.runId,
    manifestVersion:
      scenario !== null
        ? sampleScenarioPolicyPackLabel(scenario)
        : policyPackBuyerLabel("enterprise-privacy-v2", d.manifest.ruleSetVersion ?? CUSTOMER_INTAKE_RULE_SET_VERSION),
    confidenceLevel: "Medium",
    evaluationConfidenceScore: 0.78,
  };
}

export function tryStaticDemoFindingInspect(runId: string, findingId: string): FindingInspectPayload | null {
  if (!isShowcaseSpineStaticPayloadActiveForRun(runId)) {
    return null;
  }

  const effectiveRunId = canonicalizeDemoRunId(runId);
  const fid = findingId.trim();

  if (isShowcaseCreatedStaticDemoRunId(effectiveRunId)) {
    const isKnownCreatedFinding =
      fid === SHOWCASE_CREATED_STATIC_DEMO_PRIMARY_FINDING_ID ||
      fid.startsWith(`${SHOWCASE_CREATED_STATIC_DEMO_PRIMARY_FINDING_ID}-`);

    if (!isKnownCreatedFinding) {
      return null;
    }

    if (!isDemoRunIdEligibleForStaticFallback(effectiveRunId)) {
      return null;
    }

    const d = getShowcaseCreatedStaticDemoPayload(effectiveRunId);

    return {
      findingId: fid,
      typedPayload: {
        title: "Private inference egress gap",
        description:
          "Interim dev subscriptions still allow managed public endpoints for playground refreshes before private link cutover.",
        whyThisMatters:
          "Workforce copilot traffic must not traverse public egress once pilot cohorts connect to production-classified corpora.",
        severity: "High",
        category: "Security",
        status: "Pending remediation",
        impactedArea: "Azure OpenAI, AI Search, orchestration spoke private DNS, and APIM egress policies",
      },
      decisionRuleId: "ai.private-link.inference",
      decisionRuleName: "Private inference plane",
      evidence: [
        {
          artifactId: "private-endpoint-diagram",
          lineRange: "12-28",
          excerpt: "Hub-spoke layout with private Azure OpenAI and AI Search endpoints from orchestration spoke.",
        },
        {
          artifactId: "copilot-architecture-brief",
          lineRange: "4-11",
          excerpt: "Guided intake requires private connectivity for inference and retrieval data planes.",
        },
      ],
      reasoningSummary:
        "This finding was recorded because the created review promises a private AI plane while interim dev paths may still expose managed public endpoints.",
      recommendedActions: [
        "Deny public network access on Azure OpenAI and AI Search resources.",
        "Validate private DNS zones resolve from orchestration spoke before workforce pilot.",
      ],
      auditRowId: "audit-northwind-copilot-private-link-001",
      runId: d.run.runId,
      manifestVersion: "AI LLM workload policy pack v1.2.0",
      confidenceLevel: "High",
      evaluationConfidenceScore: 0.92,
    };
  }

  // Accept exact match or slug-prefixed IDs (e.g. "phi-minimization-risk-<guid>") so that
  // real finding IDs with appended GUIDs still resolve to the curated demo payload.
  const scenario = resolveSampleScenarioByRunId(effectiveRunId);
  const primaryFindingId = scenario?.primaryFindingId ?? "phi-minimization-risk";
  const isKnownFinding = fid === primaryFindingId || fid.startsWith(`${primaryFindingId}-`);

  if (!isKnownFinding) {
    return null;
  }

  if (!isDemoRunIdEligibleForStaticFallback(effectiveRunId)) {
    return null;
  }

  const base = buildStaticDemoPrimaryFindingInspectPayload(effectiveRunId);

  // Align the returned findingId with the URL token so route-alignment checks in
  // loadFindingInspectForRoute and FindingInspectView both pass cleanly.
  return { ...base, findingId: fid };
}

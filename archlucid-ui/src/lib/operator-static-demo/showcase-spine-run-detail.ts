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

export function buildStaticDemoRunDetailFromShowcase(urlRunId: string): RunDetail {
  const d = getShowcaseStaticDemoPayload(urlRunId);
  const manifest = d.manifest;
  const chain = d.authorityChain;
  const scenario = resolveSampleScenarioByRunId(d.run.runId);
  const primaryFindingId = scenario?.primaryFindingId ?? "phi-minimization-risk";
  const decisionSynopses = getShowcaseDecisionSynopsesForRunId(d.run.runId);

  const quickDecisionFindings = (() => {
    const findings: NonNullable<RunDetailAgentResult["findings"]> = [
      {
        findingId: primaryFindingId,
        message: scenario?.primaryFindingTitle ?? "Sensitive data minimization risk",
        category: "Compliance",
        severity: "Error",
        reasoningTrace:
          "Confirm OCR bypass monitoring and alerting for unstructured attachment paths. Schedule sponsor + privacy review of exception volume before the next release train.",
      },
    ];

    for (let i = 0; i < 8; i++) {
      const synopsis = decisionSynopses[i];
      const title =
        typeof synopsis === "string" && synopsis.trim().length > 0 ? synopsis.trim() : `Architecture decision ${i + 2}`;

      findings.push({
        findingId: `${primaryFindingId}-${i + 2}`,
        message: title,
        category: "Architecture",
        severity: "Warning",
        reasoningTrace: "See finding detail for the decision context and evidence pointers.",
      });
    }

    return findings;
  })();

  return {
    executionFlavorBuyerSummary:
      "Finalized review with traceable evidence, recorded outcomes, and audit-ready deliverables.",
    agentExecutionLlmCostEstimate: {
      estimatedCostUsd: null,
      tokenCounts: { prompt: 0, completion: 0 },
      model: "AgentExecution:Simulator",
    },
    run: {
      runId: d.run.runId,
      projectId: d.run.projectId,
      description: d.run.description,
      createdUtc: d.run.createdUtc,
      contextSnapshotId: chain.contextSnapshotId ?? undefined,
      graphSnapshotId: chain.graphSnapshotId ?? undefined,
      findingsSnapshotId: chain.findingsSnapshotId ?? undefined,
      goldenManifestId: manifest.manifestId,
      decisionTraceId: chain.decisionTraceId ?? undefined,
      artifactBundleId: chain.artifactBundleId ?? undefined,
      structuralExecutionMode: "Simulator",
    },
    contextSnapshot: { demo: true },
    graphSnapshot: { demo: true },
    findingsSnapshot: { demo: true },
    decisionTrace: { demo: true },
    goldenManifest: { demo: true },
    artifactBundle: { demo: true },
    results: [
      {
        resultId: `${d.run.runId}-compliance-quick-decision`,
        taskId: `${d.run.runId}-compliance`,
        runId: d.run.runId,
        agentType: "Compliance",
        claims: [
          scenario?.slug === "customer-intake"
            ? "Sensitive-data minimization requires monitored exception routing and sponsor review before the next release train."
            : "PHI minimization requires monitored exception routing and sponsor review before the next release train.",
        ],
        evidenceRefs: [primaryFindingId],
        findings: quickDecisionFindings,
        confidence: 0.85,
      },
    ],
  };
}

/**
 * Manifest-shaped JSON for client-side Markdown export when static demo run detail uses a `goldenManifest` placeholder.
 */

export function tryStaticDemoGoldenManifestJsonForExport(runId: string): Record<string, unknown> | null {
  if (!isShowcaseSpineStaticPayloadActiveForRun(runId)) {
    return null;
  }

  const effectiveRunId = canonicalizeDemoRunId(runId);

  if (!isDemoRunIdEligibleForStaticFallback(effectiveRunId)) {
    return null;
  }

  if (isShowcaseCreatedStaticDemoRunId(effectiveRunId)) {
    const d = getShowcaseCreatedStaticDemoPayload(effectiveRunId);
    const manifest = d.manifest;

    return {
      manifestId: manifest.manifestId,
      runId: manifest.runId,
      createdUtc: manifest.createdUtc,
      manifestHash: manifest.manifestHash,
      ruleSetId: manifest.ruleSetId,
      ruleSetVersion: manifest.ruleSetVersion,
      metadata: {
        manifestVersion: `demo-${manifest.ruleSetVersion}`,
        changeDescription: manifest.operatorSummary,
      },
      assumptions: [],
      constraints: {
        mandatoryConstraints: [],
        preferences: [],
      },
      decisions: SHOWCASE_CREATED_STATIC_DEMO_DECISION_SYNOPSES.map((rationale: string, index: number) => ({
        decisionId: `northwind-copilot-decision-${index + 1}`,
        title: `Architecture decision ${index + 1}`,
        category: "Architecture",
        rationale,
      })),
      topology: {
        selectedPatterns: [
          "Private AI plane",
          "RAG retrieval with grounding",
          "Gateway content-safety hooks",
        ],
        resources: ["Azure API Management", "Azure OpenAI", "Azure AI Search"],
        services: [
          {
            serviceId: "svc-copilot-orchestrator",
            serviceName: "Chat orchestration worker",
            serviceType: 0,
            runtimePlatform: 0,
            purpose: "RAG retrieval and tool routing for workforce copilot sessions.",
          },
        ],
      },
      security: {
        controls: [],
        gaps: [...SHOWCASE_CREATED_STATIC_DEMO_WARNING_SYNOPSES],
      },
      warnings: [...SHOWCASE_CREATED_STATIC_DEMO_WARNING_SYNOPSES],
    };
  }

  const d = getShowcaseStaticDemoPayload(effectiveRunId);
  const manifest = d.manifest;
  const decisionSynopses = getShowcaseDecisionSynopsesForRunId(effectiveRunId);
  const warningSynopses = getShowcaseWarningSynopsesForRunId(effectiveRunId);
  const scenario = resolveSampleScenarioByRunId(effectiveRunId);
  const decisionPrefix = scenario?.slug === "customer-intake" ? "customer-intake-decision" : "claims-intake-decision";
  const topologyPatterns =
    scenario?.slug === "customer-intake"
      ? ["Event-driven intake", "Sensitive-data classification at boundary", "Bounded queues with back-pressure"]
      : ["Event-driven intake", "PHI classification at boundary", "Bounded queues with back-pressure"];
  const serviceName = scenario?.slug === "customer-intake" ? "Customer intake API" : "Claims intake API";

  return {
    manifestId: manifest.manifestId,
    runId: manifest.runId,
    createdUtc: manifest.createdUtc,
    manifestHash: manifest.manifestHash,
    ruleSetId: manifest.ruleSetId,
    ruleSetVersion: manifest.ruleSetVersion,
    metadata: {
      manifestVersion: `demo-${manifest.ruleSetVersion}`,
      changeDescription: manifest.operatorSummary,
    },
    assumptions: [],
    constraints: {
      mandatoryConstraints: [],
      preferences: [],
    },
    decisions: decisionSynopses.map((rationale: string, index: number) => ({
      decisionId: `${decisionPrefix}-${index + 1}`,
      title: `Architecture decision ${index + 1}`,
      category: "Architecture",
      rationale,
    })),
    topology: {
      selectedPatterns: topologyPatterns,
      resources: ["Azure API Management", "Azure Service Bus", "Azure Cosmos DB"],
      services: [
        {
          serviceId: "svc-intake-api",
          serviceName,
          serviceType: 0,
          runtimePlatform: 0,
          purpose: "HTTP ingress and orchestration for intake workloads.",
        },
      ],
    },
    security: {
      controls: [],
      gaps: [...warningSynopses],
    },
    warnings: [...warningSynopses],
  };
}

export function buildStaticDemoManifestSummaryFromShowcase(urlRunId: string): ManifestSummary {
  const d = getShowcaseStaticDemoPayload(urlRunId);
  const m = d.manifest;

  return {
    manifestId: m.manifestId,
    runId: m.runId,
    createdUtc: m.createdUtc,
    manifestHash: m.manifestHash,
    ruleSetId: m.ruleSetId,
    ruleSetVersion: m.ruleSetVersion,
    decisionCount: m.decisionCount,
    warningCount: m.warningCount,
    unresolvedIssueCount: m.unresolvedIssueCount,
    status: m.status,
    hasWarnings: m.warningCount > 0,
    hasUnresolvedIssues: m.unresolvedIssueCount > 0,
    operatorSummary: m.operatorSummary,
  };
}

export function buildStaticDemoManifestSummaryFromCreatedShowcase(urlRunId: string): ManifestSummary {
  const d = getShowcaseCreatedStaticDemoPayload(urlRunId);
  const m = d.manifest;

  return {
    manifestId: m.manifestId,
    runId: m.runId,
    createdUtc: m.createdUtc,
    manifestHash: m.manifestHash,
    ruleSetId: m.ruleSetId,
    ruleSetVersion: m.ruleSetVersion,
    decisionCount: m.decisionCount,
    warningCount: m.warningCount,
    unresolvedIssueCount: m.unresolvedIssueCount,
    status: m.status,
    hasWarnings: m.warningCount > 0,
    hasUnresolvedIssues: m.unresolvedIssueCount > 0,
    operatorSummary: m.operatorSummary,
  };
}

export function tryStaticDemoRunDetail(runId: string): RunDetail | null {
  if (!isShowcaseSpineStaticPayloadActiveForRun(runId)) {
    return null;
  }

  const effectiveRunId = canonicalizeDemoRunId(runId);

  if (!isDemoRunIdEligibleForStaticFallback(effectiveRunId)) {
    return null;
  }

  if (isShowcaseCreatedStaticDemoRunId(effectiveRunId)) {
    return buildStaticDemoRunDetailFromCreatedShowcase(effectiveRunId);
  }

  return buildStaticDemoRunDetailFromShowcase(effectiveRunId);
}

export function buildStaticDemoRunDetailFromCreatedShowcase(urlRunId: string): RunDetail {
  const d = getShowcaseCreatedStaticDemoPayload(urlRunId);
  const manifest = d.manifest;
  const chain = d.authorityChain;

  const quickDecisionFindings: NonNullable<RunDetailAgentResult["findings"]> = [
    {
      findingId: SHOWCASE_CREATED_STATIC_DEMO_PRIMARY_FINDING_ID,
      message: "Private inference egress gap",
      category: "Security",
      severity: "Error",
      reasoningTrace:
        "Deny public network access on Azure OpenAI and AI Search before workforce pilot; validate private DNS from orchestration spoke.",
    },
    ...SHOWCASE_CREATED_STATIC_DEMO_DECISION_SYNOPSES.slice(0, 3).map((synopsis, index) => ({
      findingId: `${SHOWCASE_CREATED_STATIC_DEMO_PRIMARY_FINDING_ID}-${index + 2}`,
      message: synopsis,
      category: "Architecture",
      severity: "Warning" as const,
      reasoningTrace: "See finding detail for the decision context and evidence pointers.",
    })),
  ];

  return {
    executionFlavorBuyerSummary:
      "Sample created review — findings, manifest, and export produced from guided intake without a separate review pass.",
    agentExecutionLlmCostEstimate: {
      estimatedCostUsd: null,
      tokenCounts: { prompt: 0, completion: 0 },
      model: "AgentExecution:Simulator",
    },
    run: {
      runId: d.run.runId,
      projectId: d.run.projectId,
      description: d.run.description,
      createdUtc: d.run.createdUtc,
      contextSnapshotId: chain.contextSnapshotId ?? undefined,
      graphSnapshotId: chain.graphSnapshotId ?? undefined,
      findingsSnapshotId: chain.findingsSnapshotId ?? undefined,
      goldenManifestId: manifest.manifestId,
      decisionTraceId: chain.decisionTraceId ?? undefined,
      artifactBundleId: chain.artifactBundleId ?? undefined,
      structuralExecutionMode: "Simulator",
    },
    contextSnapshot: { demo: true },
    graphSnapshot: { demo: true },
    findingsSnapshot: { demo: true },
    decisionTrace: { demo: true },
    goldenManifest: { demo: true },
    artifactBundle: { demo: true },
    results: [
      {
        resultId: `${d.run.runId}-compliance-quick-decision`,
        taskId: `${d.run.runId}-compliance`,
        runId: d.run.runId,
        agentType: "Compliance",
        claims: [
          "Private-link cutover and APIM content-safety attachment are tracked before internal pilot.",
        ],
        evidenceRefs: [SHOWCASE_CREATED_STATIC_DEMO_PRIMARY_FINDING_ID],
        findings: quickDecisionFindings,
        confidence: 0.86,
      },
    ],
  };
}

/** Curated hero finding for static demo when inspect API is unavailable (matches manifest deep links). */

export function tryStaticDemoManifestSummary(manifestId: string): ManifestSummary | null {
  const trimmed = manifestId.trim();

  if (trimmed === SHOWCASE_CREATED_STATIC_DEMO_MANIFEST_ID) {
    return buildStaticDemoManifestSummaryFromCreatedShowcase(SHOWCASE_CREATED_STATIC_DEMO_RUN_ID);
  }

  const scenarioByManifest = resolveSampleScenarioByManifestId(trimmed);

  if (scenarioByManifest !== null) {
    return buildStaticDemoManifestSummaryFromShowcase(scenarioByManifest.runId);
  }

  return null;
}

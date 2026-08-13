import { canonicalizeDemoRunId, isShowcaseCreatedStaticDemoRunId } from "@/lib/demo-run-canonical";
import { SHOWCASE_HOME_AHA_MOMENT } from "@/lib/showcase-home-aha-moment";
import { resolveSampleScenarioByManifestId, resolveSampleScenarioByRunId } from "@/lib/samples/registry";
import {
  getShowcaseDecisionSynopsesForRunId,
  getShowcaseStaticDemoPayload,
  getShowcaseWarningSynopsesForRunId,
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";
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
      "Finalized signed review with traceable evidence, governed outcomes, and audit-ready deliverables.",
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

export function buildStaticDemoPipelineTimelineFromShowcase(urlRunId: string): PipelineTimelineItem[] {
  const d = getShowcaseStaticDemoPayload(urlRunId);

  return d.pipelineTimeline.map((row) => ({
    eventId: row.eventId,
    occurredUtc: row.occurredUtc,
    eventType: row.eventType,
    actorUserName: row.actorUserName,
    correlationId: row.correlationId ?? undefined,
  }));
}

export function buildStaticDemoArtifactsFromShowcase(urlRunId: string): ArtifactDescriptor[] {
  const d = getShowcaseStaticDemoPayload(urlRunId);
  const manifestId = d.manifest.manifestId;
  const runId = d.run.runId;

  return d.artifacts.map((a) => ({
    artifactId: a.artifactId,
    artifactType: a.artifactType,
    name: a.name,
    format: a.format,
    createdUtc: a.createdUtc,
    contentHash: a.contentHash,
    manifestId,
    runId,
  }));
}

export function buildStaticDemoArtifactsFromCreatedShowcase(urlRunId: string): ArtifactDescriptor[] {
  const d = getShowcaseCreatedStaticDemoPayload(urlRunId);
  const manifestId = d.manifest.manifestId;
  const runId = d.run.runId;

  return d.artifacts.map((a) => ({
    artifactId: a.artifactId,
    artifactType: a.artifactType,
    name: a.name,
    format: a.format,
    createdUtc: a.createdUtc,
    contentHash: a.contentHash,
    manifestId,
    runId,
  }));
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

function buildStaticDemoRunDetailFromCreatedShowcase(urlRunId: string): RunDetail {
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
      "Born-governed created review — findings, manifest, and export produced from guided intake without a separate review pass.",
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
        "boundaries, and OCR exception paths. Three evidence citations support the governance decision record.",
      recommendedActions: [
        "Validate ingress data-classification rules against production traffic patterns.",
        "Monitor unstructured attachment exception volumes weekly and escalate threshold breaches.",
        "Confirm OCR bypass handling alerts fire before volume thresholds and review after go-live.",
      ],
      auditRowId: "audit-customer-intake-privacy-001",
      runId: d.run.runId,
      manifestVersion: "Enterprise Privacy Policy Pack v3.4.1",
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
      "boundaries, and OCR exception paths. Three evidence citations support the governance decision record.",
    recommendedActions: [
      "Validate ingress PHI classification rules against production traffic patterns.",
      "Monitor unstructured attachment exception volumes weekly and escalate threshold breaches.",
      "Confirm OCR bypass handling alerts fire before volume thresholds and review after go-live.",
    ],
    auditRowId: "audit-claims-intake-phi-001",
    runId: d.run.runId,
    manifestVersion: "Healthcare Claims Policy Pack v3.4.1",
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

export function tryStaticDemoManifestSummary(manifestId: string): ManifestSummary | null {
  if (!isShowcaseSpineStaticPayloadActiveForManifest(manifestId)) {
    return null;
  }

  if (manifestId === SHOWCASE_CREATED_STATIC_DEMO_MANIFEST_ID) {
    return buildStaticDemoManifestSummaryFromCreatedShowcase(SHOWCASE_CREATED_STATIC_DEMO_RUN_ID);
  }

  const scenarioByManifest = resolveSampleScenarioByManifestId(manifestId);

  if (scenarioByManifest !== null) {
    return buildStaticDemoManifestSummaryFromShowcase(scenarioByManifest.runId);
  }

  return buildStaticDemoManifestSummaryFromShowcase(SHOWCASE_STATIC_DEMO_RUN_ID);
}

export function tryStaticDemoPipelineTimeline(runId: string): PipelineTimelineItem[] | null {
  if (!isShowcaseSpineStaticPayloadActiveForRun(runId)) {
    return null;
  }

  const effectiveRunId = canonicalizeDemoRunId(runId);

  if (!isDemoRunIdEligibleForStaticFallback(effectiveRunId)) {
    return null;
  }

  if (isShowcaseCreatedStaticDemoRunId(effectiveRunId)) {
    const d = getShowcaseCreatedStaticDemoPayload(effectiveRunId);

    return d.pipelineTimeline.map((row) => ({
      eventId: row.eventId,
      occurredUtc: row.occurredUtc,
      eventType: row.eventType,
      actorUserName: row.actorUserName,
      correlationId: row.correlationId ?? undefined,
    }));
  }

  return buildStaticDemoPipelineTimelineFromShowcase(effectiveRunId);
}

export function tryStaticDemoArtifacts(runIdForPayload: string, manifestId: string): ArtifactDescriptor[] | null {
  if (!isShowcaseSpineStaticPayloadActiveForRun(runIdForPayload)) {
    return null;
  }

  const effectiveRunId = canonicalizeDemoRunId(runIdForPayload);

  if (manifestId === SHOWCASE_CREATED_STATIC_DEMO_MANIFEST_ID) {
    return buildStaticDemoArtifactsFromCreatedShowcase(effectiveRunId);
  }

  const scenarioByManifest = resolveSampleScenarioByManifestId(manifestId);

  if (scenarioByManifest !== null) {
    return buildStaticDemoArtifactsFromShowcase(scenarioByManifest.runId);
  }

  return null;
}

/** Static fallback for aggregate explanation when the explain API is unavailable (demo static operator mode). */
export function tryStaticDemoExplanationSummary(runId: string): RunExplanationSummary | null {
  if (!isShowcaseSpineStaticPayloadActiveForRun(runId)) {
    return null;
  }

  const effectiveRunId = canonicalizeDemoRunId(runId);

  if (!isDemoRunIdEligibleForStaticFallback(effectiveRunId)) {
    return null;
  }

  if (isShowcaseCreatedStaticDemoRunId(effectiveRunId)) {
    return getShowcaseCreatedStaticDemoPayload(effectiveRunId).runExplanation;
  }

  return getShowcaseStaticDemoPayload(effectiveRunId).runExplanation;
}

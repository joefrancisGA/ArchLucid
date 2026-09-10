import type { DemoCommitPagePreviewResponse } from "@/types/demo-preview";

import type { FindingProvenance } from "@/lib/api/finding-provenance";
import { DEV_SCOPE_PROJECT_ID } from "@/lib/scope";
import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";

/** Public slug for the approval-ready created package showcase. */
export const SHOWCASE_CREATED_STATIC_DEMO_RUN_ID = "northwind-copilot-rag-platform";

export const SHOWCASE_BUYER_CREATED_PACKAGE_TITLE = "Enterprise Copilot RAG Platform";

export const SHOWCASE_BUYER_CREATED_PACKAGE_PACKAGE_TITLE =
  "Enterprise Copilot RAG Platform — Created architecture review";

export const SHOWCASE_CREATED_STATIC_DEMO_MANIFEST_ID = "b7c8d9e0-f1a2-3456-7890-abcdcreated74201";

export const SHOWCASE_CREATED_STATIC_DEMO_PRIMARY_FINDING_ID = "private-inference-egress-gap";

export const SHOWCASE_CREATED_STATIC_DEMO_PRIMARY_FINDING_TITLE = "Private inference egress gap";

export const SHOWCASE_CREATED_DEMO_TENANT_NAME = "Enterprise AI Knowledge Assistant Showcase";

export const SHOWCASE_CREATED_STATIC_DEMO_SPINE_COUNTS = {
  findingCount: 4,
  warningCount: 1,
  decisionCount: 6,
} as const;

export const SHOWCASE_CREATED_STATIC_DEMO_DECISION_ITEMS = [
  { controlArea: "Integration", text: "APIM terminates TLS and enforces content-safety hooks before orchestration." },
  { controlArea: "Security", text: "Azure OpenAI and AI Search use private endpoints only — no public keys in clients." },
  { controlArea: "Responsible AI", text: "System prompts change through approved pipeline with emergency rollback path." },
  { controlArea: "Data handling", text: "Ingestion pipeline enforces PII redaction before documents enter the vector index." },
  { controlArea: "Responsible AI", text: "High-impact tool calls require human confirm gates; thin evidence is labeled." },
  { controlArea: "Auditability", text: "Redacted session audit logs retained per enterprise policy with correlation IDs." },
] as const;

export const SHOWCASE_CREATED_STATIC_DEMO_DECISION_SYNOPSES: readonly string[] =
  SHOWCASE_CREATED_STATIC_DEMO_DECISION_ITEMS.map((d) => d.text);

export const SHOWCASE_CREATED_STATIC_DEMO_WARNING_SYNOPSES: readonly string[] = [
  "Embedding batch jobs need budget alerts before full corpus refresh — illustrative FinOps hook only.",
];

export const SHOWCASE_CREATED_FINDING_PROVENANCE: Readonly<Record<string, FindingProvenance>> = {
  "private-inference-egress-gap": {
    findingId: "private-inference-egress-gap",
    steps: [
      {
        kind: "input",
        label: "Guided intake brief",
        detail:
          "Goals and constraints for an internal copilot with private Azure OpenAI and AI Search connectivity.",
      },
      {
        kind: "policy-check",
        label: "Private endpoint posture evaluated",
        detail:
          "Interim dev subscriptions still allow managed public endpoints for playground refreshes before private link cutover.",
      },
      {
        kind: "conclusion",
        label: "High severity finding raised",
        detail:
          "Inference path may traverse public egress — deny public network access before workforce pilot.",
      },
    ],
  },
};

const GENERATED_UTC = "2026-04-02T10:30:00.000Z";

/** Read-only static payload for the created-package showcase when the API is unavailable or unseeded. */
export function getShowcaseCreatedStaticDemoPayload(urlRunId: string): DemoCommitPagePreviewResponse {
  const runId =
    urlRunId.trim().length > 0 ? urlRunId.trim() : SHOWCASE_CREATED_STATIC_DEMO_RUN_ID;

  return {
    generatedUtc: GENERATED_UTC,
    isDemoData: true,
    demoStatusMessage: "Demonstration — finalized created architecture review",
    run: {
      runId,
      projectId: DEV_SCOPE_PROJECT_ID,
      description: SHOWCASE_BUYER_CREATED_PACKAGE_PACKAGE_TITLE,
      createdUtc: "2026-04-01T09:00:00.000Z",
    },
    manifest: {
      manifestId: SHOWCASE_CREATED_STATIC_DEMO_MANIFEST_ID,
      runId,
      createdUtc: "2026-04-02T14:20:00.000Z",
      manifestHash: "sha256-demo-created-8a41e2c0…",
      ruleSetId: "ai-llm-workload-v1",
      ruleSetVersion: "1.2.0",
      decisionCount: SHOWCASE_CREATED_STATIC_DEMO_SPINE_COUNTS.decisionCount,
      warningCount: SHOWCASE_CREATED_STATIC_DEMO_SPINE_COUNTS.warningCount,
      unresolvedIssueCount: 0,
      status: "Committed",
      operatorSummary:
        "Sample architecture review created from guided intake — APIM-fronted copilot, private RAG plane, " +
        "content-safety hooks, and explicit evidence limits where ArchLucid does not conclude.",
    },
    authorityChain: {
      contextSnapshotId: "ctx-created-sample-01",
      graphSnapshotId: "graph-created-sample-01",
      findingsSnapshotId: "find-created-sample-01",
      goldenManifestId: SHOWCASE_CREATED_STATIC_DEMO_MANIFEST_ID,
      decisionTraceId: "trace-created-sample-01",
      artifactBundleId: "bundle-created-sample-01",
    },
    artifacts: [
      {
        artifactId: "a1b2c3d4-e5f6-7890-abcd-ef1234567891",
        artifactType: "MarkdownReport",
        name: "Created package briefing — Enterprise Copilot.md",
        format: "text/markdown",
        createdUtc: "2026-04-02T14:22:00.000Z",
        contentHash: "sha256-demo-created-art-md",
      },
      {
        artifactId: "b2c3d4e5-f6a7-8901-bcde-f12345678902",
        artifactType: "JsonBundle",
        name: "Architecture decision record bundle.json",
        format: "application/json",
        createdUtc: "2026-04-02T14:22:05.000Z",
        contentHash: "sha256-demo-created-art-json",
      },
    ],
    pipelineTimeline: [
      {
        eventId: "evt-created-intake",
        occurredUtc: "2026-04-01T09:00:00.000Z",
        eventType: "RunStarted",
        actorUserName: "Alex Kim",
        correlationId: "corr-created-sample-intake",
      },
      {
        eventId: "evt-created-manifest",
        occurredUtc: "2026-04-02T14:20:00.000Z",
        eventType: "finalize.run",
        actorUserName: "ArchLucid system",
        correlationId: "corr-created-sample-manifest",
      },
    ],
    runExplanation: {
      explanation: {
        rawText: "",
        structured: null,
        confidence: null,
        provenance: null,
        summary: "Demonstration narrative for a finalized created copilot platform.",
        keyDrivers: [
          "Private connectivity for inference and retrieval",
          "Content safety and prompt policy",
          "Grounding vs speculation boundaries",
        ],
        riskImplications: [
          "Public egress on interim dev paths must close before workforce pilot.",
        ],
        costImplications: ["Illustrative FinOps bands for APIM, ACA, AI Search, and Azure OpenAI."],
        complianceImplications: ["Responsible-AI starter pack alignment — design intent only."],
        detailedNarrative:
          "This demonstration shows a finalized package produced from guided intake — findings, manifest, and export " +
          "without requiring a separate review workflow.",
      },
      themeSummaries: ["Private AI plane", "Content safety", "Prompt policy", "RAG grounding"],
      overallAssessment:
        "Proceed with internal pilot after private-link cutover and APIM content-safety attachment — no blocking unknowns remain undocumented.",
      riskPosture: "Approved with remediation items",
      findingCount: SHOWCASE_CREATED_STATIC_DEMO_SPINE_COUNTS.findingCount,
      decisionCount: SHOWCASE_CREATED_STATIC_DEMO_SPINE_COUNTS.decisionCount,
      unresolvedIssueCount: 0,
      complianceGapCount: 1,
      faithfulnessSupportRatio: null,
      deterministicFallbackUsed: false,
      faithfulnessWarning: null,
      findingTraceConfidences: [
        {
          findingId: SHOWCASE_CREATED_STATIC_DEMO_PRIMARY_FINDING_ID,
          findingTitle: SHOWCASE_CREATED_STATIC_DEMO_PRIMARY_FINDING_TITLE,
          confidenceLevel: "High",
          evaluationConfidenceScore: 92,
          evidenceRefCount: 2,
          traceConfidenceLabel: "High",
          traceCompletenessRatio: 0.9,
        },
      ],
      citations: [
        { kind: "Manifest", id: SHOWCASE_CREATED_STATIC_DEMO_MANIFEST_ID, label: SIGNED_MANIFEST_LABEL, runId },
        {
          kind: "GraphSnapshot",
          id: "graph-created-sample-01",
          label: "Evidence graph — private AI plane",
          runId,
        },
      ],
    },
  };
}

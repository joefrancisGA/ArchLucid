import type { DemoCommitPagePreviewResponse } from "@/types/demo-preview";

/** Public-marketing slug for demos and screenshots — no fixture-style token. */
export const SHOWCASE_STATIC_DEMO_RUN_ID = "claims-intake-modernization";

/** Stable buyer-facing name for review detail H1s, pickers, and breadcrumbs (matches marketing short form). */
export const SHOWCASE_BUYER_REVIEW_TITLE = "Claims Intake Modernization Review";

/**
 * Procurement-oriented label where “review package” wording is intentional (sample card headline, static demo
 * description, narrative hooks).
 */
export const SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE = "Claims Intake Modernization Review Package";

/** Canonical manifest UUID for the static showcase payload (matches operator mock + marketing body). */
export const SHOWCASE_STATIC_DEMO_MANIFEST_ID = "a1c2e3f4-a5b6-7890-abcd-ef1234567890";

/**
 * Governance deep link for the seeded Healthcare Claims demonstration pack (aligned with
 * {@link tryStaticDemoPolicyPacksList} in operator static demo).
 */
export const SHOWCASE_STATIC_DEMO_POLICY_PACK_DETAIL_HREF = "/governance/policy-packs/demo-healthcare-claims-pack";

/**
 * Deterministic finding id for deep links from manifest “Related findings” (aligned with demo narrative;
 * resolves when the API seeds this finding for the showcase run).
 */
export const SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID = "phi-minimization-risk";

/**
 * Canonical counts for the static Claims Intake demo spine — Run detail, manifest summary, and showcase should
 * reflect the same numbers when serving this payload (see {@link getShowcaseStaticDemoPayload}).
 */
export const SHOWCASE_STATIC_DEMO_SPINE_COUNTS = {
  findingCount: 9,
  warningCount: 1,
  decisionCount: 12,
} as const;

/**
 * Sponsor-facing headline used only when **`usedStaticDemoRun`** serves the Claims Intake static payload —
 * illustrative until live `cost-actual.json` + `orphan-candidates.json` artifacts exist on tenants.
 */
export const SHOWCASE_STATIC_DEMO_ILLUSTRATIVE_ANNUALIZED_EXTRACTION_USD = 94_360;

/** Grouped decision bullets for manifest detail (synopses are {@link SHOWCASE_STATIC_DEMO_DECISION_SYNOPSES}). */
export type ShowcaseStaticDemoDecisionItem = {
  readonly controlArea: string;
  readonly text: string;
};

/**
 * Curated synopses for the static Claims Intake manifest detail page (no list API on summary).
 * Keep length aligned with `manifest.decisionCount` / `warningCount` in this payload.
 */
export const SHOWCASE_STATIC_DEMO_DECISION_ITEMS: readonly ShowcaseStaticDemoDecisionItem[] = [
  { controlArea: "Integration", text: "Intake API remains system-of-record; channel adapters are stateless facades." },
  { controlArea: "PHI handling", text: "PHI is classified at ingress; audit lineage follows the member correlation ID." },
  { controlArea: "Performance", text: "Peak-load buffering uses bounded queues with explicit back-pressure to adjudication." },
  { controlArea: "Auditability", text: "Manual rework queues are capped; overflow routes to a supervised exception path." },
  { controlArea: "PHI handling", text: "Third-party OCR is optional; human confirm gates apply before downstream commit." },
  { controlArea: "Integration", text: "Adjudication handoff uses signed event envelopes with idempotent consumers." },
  { controlArea: "PHI handling", text: "Retention aligns to enterprise policy; cold paths avoid negotiable shorter windows." },
  { controlArea: "Auditability", text: "Observability spans intake latency, queue depth, and exception-rate SLOs." },
  { controlArea: "Auditability", text: "Disaster recovery favors replay-from-journal over dual-active intake writers." },
  { controlArea: "Integration", text: "Feature flags scope rollout by cohort; kill switches are tested each release." },
  { controlArea: "Auditability", text: "Data residency constraints are enforced at the storage account boundary." },
  { controlArea: "Sponsor evidence", text: "Sponsor KPI pack ties modernization outcomes to defensible operational metrics." },
];

export const SHOWCASE_STATIC_DEMO_DECISION_SYNOPSES: readonly string[] = SHOWCASE_STATIC_DEMO_DECISION_ITEMS.map(
  (d) => d.text,
);

/** Buyer “at a glance” counts aligned with the demo graph and audit sample. */
export const SHOWCASE_STATIC_DEMO_GRAPH_LINKED_RECORD_COUNT = 8;

export const SHOWCASE_STATIC_DEMO_AUDIT_TRAIL_EVENT_COUNT = 7;

/** Single curated warning matching `manifest.warningCount` for the static showcase. */
export const SHOWCASE_STATIC_DEMO_WARNING_SYNOPSES: readonly string[] = [
  "Unstructured intake attachments require weekly exception-volume monitoring to maintain PHI minimization coverage.",
];

const GENERATED_UTC = "2026-04-23T09:15:00.000Z";

/**
 * Read-only static payload for `/showcase/[runId]` when no preview API is configured,
 * or for mock API responses in E2E. `urlRunId` is echoed into `run.runId` so the URL and body stay aligned.
 */
export function getShowcaseStaticDemoPayload(urlRunId: string): DemoCommitPagePreviewResponse {
  const runId = urlRunId.trim().length > 0 ? urlRunId.trim() : SHOWCASE_STATIC_DEMO_RUN_ID;

  return {
    generatedUtc: GENERATED_UTC,
    isDemoData: true,
    demoStatusMessage: "Demonstration — sample healthcare intake scenario",
    run: {
      runId,
      projectId: "claims-intake-sample-workspace",
      description: SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE,
      createdUtc: "2026-01-10T09:15:22.000Z",
    },
    manifest: {
      manifestId: SHOWCASE_STATIC_DEMO_MANIFEST_ID,
      runId,
      createdUtc: "2026-01-14T22:08:41.000Z",
      manifestHash: "sha256-demo-7f91c4aab3…",
      ruleSetId: "healthcare-claims-v3",
      ruleSetVersion: "3.4.1",
      decisionCount: 12,
      warningCount: 1,
      unresolvedIssueCount: 0,
      status: "Committed",
      operatorSummary:
        "Finalized Architecture Manifest for Claims Intake Modernization — integration boundaries, PHI handling posture, " +
        "and sponsor-facing KPIs consolidated for sign-off.",
    },
    authorityChain: {
      contextSnapshotId: "ctx-snapshot-01",
      graphSnapshotId: "graph-snapshot-01",
      findingsSnapshotId: "find-snapshot-01",
      goldenManifestId: SHOWCASE_STATIC_DEMO_MANIFEST_ID,
      decisionTraceId: "trace-claims-01",
      artifactBundleId: "bundle-intake-demo-01",
    },
    artifacts: [
      {
        artifactId: "b2d4e6f8-a1c3-5e79-abcd-ef9876543210",
        artifactType: "MarkdownReport",
        name: "Sponsor briefing — Claims Intake Modernization.md",
        format: "text/markdown",
        createdUtc: "2026-01-14T22:10:05.000Z",
        contentHash: "sha256-demo-art-md",
      },
      // CostSummary → shared bucket: second audience table on the default executive tab in buyer shell.
      {
        artifactId: "e6f8394c-d8fa-9255-ef01-c45678901234",
        artifactType: "CostSummary",
        name: "Cost posture summary.json",
        format: "application/json",
        createdUtc: "2026-01-14T22:10:07.000Z",
        contentHash: "sha256-demo-art-cost",
      },
      {
        artifactId: "c3e5f709-b2d4-6f81-bcde-f12345678901",
        artifactType: "JsonBundle",
        name: "Architecture decision record bundle.json",
        format: "application/json",
        createdUtc: "2026-01-14T22:10:12.000Z",
        contentHash: "sha256-demo-art-json",
      },
      {
        artifactId: "d4f6181b-c5e7-7932-cdef-a23456789012",
        artifactType: "Diagram",
        name: "Intake modernization context diagram.mmd",
        format: "text/plain",
        createdUtc: "2026-01-14T22:10:20.000Z",
        contentHash: "sha256-demo-art-diagram",
      },
    ],
    pipelineTimeline: [
      {
        eventId: "evt-pipeline-request-created",
        occurredUtc: "2026-01-10T09:15:22.000Z",
        eventType: "RunStarted",
        actorUserName: "Jordan Lee",
        correlationId: "corr-intake-demo-request",
      },
      {
        eventId: "evt-pipeline-context",
        occurredUtc: "2026-01-13T16:22:41.000Z",
        eventType: "context.snapshot.created",
        actorUserName: "ArchLucid system",
        correlationId: "corr-intake-demo-ctx",
      },
      {
        eventId: "evt-pipeline-graph",
        occurredUtc: "2026-01-18T14:09:07.000Z",
        eventType: "graph.snapshot.created",
        actorUserName: "ArchLucid system",
        correlationId: "corr-intake-demo-graph",
      },
      {
        eventId: "evt-pipeline-findings",
        occurredUtc: "2026-01-24T11:41:53.000Z",
        eventType: "findings.snapshot.created",
        actorUserName: "ArchLucid system",
        correlationId: "corr-intake-demo-findings",
      },
      {
        eventId: "evt-pipeline-manifest-finalized",
        occurredUtc: "2026-01-31T21:52:06.000Z",
        eventType: "finalize.run",
        actorUserName: "Taylor Morgan",
        correlationId: "corr-intake-demo-manifest",
      },
      {
        eventId: "evt-pipeline-governance-approved",
        occurredUtc: "2026-02-02T17:30:00.000Z",
        eventType: "com.archlucid.governance.approval.recorded",
        actorUserName: "Jordan Lee",
        correlationId: "corr-intake-demo-governance",
      },
      {
        eventId: "evt-pipeline-bundle",
        occurredUtc: "2026-02-03T09:07:44.000Z",
        eventType: "artifact.bundle.created",
        actorUserName: "ArchLucid system",
        correlationId: "corr-intake-demo-bundle",
      },
    ],
    runExplanation: {
      explanation: {
        rawText: "",
        structured: null,
        confidence: null,
        provenance: null,
        summary: "Demonstration narrative for Claims Intake Modernization.",
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
      },
      themeSummaries: ["PHI handling", "Intake continuity", "Auditability", "Peak-load performance"],
      overallAssessment:
        "Proceed with claims intake modernization under monitored PHI minimization controls — no blocking findings remain open.",
      riskPosture: "Approved with monitoring",
      findingCount: 9,
      decisionCount: 12,
      unresolvedIssueCount: 0,
      complianceGapCount: 1,
      faithfulnessSupportRatio: null,
      deterministicFallbackUsed: false,
      faithfulnessWarning: null,
      findingTraceConfidences: null,
      citations: [
        { kind: "Manifest", id: SHOWCASE_STATIC_DEMO_MANIFEST_ID, label: "Signed manifest", runId },
        {
          kind: "GraphSnapshot",
          id: "graph-snapshot-01",
          label: "Evidence graph — PHI minimization controls",
          runId,
        },
        {
          kind: "ContextSnapshot",
          id: "ctx-snapshot-01",
          label: "Claims intake architecture brief — intake boundaries",
          runId,
        },
      ],
    },
  };
}

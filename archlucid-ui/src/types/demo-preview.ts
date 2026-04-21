import type { RunExplanationSummary } from "@/types/explanation";

/** Run header for marketing commit-page preview (`GET /v1/demo/preview`). */
export type DemoPreviewRun = {
  runId: string;
  projectId: string;
  description?: string | null;
  createdUtc: string;
};

export type DemoPreviewAuthorityChain = {
  contextSnapshotId?: string | null;
  graphSnapshotId?: string | null;
  findingsSnapshotId?: string | null;
  goldenManifestId?: string | null;
  decisionTraceId?: string | null;
  artifactBundleId?: string | null;
};

export type DemoPreviewManifestSummary = {
  manifestId: string;
  runId: string;
  createdUtc: string;
  manifestHash: string;
  ruleSetId: string;
  ruleSetVersion: string;
  decisionCount: number;
  warningCount: number;
  unresolvedIssueCount: number;
  status: string;
  hasWarnings?: boolean;
  hasUnresolvedIssues?: boolean;
  operatorSummary: string;
};

export type DemoPreviewArtifact = {
  artifactId: string;
  artifactType: string;
  name: string;
  format: string;
  createdUtc: string;
  contentHash: string;
};

export type DemoPreviewTimelineItem = {
  eventId: string;
  occurredUtc: string;
  eventType: string;
  actorUserName: string;
  correlationId?: string | null;
};

/** Bundled JSON for marketing `/demo/preview` (mirrors `DemoCommitPagePreviewResponse`). */
export type DemoCommitPagePreviewResponse = {
  generatedUtc: string;
  isDemoData: boolean;
  demoStatusMessage: string;
  run: DemoPreviewRun;
  manifest: DemoPreviewManifestSummary;
  authorityChain: DemoPreviewAuthorityChain;
  artifacts: DemoPreviewArtifact[];
  pipelineTimeline: DemoPreviewTimelineItem[];
  runExplanation: RunExplanationSummary;
};

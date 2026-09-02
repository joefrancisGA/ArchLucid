import type { components } from "@/lib/openapi-schemas";
import type { RunExplanationSummary } from "@/types/explanation";

/** Run header for marketing commit-page preview (`GET /v1/demo/preview`). */
export type DemoPreviewRun = components["schemas"]["DemoPreviewRun"];

export type DemoPreviewAuthorityChain = components["schemas"]["DemoPreviewAuthorityChain"];

export type DemoPreviewManifestSummary = components["schemas"]["DemoPreviewManifestSummary"];

export type DemoPreviewArtifact = components["schemas"]["DemoPreviewArtifact"];

export type DemoPreviewTimelineItem = components["schemas"]["DemoPreviewTimelineItem"];

type DemoCommitPagePreviewResponseSchema = components["schemas"]["DemoCommitPagePreviewResponse"];

/** Bundled JSON for marketing `/demo/preview` (mirrors `DemoCommitPagePreviewResponse`). */
export type DemoCommitPagePreviewResponse = Omit<DemoCommitPagePreviewResponseSchema, "runExplanation"> & {
  runExplanation: RunExplanationSummary;
};

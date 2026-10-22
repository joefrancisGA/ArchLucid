import type { DemoCommitPagePreviewResponse } from "@/types/demo-preview";

import { getShowcaseCreatedStaticDemoPayload } from "@/lib/showcase-created-static-demo";

/** Static showcase payload for the AI Knowledge Assistant created sample (TB-982). */
export function buildAiKnowledgeAssistantShowcaseStaticPayload(urlRunId: string): DemoCommitPagePreviewResponse {
  return getShowcaseCreatedStaticDemoPayload(urlRunId);
}

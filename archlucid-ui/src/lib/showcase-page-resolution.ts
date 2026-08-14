import { AI_KNOWLEDGE_ASSISTANT_SAMPLE_RUN_ID } from "@/lib/samples/ai-knowledge-assistant/definition";
import { CUSTOMER_INTAKE_SAMPLE_RUN_ID } from "@/lib/samples/customer-intake-modernization/definition";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

/** Curated showcase slugs that must render static-first without blocking on marketing API. */
export const SHOWCASE_STATIC_FIRST_RUN_IDS = new Set<string>([
  SHOWCASE_STATIC_DEMO_RUN_ID,
  CUSTOMER_INTAKE_SAMPLE_RUN_ID,
  AI_KNOWLEDGE_ASSISTANT_SAMPLE_RUN_ID,
]);

export function decodeShowcaseRunId(runId: string): string {
  try {
    return decodeURIComponent(runId).trim();
  } catch {
    return runId.trim();
  }
}

export function isShowcaseStaticFirstRunId(runId: string): boolean {
  return SHOWCASE_STATIC_FIRST_RUN_IDS.has(decodeShowcaseRunId(runId));
}

export function hasCuratedShowcaseStaticPayload(runId: string): boolean {
  return isShowcaseStaticFirstRunId(runId);
}

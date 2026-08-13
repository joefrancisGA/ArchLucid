import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { getRunExplanationSummary } from "@/lib/api";
import { tryStaticDemoExplanationSummary } from "@/lib/operator/operator-static-demo";
import type { RunExplanationSummary } from "@/types/explanation";

export type RunDetailExplanationLoadResult = {
  readonly summary: RunExplanationSummary | null;
  readonly failure: ApiLoadFailureState | null;
};

/** Loads aggregate explanation summary for run detail (deferred off first-screen SSR). */
export async function loadRunDetailExplanationSummary(
  runId: string,
  options?: { readonly scopeHeaders?: Record<string, string> },
): Promise<RunDetailExplanationLoadResult> {
  try {
    const summary = await getRunExplanationSummary(runId, options);

    return { summary, failure: null };
  } catch (e) {
    const staticExplanation = tryStaticDemoExplanationSummary(runId);

    if (staticExplanation !== null) {
      return { summary: staticExplanation, failure: null };
    }

    return { summary: null, failure: toApiLoadFailure(e) };
  }
}

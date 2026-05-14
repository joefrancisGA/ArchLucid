import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";

/** LLM cost reporting payloads stay client-fetched behind OperatorNavAuthority; server aligns demo routing only. */
export type CostReportingSettingsPageServerLoad = {
  readonly demo: boolean;
};

export async function loadCostReportingSettingsPageData(): Promise<CostReportingSettingsPageServerLoad> {
  const demo = isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled();

  return { demo };
}

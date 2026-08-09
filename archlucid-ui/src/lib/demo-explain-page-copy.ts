import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import { formatIsoUtcForDisplay } from "@/lib/format-iso-utc";

export const DEMO_EXPLAIN_STATUS_BANNER_TECHNICAL_DETAILS_LABEL = "Technical details";

export const DEMO_EXPLAIN_REVIEW_ID_LABEL = "Review ID";

export const DEMO_EXPLAIN_MANIFEST_VERSION_LABEL = "Manifest version";

export const DEMO_EXPLAIN_GENERATED_ISO_LABEL = "Generated (UTC)";

export const DEMO_EXPLAIN_GENERATED_PREFIX = "Generated";

export const DEMO_EXPLAIN_ILLUSTRATIVE_SAMPLE_LABEL = "Illustrative sample";

export type DemoExplainStatusTag = {
  readonly kind: EnterpriseStatusKind;
  readonly label: string;
};

/** Human-readable generated time for the default banner line — not raw ISO. */
export function formatDemoExplainGeneratedLabel(generatedUtc: string): string {
  return `${DEMO_EXPLAIN_GENERATED_PREFIX} ${formatIsoUtcForDisplay(generatedUtc)}`;
}

/** Maps demo payload flags to enterprise status metadata — never mislabels manifest version as a review. */
export function resolveDemoExplainStatusTag(isDemoData: boolean, demoStatusMessage: string): DemoExplainStatusTag {
  const trimmedMessage = demoStatusMessage.trim();

  if (trimmedMessage.length > 0) {
    return {
      kind: isDemoData ? "draft" : "ready",
      label: trimmedMessage,
    };
  }

  if (isDemoData) {
    return { kind: "draft", label: DEMO_EXPLAIN_ILLUSTRATIVE_SAMPLE_LABEL };
  }

  return { kind: "ready", label: "Ready" };
}

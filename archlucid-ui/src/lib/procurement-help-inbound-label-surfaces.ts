import { PROCUREMENT_HELP_TOPIC_LABEL } from "@/lib/procurement-help-evidence-copy";

/** TB-2273 — product chrome must open canonical `/help/procurement`, not retired buyer overview aliases. */
export const PROCUREMENT_HELP_INBOUND_PATH_LABELS: Readonly<Record<string, string>> = {
  "/help/procurement": PROCUREMENT_HELP_TOPIC_LABEL,
} as const;

export const PROCUREMENT_HELP_INBOUND_LABEL_SOURCE_FILES: readonly string[] = [
  "src/lib/usability/page-help-topic-map.ts",
  "src/lib/enterprise-onboarding-hub-steps.ts",
  "src/lib/subprocessors-help-evidence-copy.ts",
  "src/lib/in-app-doc-href.ts",
  "src/components/reviews/RunDetailDeferredScopeNotice.tsx",
  "src/app/(operator)/integrations/cloud-connections/_sections/tier2-connection-wizard-content.ts",
] as const;

export const PROCUREMENT_HELP_CANONICAL_HELP_HREF = "/help/procurement" as const;

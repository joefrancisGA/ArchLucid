/**
 * Maps operator routes to in-app `/help/{slug}` topics for contextual help buttons.
 * Row data lives in page-help-topic-rows.ts so this file stays lookup-only.
 */

import { canonicalizeLegacyOperatorRoutePath } from "@/lib/canonicalize-legacy-operator-route-path";
import { ARCHITECTURES_LIST_PATH } from "@/lib/architecture/architecture-routes";
import {
  FINDING_EVIDENCE_TRACE_HELP_TOPIC_LABEL,
  pathIsFindingEvidenceTrace,
} from "@/lib/evidence-trace-contextual-help";
import { SETTINGS_HUB_HELP_TOPIC_LABEL } from "@/lib/contextual-help/administration-rows";
import { PROVENANCE_HELP_TOPIC, pathIsRunProvenance } from "@/lib/provenance-evidence-copy";
import { pathIsSettingsHubRoot } from "@/lib/settings-admin-route-paths";
import {
  ARTIFACT_PREVIEW_HELP_TOPIC,
  PAGE_HELP_TOPICS,
  type PageHelpTopic,
} from "@/lib/usability/page-help-topic-rows";

export type { PageHelpTopic } from "@/lib/usability/page-help-topic-rows";
export { listPageHelpTopicSlugs } from "@/lib/usability/page-help-topic-rows";

/** First-run / onboarding / help-topic paths allowed to keep generic `getting-started` Learn more. */
export const PAGE_HELP_FIRST_RUN_GENERIC_LEARN_MORE_ALLOWLIST_PREFIXES = [
  "/architecture/first-review-guide",
  "/help/getting-started",
  ARCHITECTURES_LIST_PATH,
  "/architectures",
  "/help",
  /** Learning proof page — product orientation via getting-started anchor. */
  "/why-archlucid",
] as const;

/** True on in-app `/help` topic pages — contextual help chrome would only link back to the same article. */
export function pathnameIsInAppHelpTopic(pathname: string): boolean {
  const rawPath = (pathname ?? "").split("?")[0] ?? "";
  const path = (canonicalizeLegacyOperatorRoutePath(rawPath).split("?")[0] ?? rawPath).trim() || "/";

  return path === "/help" || path.startsWith("/help/");
}

export function pageHelpTopicForPathname(pathname: string): PageHelpTopic | null {
  const rawPath = (pathname ?? "").split("?")[0] ?? "";
  const path = (canonicalizeLegacyOperatorRoutePath(rawPath).split("?")[0] ?? rawPath).trim() || "/";

  if (path.includes("/artifacts/")) {
    return ARTIFACT_PREVIEW_HELP_TOPIC;
  }

  if (pathIsRunProvenance(path)) {
    return PROVENANCE_HELP_TOPIC;
  }

  if (pathIsFindingEvidenceTrace(path)) {
    return { slug: "findings", label: FINDING_EVIDENCE_TRACE_HELP_TOPIC_LABEL };
  }

  if (path === "/") {
    return PAGE_HELP_TOPICS.find((row) => row.prefix === "/")?.topic ?? null;
  }

  // Exact Settings hub only — must not use prefix startsWith or `/administration/*` children inherit this topic.
  if (pathIsSettingsHubRoot(path)) {
    return { label: SETTINGS_HUB_HELP_TOPIC_LABEL };
  }

  const sorted = [...PAGE_HELP_TOPICS].sort((left, right) => right.prefix.length - left.prefix.length);

  for (const row of sorted) {
    if (row.prefix === "/") {
      continue;
    }

    if (path === row.prefix || path.startsWith(`${row.prefix}/`)) {
      return row.topic;
    }
  }

  return null;
}

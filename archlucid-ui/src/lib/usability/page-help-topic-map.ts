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
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import {
  REVIEW_WORKSPACE_HELP_TOPIC,
  pathIsReviewWorkspaceDetail,
} from "@/lib/review-workspace-evidence-copy";
import { pathIsSettingsHubRoot } from "@/lib/settings-admin-route-paths";
import {
  ARTIFACT_PREVIEW_HELP_TOPIC,
  PAGE_HELP_TOPICS,
  type PageHelpTopic,
} from "@/lib/usability/page-help-topic-rows";
import {
  PAGE_HELP_TOPIC_ROWS_OPERATOR_SECURITY,
  type PageHelpTopicRow,
} from "@/lib/usability/page-help-topic-rows-operator-security";

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

function normalizePageHelpPathname(pathname: string): string {
  const rawPath = (pathname ?? "").split("?")[0] ?? "";

  return (canonicalizeLegacyOperatorRoutePath(rawPath).split("?")[0] ?? rawPath).trim() || "/";
}

function mergedPageHelpTopicRows(productLineId?: ProductLineId): readonly PageHelpTopicRow[] {
  if (productLineId !== "security") {
    return PAGE_HELP_TOPICS;
  }

  const byPrefix = new Map<string, PageHelpTopicRow>();

  for (const row of PAGE_HELP_TOPICS) {
    byPrefix.set(row.prefix, row);
  }

  for (const row of PAGE_HELP_TOPIC_ROWS_OPERATOR_SECURITY) {
    byPrefix.set(row.prefix, row);
  }

  return [...byPrefix.values()];
}

function pathMatchesPageHelpTopicRow(path: string, row: PageHelpTopicRow): boolean {
  if (row.prefix === "/") {
    return path === "/";
  }

  if (row.exactMatchOnly === true) {
    return path === row.prefix;
  }

  if (row.prefix.length > 1 && row.prefix.endsWith("/")) {
    return path.startsWith(row.prefix);
  }

  return path === row.prefix || path.startsWith(`${row.prefix}/`);
}

/** True on in-app `/help` topic pages — contextual help chrome would only link back to the same article. */
export function pathnameIsInAppHelpTopic(pathname: string): boolean {
  const path = normalizePageHelpPathname(pathname);

  return path === "/help" || path.startsWith("/help/");
}

export function pageHelpTopicForPathname(pathname: string, productLineId?: ProductLineId): PageHelpTopic | null {
  const path = normalizePageHelpPathname(pathname);

  if (path.includes("/artifacts/")) {
    return ARTIFACT_PREVIEW_HELP_TOPIC;
  }

  if (pathIsRunProvenance(path)) {
    return PROVENANCE_HELP_TOPIC;
  }

  if (pathIsReviewWorkspaceDetail(path)) {
    return REVIEW_WORKSPACE_HELP_TOPIC;
  }

  if (pathIsFindingEvidenceTrace(path)) {
    return { slug: "findings", label: FINDING_EVIDENCE_TRACE_HELP_TOPIC_LABEL };
  }

  if (path === "/") {
    const homeRow = mergedPageHelpTopicRows(productLineId).find((row) => row.prefix === "/");

    return homeRow?.topic ?? null;
  }

  // Exact Settings hub only — must not use prefix startsWith or `/administration/*` children inherit this topic.
  if (pathIsSettingsHubRoot(path)) {
    return { label: SETTINGS_HUB_HELP_TOPIC_LABEL };
  }

  const sorted = [...mergedPageHelpTopicRows(productLineId)].sort(
    (left, right) => right.prefix.length - left.prefix.length,
  );

  for (const row of sorted) {
    if (row.prefix === "/") {
      continue;
    }

    if (pathMatchesPageHelpTopicRow(path, row)) {
      return row.topic;
    }
  }

  return null;
}

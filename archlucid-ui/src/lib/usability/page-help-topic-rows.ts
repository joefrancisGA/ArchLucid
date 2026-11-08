/**
 * Operator route prefixes and inbound labels for contextual help.
 * Lookup lives in page-help-topic-map.ts so this file stays a data leaf.
 */

import { REVIEW_ARTIFACTS_HELP_TOPIC_LABEL } from "@/lib/review-artifacts-evidence-copy";
import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor/sponsor-dashboard-route";

import { PAGE_HELP_TOPIC_ROWS_ADMIN } from "./page-help-topic-rows-admin";
import { PAGE_HELP_TOPIC_ROWS_OPERATOR, type PageHelpTopic, type PageHelpTopicRow } from "./page-help-topic-rows-operator";

export type { PageHelpTopic, PageHelpTopicRow };

/** Canonical operator route prefix for sponsor dashboard contextual help (see `page-help-topic-rows-operator-pilot.ts`). */
export const SPONSOR_DASHBOARD_CONTEXT_HELP_ROUTE_PREFIX = SPONSOR_DASHBOARD_HREF;

export const PAGE_HELP_TOPICS: readonly PageHelpTopicRow[] = [
  ...PAGE_HELP_TOPIC_ROWS_OPERATOR,
  ...PAGE_HELP_TOPIC_ROWS_ADMIN,
];

export const ARTIFACT_PREVIEW_HELP_TOPIC: PageHelpTopic = {
  slug: "review-artifacts",
  label: REVIEW_ARTIFACTS_HELP_TOPIC_LABEL,
};

export function listPageHelpTopicSlugs(): readonly string[] {
  const slugs: string[] = [];

  for (const row of PAGE_HELP_TOPICS) {
    const slug = row.topic.slug;

    if (slug !== undefined && slug.length > 0) {
      slugs.push(slug);
    }
  }

  if (ARTIFACT_PREVIEW_HELP_TOPIC.slug !== undefined && ARTIFACT_PREVIEW_HELP_TOPIC.slug.length > 0) {
    slugs.push(ARTIFACT_PREVIEW_HELP_TOPIC.slug);
  }

  return slugs;
}

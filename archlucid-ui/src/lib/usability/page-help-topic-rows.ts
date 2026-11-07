/**
 * Operator route prefixes and inbound labels for contextual help.
 * Lookup lives in page-help-topic-map.ts so this file stays a data leaf.
 */

import { CONFIGURATION_REFERENCE_HELP_TOPIC_LABEL } from "@/lib/configuration-reference-help-guide-content";
import { REVIEW_ARTIFACTS_HELP_TOPIC_LABEL } from "@/lib/review-artifacts-evidence-copy";
import { SPONSOR_REPORT_HELP_TOPIC_LABEL } from "@/lib/sponsor/sponsor-report-help-evidence-copy";

import { PAGE_HELP_TOPIC_ROWS_ADMIN } from "./page-help-topic-rows-admin";
import { PAGE_HELP_TOPIC_ROWS_OPERATOR, type PageHelpTopic, type PageHelpTopicRow } from "./page-help-topic-rows-operator";

export type { PageHelpTopic, PageHelpTopicRow };

export const PAGE_HELP_TOPICS: readonly PageHelpTopicRow[] = [
  ...PAGE_HELP_TOPIC_ROWS_OPERATOR,
  ...PAGE_HELP_TOPIC_ROWS_ADMIN,
];

export const ARTIFACT_PREVIEW_HELP_TOPIC: PageHelpTopic = {
  slug: "review-artifacts",
  label: REVIEW_ARTIFACTS_HELP_TOPIC_LABEL,
};

/**
 * Drift anchors — string presence checked by configuration-reference and sponsor-report inbound
 * help label tests (TB-2270 / TB-1690).
 */
const PAGE_HELP_TOPIC_INBOUND_LABEL_MARKERS = {
  CONFIGURATION_REFERENCE_HELP_TOPIC_LABEL,
  SPONSOR_REPORT_HELP_TOPIC_LABEL,
} as const;

void PAGE_HELP_TOPIC_INBOUND_LABEL_MARKERS;

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

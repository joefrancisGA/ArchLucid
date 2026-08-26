/**
 * Operator route prefixes and inbound labels for contextual help.
 * Lookup lives in page-help-topic-map.ts so this file stays a data leaf.
 */

import { REVIEW_ARTIFACTS_HELP_TOPIC_LABEL } from "@/lib/review-artifacts-evidence-copy";

import { PAGE_HELP_TOPIC_ROWS_ADMIN } from "./page-help-topic-rows-admin";
import { PAGE_HELP_TOPIC_ROWS_OPERATOR, type PageHelpTopic } from "./page-help-topic-rows-operator";

export type { PageHelpTopic };

export const PAGE_HELP_TOPICS: readonly { prefix: string; topic: PageHelpTopic }[] = [
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

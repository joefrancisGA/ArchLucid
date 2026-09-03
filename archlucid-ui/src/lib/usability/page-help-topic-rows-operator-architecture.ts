/** Architecture workspace, reviews, and evidence contextual help rows. */

import { ARCHITECTURES_NEW_HELP_TOPIC_LABEL } from "@/lib/architectures-new-evidence-copy";
import { ARCHITECTURES_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { ARCHITECTURE_DRAFTS_HELP_TOPIC_LABEL } from "@/lib/architecture-drafts-evidence-copy";
import { ARCHITECTURE_INTELLIGENCE_HELP_TOPIC_LABEL } from "@/lib/architecture/architecture-intelligence-evidence-copy";
import { ARCHITECTURE_DRAFTS_LIST_LABEL, START_REVIEW_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { COMPARISON_REPLAY_HELP_TOPIC_LABEL } from "@/lib/comparison-replay-help-evidence-copy";
import { DEMO_EXPLAIN_HELP_TOPIC_LABEL } from "@/lib/demo-explain-evidence-copy";
import { EVIDENCE_GRAPH_HELP_TOPIC_LABEL } from "@/lib/evidence-graph-evidence-copy";
import { EVIDENCE_PROPOSALS_HELP_TOPIC_LABEL } from "@/lib/evidence-proposals-evidence-copy";
import { INTERNAL_REPLAY_PATH } from "@/lib/internal-ops-route-paths";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { PRIOR_MANIFEST_RETRIEVAL_HELP_TOPIC_LABEL } from "@/lib/prior-manifest-retrieval-help-evidence-copy";
import { REVIEW_PACKAGES_HELP_INBOUND_LABEL } from "@/lib/review-packages-help-title-honesty-surfaces";
import { SEARCH_REVIEW_EVIDENCE_HELP_TOPIC_LABEL } from "@/lib/search-review-evidence-evidence-copy";
import { SIGNED_RECORDS_LIST_HELP_TOPIC_LABEL } from "@/lib/signed-records-list-evidence-copy";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";

import type { PageHelpTopic } from "./page-help-topic-rows-operator";

export const PAGE_HELP_TOPIC_ROWS_OPERATOR_ARCHITECTURE: readonly { prefix: string; topic: PageHelpTopic }[] = [
  {
    prefix: "/",
    topic: { slug: "first-architecture-review", label: OPERATOR_NAV_LINK_LABELS.home },
  },
  { prefix: ARCHITECTURES_LIST_PATH, topic: { slug: "architecture-drafts", label: ARCHITECTURE_DRAFTS_LIST_LABEL } },
  { prefix: "/architecture/architectures/new", topic: { slug: "structured-brief", label: ARCHITECTURES_NEW_HELP_TOPIC_LABEL } },
  {
    prefix: "/architecture/architecture-intelligence",
    topic: { slug: "architecture-intelligence", label: ARCHITECTURE_INTELLIGENCE_HELP_TOPIC_LABEL },
  },
  { prefix: "/architectures", topic: { slug: "architecture-drafts", label: ARCHITECTURE_DRAFTS_LIST_LABEL } },
  { prefix: "/architecture/reviews/new", topic: { slug: "evidence-intake", label: START_REVIEW_LABEL } },
  { prefix: "/architecture/reviews", topic: { slug: "review-packages", label: REVIEW_PACKAGES_HELP_INBOUND_LABEL } },
  {
    prefix: SIGNED_RECORDS_LIST_PATH,
    topic: { slug: "review-packages", label: SIGNED_RECORDS_LIST_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/insights/ask-review-questions",
    topic: { slug: "prior-manifest-retrieval", label: PRIOR_MANIFEST_RETRIEVAL_HELP_TOPIC_LABEL },
  },
  { prefix: "/insights/evidence-graph", topic: { slug: "evidence-graph", label: EVIDENCE_GRAPH_HELP_TOPIC_LABEL } },
  {
    prefix: "/insights/search-review-evidence",
    topic: { slug: "search-review-evidence", label: SEARCH_REVIEW_EVIDENCE_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/insights/compare-two-reviews",
    topic: { slug: "comparison-replay", label: COMPARISON_REPLAY_HELP_TOPIC_LABEL },
  },
  { prefix: "/replay", topic: { slug: "comparison-replay", label: COMPARISON_REPLAY_HELP_TOPIC_LABEL } },
  {
    prefix: "/internal/replay",
    topic: { slug: "comparison-replay", label: COMPARISON_REPLAY_HELP_TOPIC_LABEL },
  },
  {
    prefix: INTERNAL_REPLAY_PATH,
    topic: { slug: "comparison-replay", label: COMPARISON_REPLAY_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/evidence-graph",
    topic: { slug: "evidence-graph", label: EVIDENCE_GRAPH_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/architecture-drafts",
    topic: { slug: "architecture-drafts", label: ARCHITECTURE_DRAFTS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/internal/evidence-proposals",
    topic: { slug: "evidence-trail", label: EVIDENCE_PROPOSALS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/admin/evidence-proposals",
    topic: { slug: "evidence-trail", label: EVIDENCE_PROPOSALS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/demo/explain",
    topic: { slug: "evidence-trail", label: DEMO_EXPLAIN_HELP_TOPIC_LABEL },
  },
];

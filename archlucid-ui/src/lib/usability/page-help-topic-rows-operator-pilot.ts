/** Pilot, sponsor, and onboarding contextual help rows. */

import { ACCELERATOR_CHOOSER_HELP_INBOUND_LABEL } from "@/lib/accelerator-chooser-help-title-honesty-surfaces";
import { ARCHITECTURE_SCORECARD_HELP_TOPIC_LABEL } from "@/lib/architecture/architecture-scorecard-page-copy";
import { SPONSOR_DASHBOARD_HELP_TOPIC_LABEL } from "@/lib/architecture/architecture-sponsor-dashboard-evidence-copy";
import { BUYER_ONBOARDING_PAGE_TITLE } from "@/lib/buyer/buyer-polish-copy";
import { FIRST_ARCHITECTURE_REVIEW_HELP_TOPIC_LABEL } from "@/lib/first-architecture-review-help-copy";
import { IMPROVEMENT_PLANNING_HELP_TOPIC_LABEL } from "@/lib/improvement-planning-help-evidence-copy";
import { PATTERN_LIBRARY_HELP_TOPIC_LABEL } from "@/lib/pattern-library-evidence-copy";
import { PILOT_FEEDBACK_HELP_TOPIC_LABEL } from "@/lib/pilot-feedback-help-evidence-copy";
import { PILOT_GUIDE_HELP_TOPIC_LABEL } from "@/lib/pilot-guide-help-evidence-copy";
import { REVIEW_SCORECARD_PAGE_TITLE } from "@/lib/pilot-scorecard-present";
import { ROI_SUMMARY_HELP_TOPIC_LABEL } from "@/lib/roi-summary-help-evidence-copy";
import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor/sponsor-dashboard-route";
import { SPONSOR_REPORT_HELP_TOPIC_LABEL } from "@/lib/sponsor/sponsor-report-help-evidence-copy";

import type { PageHelpTopic } from "./page-help-topic-rows-operator";

export const PAGE_HELP_TOPIC_ROWS_OPERATOR_PILOT: readonly { prefix: string; topic: PageHelpTopic }[] = [
  { prefix: "/architecture/first-review-guide", topic: { label: BUYER_ONBOARDING_PAGE_TITLE } },
  {
    prefix: "/help/accelerator-chooser",
    topic: { slug: "accelerator-chooser", label: ACCELERATOR_CHOOSER_HELP_INBOUND_LABEL },
  },
  {
    prefix: "/help/pilot-guide",
    topic: { slug: "pilot-guide", label: PILOT_GUIDE_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/first-architecture-review",
    topic: { slug: "first-architecture-review", label: FIRST_ARCHITECTURE_REVIEW_HELP_TOPIC_LABEL },
  },
  { prefix: SPONSOR_DASHBOARD_HREF, topic: { slug: "sponsor-dashboard", label: SPONSOR_DASHBOARD_HELP_TOPIC_LABEL } },
  {
    prefix: "/insights/patterns",
    topic: { slug: "repeat-review-loop", label: PATTERN_LIBRARY_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/insights/sponsor-report",
    topic: { slug: "sponsor-report", label: SPONSOR_REPORT_HELP_TOPIC_LABEL },
  },
  { prefix: "/sponsor-report", topic: { slug: "sponsor-report", label: SPONSOR_REPORT_HELP_TOPIC_LABEL } },
  {
    prefix: "/insights/roi-summary",
    topic: { slug: "roi-summary", label: ROI_SUMMARY_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/sponsor-report/roi-summary",
    topic: { slug: "roi-summary", label: ROI_SUMMARY_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/roi-summary",
    topic: { slug: "roi-summary", label: ROI_SUMMARY_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/insights/architecture-scorecard",
    topic: {
      slug: "architecture-scorecard",
      label: REVIEW_SCORECARD_PAGE_TITLE,
    },
  },
  {
    prefix: "/help/architecture-scorecard",
    topic: { slug: "architecture-scorecard", label: ARCHITECTURE_SCORECARD_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/insights/improvement-planning",
    topic: { slug: "improvement-planning", label: IMPROVEMENT_PLANNING_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/internal/product-learning",
    topic: { slug: "pilot-feedback", label: PILOT_FEEDBACK_HELP_TOPIC_LABEL },
  },
];

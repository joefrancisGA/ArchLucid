import { describe, expect, it } from "vitest";

import { ADVISORY_SCANS_HELP_TOPIC_LABEL } from "@/lib/advisory-scans-help-evidence-copy";
import { ARCHITECTURE_DRAFTS_LIST_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { AUDIT_TRAIL_HELP_TOPIC_LABEL } from "@/lib/audit-trail-help-evidence-copy";
import { BILLING_AND_PLANS_HELP_TOPIC_LABEL } from "@/lib/billing-and-plans-help-evidence-copy";
import { DECISION_REGISTER_HELP_TOPIC_LABEL } from "@/lib/decision-register-help-evidence-copy";
import { DIGESTS_HELP_TOPIC_LABEL } from "@/lib/digests-help-evidence-copy";
import { IMPACT_PREVIEW_HELP_TOPIC_LABEL } from "@/lib/impact-preview-help-evidence-copy";
import { IMPROVEMENT_PLANNING_HELP_TOPIC_LABEL } from "@/lib/improvement-planning-help-evidence-copy";
import { RECURRENCE_SCHEDULES_HELP_TOPIC_LABEL } from "@/lib/recurrence-schedules-help-evidence-copy";
import { SETTINGS_HUB_HELP_TOPIC_LABEL } from "@/lib/contextual-help/administration-rows";
import { REPEAT_REVIEW_LOOP_HELP_PAGE_TITLE } from "@/lib/repeat-review-loop-help-guide-content";
import { COMPARISON_REPLAY_HELP_TOPIC_LABEL } from "@/lib/comparison-replay-help-evidence-copy";
import { DATA_HANDLING_TENANT_ISOLATION_HELP_TOPIC_LABEL } from "@/lib/data-handling-tenant-isolation-help-evidence-copy";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { NOTIFICATION_PREFERENCE_CENTER_PAGE_TITLE } from "@/lib/notification-preference-center";
import { REVIEW_SCORECARD_PAGE_TITLE } from "@/lib/pilot-scorecard-present";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";
import { searchHelpTopics } from "@/lib/usability/search-help-topics";
import { shouldAutoStartRegistrationTour } from "@/lib/usability/onboarding-registration-tour";

describe("usability lib", () => {
  it("pageHelpTopicForPathname maps review routes", () => {
    expect(pageHelpTopicForPathname("/")?.slug).toBeUndefined();
    expect(pageHelpTopicForPathname("/")?.label).toBe("Home");
    expect(pageHelpTopicForPathname("/architecture/reviews/new")?.slug).toBe("evidence-intake");
    expect(pageHelpTopicForPathname("/reviews/new")?.slug).toBe("evidence-intake");
    expect(pageHelpTopicForPathname("/alerts")?.slug).toBe("alerts");
    expect(pageHelpTopicForPathname("/alert-rules")?.slug).toBe("alerts");
    expect(pageHelpTopicForPathname("/governance/alerts")?.slug).toBe("alerts");
    expect(pageHelpTopicForPathname("/governance/alert-rules")?.slug).toBe("alerts");
    expect(pageHelpTopicForPathname("/governance/alert-rules")?.label).toBe("Alert rules");
    expect(pageHelpTopicForPathname("/administration/connection-status")?.slug).toBe("connection-status");
    expect(pageHelpTopicForPathname("/administration/connection-status")?.label).toBe("How connection status works");
    expect(pageHelpTopicForPathname("/administration/system-health")?.slug).toBe("system-health");
    expect(pageHelpTopicForPathname("/administration/system-health")?.label).toBe("How system health works");
    expect(pageHelpTopicForPathname("/architecture/architectures")?.slug).toBe("architecture-drafts");
    expect(pageHelpTopicForPathname("/architecture/architectures")?.label).toBe(ARCHITECTURE_DRAFTS_LIST_LABEL);
    expect(pageHelpTopicForPathname("/architecture/architectures/draft-id-123")?.slug).toBe("architecture-drafts");
    expect(pageHelpTopicForPathname("/architecture/architectures/draft-id-123")?.label).toBe(ARCHITECTURE_DRAFTS_LIST_LABEL);
    expect(pageHelpTopicForPathname("/architecture/architectures/new")?.slug).toBe("structured-brief");
    expect(pageHelpTopicForPathname("/architecture/digests")?.slug).toBe("digests");
    expect(pageHelpTopicForPathname("/settings/roles")?.slug).toBe("users-and-roles");
    expect(pageHelpTopicForPathname("/architecture/digests")?.label).toBe(DIGESTS_HELP_TOPIC_LABEL);
    expect(pageHelpTopicForPathname("/digests")?.slug).toBe("digests");
    expect(pageHelpTopicForPathname("/digest-subscriptions")?.slug).toBe("digests");
    expect(pageHelpTopicForPathname("/help/digests")?.slug).toBe("digests");
    expect(pageHelpTopicForPathname("/governance/recurrence-schedules")?.slug).toBe("recurrence-schedules");
    expect(pageHelpTopicForPathname("/governance/recurrence-schedules")?.label).toBe("How recurrence schedules work");
    expect(pageHelpTopicForPathname("/help/recurrence-schedules")?.slug).toBe("recurrence-schedules");
    expect(pageHelpTopicForPathname("/help/recurrence-schedules")?.label).toBe(RECURRENCE_SCHEDULES_HELP_TOPIC_LABEL);
    expect(pageHelpTopicForPathname("/insights/improvement-planning")?.slug).toBe("improvement-planning");
    expect(pageHelpTopicForPathname("/insights/improvement-planning")?.label).toBe(IMPROVEMENT_PLANNING_HELP_TOPIC_LABEL);
    expect(pageHelpTopicForPathname("/administration/billing")?.slug).toBe("billing-and-plans");
    expect(pageHelpTopicForPathname("/administration/billing")?.label).toBe(BILLING_AND_PLANS_HELP_TOPIC_LABEL);
    expect(pageHelpTopicForPathname("/administration")?.label).toBe(SETTINGS_HUB_HELP_TOPIC_LABEL);
    expect(pageHelpTopicForPathname("/administration")?.slug).toBeUndefined();
    expect(pageHelpTopicForPathname("/administration/settings")?.label).toBe(SETTINGS_HUB_HELP_TOPIC_LABEL);
    expect(pageHelpTopicForPathname("/administration/notifications")?.slug).toBe("notifications");
    expect(pageHelpTopicForPathname("/administration/notifications")?.label).toBe(NOTIFICATION_PREFERENCE_CENTER_PAGE_TITLE);
    expect(pageHelpTopicForPathname("/help/billing-and-plans")?.slug).toBe("billing-and-plans");
    expect(pageHelpTopicForPathname("/help/billing-and-plans")?.label).toBe(BILLING_AND_PLANS_HELP_TOPIC_LABEL);
    expect(pageHelpTopicForPathname("/help/repeat-review-loop")?.slug).toBe("repeat-review-loop");
    expect(pageHelpTopicForPathname("/help/repeat-review-loop")?.label).toBe(REPEAT_REVIEW_LOOP_HELP_PAGE_TITLE);
    expect(pageHelpTopicForPathname("/help/audit-trail")?.slug).toBe("audit-trail");
    expect(pageHelpTopicForPathname("/help/audit-trail")?.label).toBe(AUDIT_TRAIL_HELP_TOPIC_LABEL);
    expect(pageHelpTopicForPathname("/insights/impact-preview")?.slug).toBe("impact-preview");
    expect(pageHelpTopicForPathname("/insights/impact-preview")?.label).toBe(IMPACT_PREVIEW_HELP_TOPIC_LABEL);
    expect(pageHelpTopicForPathname("/governance/advisory-scans")?.slug).toBe("advisory-scans");
    expect(pageHelpTopicForPathname("/governance/advisory-scans")?.label).toBe(ADVISORY_SCANS_HELP_TOPIC_LABEL);
    expect(pageHelpTopicForPathname("/governance/decision-register")?.slug).toBe("decision-register");
    expect(pageHelpTopicForPathname("/governance/decision-register")?.label).toBe(DECISION_REGISTER_HELP_TOPIC_LABEL);
    expect(pageHelpTopicForPathname("/administration/workspace-settings")?.slug).toBe("workspace-settings");
    expect(pageHelpTopicForPathname("/internal/recommendation-learning")?.slug).toBe("pilot-feedback");
    expect(pageHelpTopicForPathname("/architecture/reviews/run-1/artifacts/cost-summary")?.slug).toBe("review-artifacts");
    expect(pageHelpTopicForPathname("/governance/sealed-records/manifest-1/artifacts/cost-summary")?.slug).toBe(
      "review-artifacts",
    );
    expect(pageHelpTopicForPathname("/insights/roi-summary")?.slug).toBe("roi-summary");
    expect(pageHelpTopicForPathname("/insights/roi-summary")?.hashFragment).toBeUndefined();
    expect(pageHelpTopicForPathname("/insights/roi-summary")?.label).toBe("How to read ROI summary");
    expect(pageHelpTopicForPathname("/help/roi-summary")?.slug).toBe("roi-summary");
    expect(pageHelpTopicForPathname("/insights/architecture-scorecard")?.slug).toBe("architecture-scorecard");
    expect(pageHelpTopicForPathname("/insights/architecture-scorecard")?.hashFragment).toBeUndefined();
    expect(pageHelpTopicForPathname("/insights/architecture-scorecard")?.label).toBe(REVIEW_SCORECARD_PAGE_TITLE);
    expect(pageHelpTopicForPathname("/insights/sponsor-report")?.label).toBe("How the sponsor report works");
    expect(pageHelpTopicForPathname("/insights/ask-review-questions")?.slug).toBe("prior-manifest-retrieval");
    expect(pageHelpTopicForPathname("/insights/patterns")?.slug).toBe("repeat-review-loop");
    expect(pageHelpTopicForPathname("/insights/patterns/private-endpoints-paas")?.slug).toBe("repeat-review-loop");
    expect(pageHelpTopicForPathname("/internal/validate-route")?.slug).toBe("comparison-replay");
    expect(pageHelpTopicForPathname("/internal/validate-route")?.label).toBe(COMPARISON_REPLAY_HELP_TOPIC_LABEL);
    expect(pageHelpTopicForPathname("/insights/compare-two-reviews")?.label).toBe(COMPARISON_REPLAY_HELP_TOPIC_LABEL);
    expect(pageHelpTopicForPathname("/help/data-handling")?.slug).toBe("data-handling");
    expect(pageHelpTopicForPathname("/help/data-handling")?.label).toBe(DATA_HANDLING_TENANT_ISOLATION_HELP_TOPIC_LABEL);
  });

  it("searchHelpTopics finds pilot guide", () => {
    const hits = searchHelpTopics("pilot guide");

    expect(hits.some((h) => h.slug === "pilot-guide")).toBe(true);
  });

  it("does not surface host configuration-reference in tenant-admin global search", () => {
    const hits = searchHelpTopics("configuration");

    expect(hits.some((h) => h.slug === "configuration-reference")).toBe(false);
  });

  it("shouldAutoStartRegistrationTour detects registration source", () => {
    expect(shouldAutoStartRegistrationTour("?source=registration")).toBe(true);
    expect(shouldAutoStartRegistrationTour("")).toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";
import { searchHelpTopics } from "@/lib/usability/search-help-topics";
import { shouldAutoStartRegistrationTour } from "@/lib/usability/onboarding-registration-tour";

describe("usability lib", () => {
  it("pageHelpTopicForPathname maps review routes", () => {
    expect(pageHelpTopicForPathname("/")?.slug).toBe("first-architecture-review");
    expect(pageHelpTopicForPathname("/")?.label).toBe("Home");
    expect(pageHelpTopicForPathname("/architecture/reviews/new")?.slug).toBe("evidence-intake");
    expect(pageHelpTopicForPathname("/reviews/new")?.slug).toBe("evidence-intake");
    expect(pageHelpTopicForPathname("/alerts")?.slug).toBe("alerts");
    expect(pageHelpTopicForPathname("/alert-rules")?.slug).toBe("alerts");
    expect(pageHelpTopicForPathname("/governance/alerts")?.slug).toBe("alerts");
    expect(pageHelpTopicForPathname("/governance/alert-rules")?.slug).toBe("alerts");
    expect(pageHelpTopicForPathname("/governance/alert-rules")?.label).toBe("Alert rules");
    expect(pageHelpTopicForPathname("/administration/connection-status")?.slug).toBe("integration-readiness");
    expect(pageHelpTopicForPathname("/administration/connection-status")?.label).toBe("How integration readiness works");
    expect(pageHelpTopicForPathname("/administration/system-health")?.slug).toBe("troubleshooting");
    expect(pageHelpTopicForPathname("/administration/system-health")?.label).toBe("System health");
    expect(pageHelpTopicForPathname("/architecture/architectures")?.slug).toBe("getting-started");
    expect(pageHelpTopicForPathname("/architecture/architectures")?.label).toBe("Architecture drafts");
    expect(pageHelpTopicForPathname("/architecture/architectures/draft-id-123")?.slug).toBe("getting-started");
    expect(pageHelpTopicForPathname("/architecture/architectures/draft-id-123")?.label).toBe("Architecture drafts");
    expect(pageHelpTopicForPathname("/architecture/digests")?.slug).toBe("digests");
    expect(pageHelpTopicForPathname("/settings/roles")?.slug).toBe("users-and-roles");
    expect(pageHelpTopicForPathname("/architecture/digests")?.label).toBe("Architecture digests");
    expect(pageHelpTopicForPathname("/digests")?.slug).toBe("digests");
    expect(pageHelpTopicForPathname("/digest-subscriptions")?.slug).toBe("digests");
    expect(pageHelpTopicForPathname("/help/digests")?.slug).toBe("digests");
    expect(pageHelpTopicForPathname("/governance/recurrence-schedules")?.slug).toBe("recurrence-schedules");
    expect(pageHelpTopicForPathname("/governance/recurrence-schedules")?.label).toBe("Recurrence schedules");
    expect(pageHelpTopicForPathname("/help/recurrence-schedules")?.slug).toBe("recurrence-schedules");
    expect(pageHelpTopicForPathname("/insights/improvement-planning")?.slug).toBeUndefined();
    expect(pageHelpTopicForPathname("/insights/improvement-planning")?.label).toBe("Improvement planning");
    expect(pageHelpTopicForPathname("/administration/billing")?.slug).toBe("billing-and-plans");
    expect(pageHelpTopicForPathname("/administration/billing")?.label).toBe("Billing and plans");
    expect(pageHelpTopicForPathname("/administration")?.label).toBe("Settings help");
    expect(pageHelpTopicForPathname("/administration")?.slug).toBeUndefined();
    expect(pageHelpTopicForPathname("/administration/settings")?.label).toBe("Settings help");
    expect(pageHelpTopicForPathname("/administration/notifications")?.slug).toBe("integration-readiness");
    expect(pageHelpTopicForPathname("/administration/notifications")?.label).toBe("Notification channels");
    expect(pageHelpTopicForPathname("/help/billing-and-plans")?.slug).toBe("billing-and-plans");
    expect(pageHelpTopicForPathname("/help/billing-and-plans")?.label).toBe("Billing and plans");
    expect(pageHelpTopicForPathname("/help/repeat-review-loop")?.slug).toBe("repeat-review-loop");
    expect(pageHelpTopicForPathname("/help/repeat-review-loop")?.label).toBe("Repeat-review loop");
    expect(pageHelpTopicForPathname("/help/audit-trail")?.slug).toBe("audit-trail");
    expect(pageHelpTopicForPathname("/help/audit-trail")?.label).toBe("Audit trail");
    expect(pageHelpTopicForPathname("/insights/impact-preview")?.slug).toBeUndefined();
    expect(pageHelpTopicForPathname("/insights/impact-preview")?.label).toBe("Impact preview");
    expect(pageHelpTopicForPathname("/governance/advisory-scans")?.slug).toBeUndefined();
    expect(pageHelpTopicForPathname("/governance/advisory-scans")?.label).toBe("Advisory scans");
    expect(pageHelpTopicForPathname("/governance/decision-register")?.slug).toBeUndefined();
    expect(pageHelpTopicForPathname("/administration/workspace-settings")?.slug).toBe("scope");
    expect(pageHelpTopicForPathname("/internal/recommendation-learning")?.slug).toBe("pilot-feedback");
    expect(pageHelpTopicForPathname("/architecture/reviews/run-1/artifacts/cost-summary")?.slug).toBe("review-artifacts");
    expect(pageHelpTopicForPathname("/governance/signed-records/manifest-1/artifacts/cost-summary")?.slug).toBe(
      "review-artifacts",
    );
    expect(pageHelpTopicForPathname("/insights/roi-summary")?.slug).toBe("roi-summary");
    expect(pageHelpTopicForPathname("/insights/roi-summary")?.hashFragment).toBeUndefined();
    expect(pageHelpTopicForPathname("/insights/roi-summary")?.label).toBe("ROI summary");
    expect(pageHelpTopicForPathname("/help/roi-summary")?.slug).toBe("roi-summary");
    expect(pageHelpTopicForPathname("/insights/pilot-outcomes")?.slug).toBe("executive-summary");
    expect(pageHelpTopicForPathname("/insights/architecture-scorecard")?.slug).toBe("executive-summary");
    expect(pageHelpTopicForPathname("/insights/architecture-scorecard")?.hashFragment).toBe(
      "pilot-roi-measurement",
    );
    expect(pageHelpTopicForPathname("/insights/architecture-scorecard")?.label).toBe("Architecture scorecard");
    expect(pageHelpTopicForPathname("/insights/ask-review-questions")?.slug).toBe("prior-manifest-retrieval");
    expect(pageHelpTopicForPathname("/insights/patterns")?.slug).toBe("repeat-review-loop");
    expect(pageHelpTopicForPathname("/insights/patterns/private-endpoints-paas")?.slug).toBe("repeat-review-loop");
    expect(pageHelpTopicForPathname("/internal/replay")?.slug).toBe("comparison-replay");
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

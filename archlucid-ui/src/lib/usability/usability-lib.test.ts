import { describe, expect, it } from "vitest";

import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";
import { searchHelpTopics } from "@/lib/usability/search-help-topics";
import { shouldAutoStartRegistrationTour } from "@/lib/usability/onboarding-registration-tour";

describe("usability lib", () => {
  it("pageHelpTopicForPathname maps review routes", () => {
    expect(pageHelpTopicForPathname("/")?.slug).toBe("first-architecture-review");
    expect(pageHelpTopicForPathname("/")?.label).toBe("Architecture workflow");
    expect(pageHelpTopicForPathname("/architecture/reviews/new")?.slug).toBe("evidence-intake");
    expect(pageHelpTopicForPathname("/alerts")?.slug).toBe("alerts");
    expect(pageHelpTopicForPathname("/alert-rules")?.slug).toBe("alerts");
    expect(pageHelpTopicForPathname("/governance/dashboard")?.slug).toBe("getting-started");
    expect(pageHelpTopicForPathname("/governance/dashboard")?.label).toBe("Workspace overview");
    expect(pageHelpTopicForPathname("/governance/alerts")?.slug).toBe("alerts");
    expect(pageHelpTopicForPathname("/governance/alert-rules")?.slug).toBe("alerts");
    expect(pageHelpTopicForPathname("/governance/alert-rules")?.label).toBe("How alerts work");
    expect(pageHelpTopicForPathname("/administration/connection-status")?.slug).toBe("integration-readiness");
    expect(pageHelpTopicForPathname("/administration/connection-status")?.label).toBe("How integration readiness works");
    expect(pageHelpTopicForPathname("/administration/system-health")?.slug).toBe("troubleshooting");
    expect(pageHelpTopicForPathname("/administration/system-health")?.label).toBe("Troubleshooting");
    expect(pageHelpTopicForPathname("/architecture/architectures")?.slug).toBe("getting-started");
    expect(pageHelpTopicForPathname("/architecture/architectures")?.label).toBe("Getting started");
    expect(pageHelpTopicForPathname("/architecture/architectures/draft-id-123")?.slug).toBe("getting-started");
    expect(pageHelpTopicForPathname("/digests")?.slug).toBe("getting-started");
    expect(pageHelpTopicForPathname("/insights/planning")?.slug).toBe("getting-started");
    expect(pageHelpTopicForPathname("/administration/settings/billing")?.slug).toBe("billing-and-plans");
    expect(pageHelpTopicForPathname("/administration/settings/billing")?.label).toBe("Billing and plans");
    expect(pageHelpTopicForPathname("/help/billing-and-plans")?.slug).toBe("billing-and-plans");
    expect(pageHelpTopicForPathname("/help/billing-and-plans")?.label).toBe("Billing and plans");
    expect(pageHelpTopicForPathname("/help/repeat-review-loop")?.slug).toBe("repeat-review-loop");
    expect(pageHelpTopicForPathname("/help/repeat-review-loop")?.label).toBe("Repeat-review loop");
    expect(pageHelpTopicForPathname("/help/audit-trail")?.slug).toBe("audit-trail");
    expect(pageHelpTopicForPathname("/help/audit-trail")?.label).toBe("Audit trail");
    expect(pageHelpTopicForPathname("/insights/impact-preview")?.slug).toBe("getting-started");
    expect(pageHelpTopicForPathname("/insights/impact-preview")?.label).toBe("Impact preview");
    expect(pageHelpTopicForPathname("/governance/advisory-scans")?.slug).toBe("getting-started");
    expect(pageHelpTopicForPathname("/architecture/reviews/run-1/artifacts/cost-summary")?.slug).toBe("review-artifacts");
    expect(pageHelpTopicForPathname("/signed-records/manifest-1/artifacts/cost-summary")?.slug).toBe(
      "review-artifacts",
    );
    expect(pageHelpTopicForPathname("/sponsor-report/roi-summary")?.slug).toBe("pilot-roi-model");
    expect(pageHelpTopicForPathname("/sponsor-report/roi-summary")?.label).toBe("View ROI methodology");
    expect(pageHelpTopicForPathname("/sponsor-report/pilot-outcomes")?.slug).toBe("executive-summary");
  });

  it("searchHelpTopics finds pilot guide", () => {
    const hits = searchHelpTopics("pilot guide");

    expect(hits.some((h) => h.slug === "pilot-guide")).toBe(true);
  });

  it("shouldAutoStartRegistrationTour detects registration source", () => {
    expect(shouldAutoStartRegistrationTour("?source=registration")).toBe(true);
    expect(shouldAutoStartRegistrationTour("")).toBe(false);
  });
});

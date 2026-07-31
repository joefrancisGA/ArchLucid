import { describe, expect, it } from "vitest";

import { navLinkQuestionSubtitle } from "@/lib/usability/nav-link-question-subtitles";
import { filterNavLinksByOperateUnlockPhase } from "@/lib/usability/operate-nav-progressive-unlock";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";
import { searchHelpTopics } from "@/lib/usability/search-help-topics";
import { shouldAutoStartRegistrationTour } from "@/lib/usability/onboarding-registration-tour";

describe("usability lib", () => {
  it("navLinkQuestionSubtitle returns compare and ask copy", () => {
    expect(navLinkQuestionSubtitle("/compare")).toContain("changed");
    expect(navLinkQuestionSubtitle("/ask")).toContain("plain language");
  });

  it("navLinkQuestionSubtitle omits dense helpers for self-explanatory nav items", () => {
    expect(navLinkQuestionSubtitle("/graph")).toBeNull();
    expect(navLinkQuestionSubtitle("/governance")).toBeNull();
    expect(navLinkQuestionSubtitle("/replay")).toBeNull();
    expect(navLinkQuestionSubtitle("/governance/advisory-scans")).toBeNull();
  });

  it("filterNavLinksByOperateUnlockPhase hides all Operate links at phase 0", () => {
    const links = [{ href: "/compare" }, { href: "/audit" }];
    const phase0 = filterNavLinksByOperateUnlockPhase(links, false, 0);

    expect(phase0).toEqual([]);
  });

  it("filterNavLinksByOperateUnlockPhase keeps governance workflow and audit at phase 1", () => {
    const links = [
      { href: "/compare" },
      { href: "/governance" },
      { href: "/governance/audit" },
      { href: "/governance/findings" },
    ];
    const phase1 = filterNavLinksByOperateUnlockPhase(links, true, 1);

    expect(phase1.map((l) => l.href)).toEqual(["/compare", "/governance", "/governance/audit"]);
  });

  it("filterNavLinksByOperateUnlockPhase keeps recurrence schedules visible in phase 1", () => {
    const links = [
      { href: "/compare" },
      { href: "/governance/recurrence-schedules" },
      { href: "/governance/audit" },
    ];
    const phase1 = filterNavLinksByOperateUnlockPhase(links, true, 1);

    expect(phase1.map((l) => l.href)).toEqual([
      "/compare",
      "/governance/recurrence-schedules",
      "/governance/audit",
    ]);
  });

  it("pageHelpTopicForPathname maps review routes", () => {
    expect(pageHelpTopicForPathname("/reviews/new")?.slug).toBe("evidence-intake");
    expect(pageHelpTopicForPathname("/alerts")?.slug).toBe("alerts");
    expect(pageHelpTopicForPathname("/alert-rules")?.slug).toBe("alerts");
    expect(pageHelpTopicForPathname("/governance/alert-rules")?.slug).toBe("alerts");
    expect(pageHelpTopicForPathname("/governance/alert-rules")?.label).toBe("How alerts work");
    expect(pageHelpTopicForPathname("/integrations/readiness")?.slug).toBe("integration-readiness");
    expect(pageHelpTopicForPathname("/integrations/readiness")?.label).toBe("How integration readiness works");
    expect(pageHelpTopicForPathname("/health")?.slug).toBe("troubleshooting");
    expect(pageHelpTopicForPathname("/health")?.label).toBe("Troubleshooting");
    expect(pageHelpTopicForPathname("/architectures")?.slug).toBe("getting-started");
    expect(pageHelpTopicForPathname("/architectures")?.label).toBe("Getting started");
    expect(pageHelpTopicForPathname("/architectures/draft-id-123")?.slug).toBe("getting-started");
    expect(pageHelpTopicForPathname("/digests")?.slug).toBe("how-it-works");
    expect(pageHelpTopicForPathname("/planning")?.slug).toBe("pilot-feedback");
    expect(pageHelpTopicForPathname("/governance/advisory-scans")?.slug).toBe("how-it-works");
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

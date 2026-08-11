import { describe, expect, it } from "vitest";

import { contextualHelpForPathname } from "@/lib/contextual-help-registry";
import {
  isGenericLearnMoreSlug,
  LEARN_MORE_JOB_MATCH_SECONDARY_HUB_PATHS,
} from "@/lib/learn-more-job-match-inventory";
import {
  PAGE_HELP_FIRST_RUN_GENERIC_LEARN_MORE_ALLOWLIST_PREFIXES,
  pageHelpTopicForPathname,
} from "@/lib/usability/page-help-topic-map";

/** TB-2050 remap paths — subset of TB-2052 inventory (excludes Digests golden covered elsewhere). */
const SECONDARY_HUB_PATHS = LEARN_MORE_JOB_MATCH_SECONDARY_HUB_PATHS.filter(
  (path) => path !== "/architecture/digests" && path !== "/digests",
);

describe("TB-2050 secondary-hub Learn more remap", () => {
  it("bans generic getting-started Learn more on secondary hubs", () => {
    for (const path of SECONDARY_HUB_PATHS) {
      const topic = pageHelpTopicForPathname(path);
      const slug = topic?.slug;

      expect(isGenericLearnMoreSlug(slug), path).toBe(false);
    }
  });

  it("keeps Category-1 trigger labels when Learn more is omitted", () => {
    expect(pageHelpTopicForPathname("/insights/improvement-planning")?.label).toBe("Improvement planning");
    expect(pageHelpTopicForPathname("/governance/decision-register")?.label).toBe("Decision register");
    expect(pageHelpTopicForPathname("/governance/advisory-scans")?.label).toBe("Advisory scans");
    expect(pageHelpTopicForPathname("/insights/impact-preview")?.label).toBe("Impact preview");
  });

  it("documents first-run allowlist prefixes for generic Learn more", () => {
    expect(PAGE_HELP_FIRST_RUN_GENERIC_LEARN_MORE_ALLOWLIST_PREFIXES).toContain("/architectures");
    expect(PAGE_HELP_FIRST_RUN_GENERIC_LEARN_MORE_ALLOWLIST_PREFIXES).toContain("/why-archlucid");
    expect(pageHelpTopicForPathname("/architectures")?.slug).toBe("getting-started");
    expect(pageHelpTopicForPathname("/why-archlucid")).toEqual({
      slug: "getting-started",
      hashFragment: "how-archlucid-works",
      label: "Why ArchLucid",
    });
  });

  it("remaps tenant settings and recommendation-learning off getting-started", () => {
    expect(pageHelpTopicForPathname("/administration/tenant")?.slug).toBe("scope");
    expect(pageHelpTopicForPathname("/internal/recommendation-learning")?.slug).toBe(
      "pilot-feedback",
    );
  });

  it("keeps Category-1 registry coverage for hubs that omit Learn more", () => {
    for (const path of SECONDARY_HUB_PATHS) {
      expect(contextualHelpForPathname(path), path).not.toBeNull();
    }
  });
});

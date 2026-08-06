import { describe, expect, it } from "vitest";

import { contextualHelpForPathname } from "@/lib/contextual-help-registry";
import {
  PAGE_HELP_FIRST_RUN_GENERIC_LEARN_MORE_ALLOWLIST_PREFIXES,
  pageHelpTopicForPathname,
} from "@/lib/usability/page-help-topic-map";

/** Secondary hubs named in TB-2050 — Learn more must not be getting-started / how-it-works. */
const SECONDARY_HUB_PATHS = [
  "/insights/planning",
  "/insights/planning/plans/plan-1",
  "/governance/decision-register",
  "/governance/advisory-scans",
  "/insights/impact-preview",
  "/governance/dashboard",
] as const;

describe("TB-2050 secondary-hub Learn more remap", () => {
  it("bans generic getting-started/how-it-works Learn more on secondary hubs", () => {
    for (const path of SECONDARY_HUB_PATHS) {
      const topic = pageHelpTopicForPathname(path);
      const slug = topic?.slug;

      expect(slug, path).not.toBe("getting-started");
      expect(slug, path).not.toBe("how-it-works");
    }
  });

  it("keeps Category-1 trigger labels when Learn more is omitted", () => {
    expect(pageHelpTopicForPathname("/insights/planning")?.label).toBe("Improvement planning");
    expect(pageHelpTopicForPathname("/governance/decision-register")?.label).toBe("Decision register");
    expect(pageHelpTopicForPathname("/governance/advisory-scans")?.label).toBe("Advisory scans");
    expect(pageHelpTopicForPathname("/insights/impact-preview")?.label).toBe("Impact preview");
    expect(pageHelpTopicForPathname("/governance/dashboard")?.label).toBe("Workspace overview");
  });

  it("documents first-run allowlist prefixes for generic Learn more", () => {
    expect(PAGE_HELP_FIRST_RUN_GENERIC_LEARN_MORE_ALLOWLIST_PREFIXES).toContain("/architectures");
    expect(PAGE_HELP_FIRST_RUN_GENERIC_LEARN_MORE_ALLOWLIST_PREFIXES).toContain("/why-archlucid");
    expect(pageHelpTopicForPathname("/architectures")?.slug).toBe("getting-started");
    expect(pageHelpTopicForPathname("/why-archlucid")?.slug).toBe("how-it-works");
  });

  it("remaps tenant settings and recommendation-learning off getting-started", () => {
    expect(pageHelpTopicForPathname("/administration/tenant")?.slug).toBe("scope");
    expect(pageHelpTopicForPathname("/internal-operations/recommendation-learning")?.slug).toBe(
      "pilot-feedback",
    );
  });

  it("keeps Category-1 registry coverage for hubs that omit Learn more", () => {
    for (const path of SECONDARY_HUB_PATHS) {
      expect(contextualHelpForPathname(path), path).not.toBeNull();
    }
  });
});

import { describe, expect, it } from "vitest";

import { DIGESTS_SCHEDULE_TAB_PATH } from "@/lib/digests-route-paths";
import { contextualHelpForPathname } from "@/lib/contextual-help-registry";
import {
  GENERIC_LEARN_MORE_SLUGS,
  isGenericLearnMoreSlug,
  LEARN_MORE_JOB_MATCH_SECONDARY_HUB_PATHS,
} from "@/lib/learn-more-job-match-inventory";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  PAGE_HELP_FIRST_RUN_GENERIC_LEARN_MORE_ALLOWLIST_PREFIXES,
  pageHelpTopicForPathname,
} from "@/lib/usability/page-help-topic-map";

describe("Learn more job-match Vitest suite (TB-2052)", () => {
  it("bans getting-started/how-it-works Learn more on secondary-hub allowlist", () => {
    for (const path of LEARN_MORE_JOB_MATCH_SECONDARY_HUB_PATHS) {
      const topic = pageHelpTopicForPathname(path);
      const slug = topic?.slug;

      expect(isGenericLearnMoreSlug(slug), `${path} slug=${slug ?? "(omit)"}`).toBe(false);

      for (const banned of GENERIC_LEARN_MORE_SLUGS) {
        expect(slug, path).not.toBe(banned);
      }
    }
  });

  it("keeps Digests Learn more job-matched to digests specialty", () => {
    const topic = pageHelpTopicForPathname("/architecture/digests");

    expect(topic?.slug).toBe("digests");
    expect(getProductDocumentationEntry("digests")?.slug).toBe("digests");
    expect(pageHelpTopicForPathname("/digests")?.slug).toBe("digests");
  });

  it("keeps Digests Category-1 Schedule deep links when registry references Schedule", () => {
    const entry = contextualHelpForPathname("/architecture/digests");

    expect(entry?.whatToDoNext.toLowerCase()).toContain("schedule");
    expect(entry?.whatToDoNextAction?.href).toBe(DIGESTS_SCHEDULE_TAB_PATH);
    expect(entry?.whereToConfigureAction?.href).toBe(DIGESTS_SCHEDULE_TAB_PATH);
  });

  it("keeps Category-1 registry mounted when Learn more is omitted", () => {
    for (const path of LEARN_MORE_JOB_MATCH_SECONDARY_HUB_PATHS) {
      expect(contextualHelpForPathname(path), path).not.toBeNull();
    }
  });

  it("documents first-run allowlist separately from secondary hubs", () => {
    expect(PAGE_HELP_FIRST_RUN_GENERIC_LEARN_MORE_ALLOWLIST_PREFIXES).toContain("/architectures");
    expect(PAGE_HELP_FIRST_RUN_GENERIC_LEARN_MORE_ALLOWLIST_PREFIXES).toContain("/why-archlucid");

    for (const path of LEARN_MORE_JOB_MATCH_SECONDARY_HUB_PATHS) {
      expect(
        (PAGE_HELP_FIRST_RUN_GENERIC_LEARN_MORE_ALLOWLIST_PREFIXES as readonly string[]).includes(path),
        `${path} must not be on the first-run generic Learn more allowlist`,
      ).toBe(false);
    }
  });
});

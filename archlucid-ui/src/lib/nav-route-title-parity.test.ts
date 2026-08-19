import { describe, expect, it } from "vitest";

import { flattenNavLinks } from "@/lib/nav-config";
import { getRouteTitle } from "@/lib/route-titles";

/** Nav hrefs whose page H1 intentionally differs by shell mode (buyer-polished copy). */
const NAV_TITLE_PARITY_EXCEPTIONS = new Set<string>([
  "/insights/ask-review-questions",
]);

/**
 * Every configured sidebar href (path only) should match getRouteTitle for route announcer parity.
 * Query strings on nav links (e.g. Reviews default project) are stripped before lookup.
 *
 * Anchor deep-links are skipped: a row like `…/sponsor-dashboard#workspace-health` names the **section** it
 * scrolls to, not the page, so its label is intentionally different from the host route title.
 */
describe("nav route title parity", () => {
  it("matches flattened nav labels to ROUTE_TITLES for canonical paths", () => {
    const mismatches: string[] = [];

    for (const link of flattenNavLinks()) {
      if (link.href.includes("#")) {
        continue;
      }

      const pathOnly = link.href.split("?")[0] ?? link.href;

      if (NAV_TITLE_PARITY_EXCEPTIONS.has(pathOnly)) {
        continue;
      }

      const routeTitle = getRouteTitle(pathOnly);

      if (routeTitle !== link.label) {
        mismatches.push(`${pathOnly}: nav="${link.label}" routeTitle="${routeTitle}"`);
      }
    }

    expect(mismatches, mismatches.join("\n")).toEqual([]);
  });
});

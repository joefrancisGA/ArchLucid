import { describe, expect, it } from "vitest";

import { contextualHelpForPathname } from "@/lib/contextual-help-registry";
import {
  ARCHITECTURES_LIST_PATH,
  REVIEWS_LIST_PATH,
  REVIEWS_NEW_PATH,
} from "@/lib/architecture/architecture-routes";
import type { PageContextualHelpEntry } from "@/lib/contextual-help/types";
import {
  AO42_WORKING_HELP_DENYLIST,
  HELP_FIRST_SESSION_LEAD_MARKERS,
} from "@/lib/help/help-workspace-mode-copy";

const WORKING_DESK_ROUTES = ["/", ARCHITECTURES_LIST_PATH, REVIEWS_LIST_PATH, REVIEWS_NEW_PATH] as const;

function contextualHelpHaystack(entry: PageContextualHelpEntry | null): string {
  if (entry === null) {
    return "";
  }

  return [
    entry.whatIsThisPage,
    entry.whatToDoNext,
    entry.whyEmpty ?? "",
    entry.whereToConfigurePrerequisite ?? "",
    ...(entry.taskSteps ?? []),
    entry.whatToDoNextAction?.label ?? "",
    entry.whereToConfigureAction?.label ?? "",
  ].join(" ");
}

describe("contextual help working desk copy guard (AO-42)", () => {
  it("AO-42: Working desk routes avoid first-review-as-product narration", () => {
    for (const route of WORKING_DESK_ROUTES) {
      const entry = contextualHelpForPathname(route, { workingMode: true });
      const haystack = contextualHelpHaystack(entry);

      expect(haystack, route).not.toMatch(HELP_FIRST_SESSION_LEAD_MARKERS);
      expect(haystack, route).not.toMatch(AO42_WORKING_HELP_DENYLIST);
      expect(haystack.toLowerCase(), route).toMatch(/architecture identit|named architecture|architecture package/);
    }
  });

  it("AO-42: Guided first-review guide may still teach first-run intake", () => {
    const entry = contextualHelpForPathname("/architecture/first-review-guide", { workingMode: false });
    const haystack = contextualHelpHaystack(entry);

    expect(haystack.toLowerCase()).toContain("first review");
  });
});

import { describe, expect, it } from "vitest";

import { DIGESTS_SCHEDULE_TAB_PATH } from "@/lib/digests-route-paths";
import { contextualHelpForPathname } from "@/lib/contextual-help-registry";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("TB-2049 Digests Learn more golden", () => {
  it("maps Digests hub Learn more to digests specialty (not getting-started/how-it-works)", () => {
    const topic = pageHelpTopicForPathname("/architecture/digests");

    expect(topic?.slug).toBe("digests");
    expect(topic?.slug).not.toBe("getting-started");
    expect(topic?.slug).not.toBe("how-it-works");
    expect(getProductDocumentationEntry("digests")?.slug).toBe("digests");
  });

  it("exposes Schedule deep links from Digests Category-1 fields", () => {
    const entry = contextualHelpForPathname("/architecture/digests");

    expect(entry?.whatToDoNextAction?.href).toBe(DIGESTS_SCHEDULE_TAB_PATH);
    expect(entry?.whereToConfigureAction?.href).toBe(DIGESTS_SCHEDULE_TAB_PATH);
    expect(entry?.whatToDoNext.toLowerCase()).toContain("schedule");
  });
});

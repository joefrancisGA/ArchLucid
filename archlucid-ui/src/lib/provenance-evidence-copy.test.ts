import { describe, expect, it } from "vitest";

import { pathIsRunProvenance } from "@/lib/provenance-evidence-copy";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";

describe("provenance-evidence-copy (RRP help routing)", () => {
  it("detects run provenance paths", () => {
    expect(pathIsRunProvenance("/reviews/demo-run/provenance")).toBe(true);
    expect(pathIsRunProvenance("/architecture/reviews/demo-run/provenance")).toBe(true);
    expect(pathIsRunProvenance("/reviews/demo-run")).toBe(false);
  });

  it("maps provenance paths to evidence-trail topic", () => {
    expect(pageHelpTopicForPathname("/reviews/demo-run/provenance")?.slug).toBe("evidence-trail");
    expect(pageHelpTopicForPathname("/reviews/demo-run/provenance")?.label).toBe("Review provenance");
  });
});

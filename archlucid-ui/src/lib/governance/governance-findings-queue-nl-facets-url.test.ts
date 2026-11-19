import { describe, expect, it } from "vitest";

import { EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS } from "@/lib/findings/findings-natural-language-filter";
import { governanceFindingsNlFacetsHrefFromSearch } from "./governance-findings-queue-nl-facets-url";

describe("governanceFindingsNlFacetsHrefFromSearch", () => {
  it("retains hideGeneric when NL facet chips change", () => {
    const href = governanceFindingsNlFacetsHrefFromSearch("hideGeneric=1", {
      severity: "high",
      status: "open",
      titleKeywords: [],
    });

    expect(href).toBe("/governance/findings?hideGeneric=1&severity=high&status=open");
  });

  it("retains triage focusedFinding when NL facet chips change", () => {
    const href = governanceFindingsNlFacetsHrefFromSearch("focusedFinding=finding-1&filter=open", {
      severity: "high",
      status: "open",
      titleKeywords: [],
    });

    expect(href).toBe(
      "/governance/findings?focusedFinding=finding-1&filter=open&severity=high&status=open",
    );
  });

  it("retains hideGeneric when NL facet chips reset", () => {
    const href = governanceFindingsNlFacetsHrefFromSearch(
      "hideGeneric=1&severity=high&status=open",
      EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS,
    );

    expect(href).toBe("/governance/findings?hideGeneric=1");
    expect(href).not.toContain("severity=");
    expect(href).not.toContain("status=");
  });
  it("retains hideGeneric when a single NL facet chip is removed", () => {
    const href = governanceFindingsNlFacetsHrefFromSearch("hideGeneric=1&severity=high&status=open", {
      severity: null,
      status: "open",
      titleKeywords: [],
    });

    expect(href).toBe("/governance/findings?hideGeneric=1&status=open");
    expect(href).not.toContain("severity=");
  });
});

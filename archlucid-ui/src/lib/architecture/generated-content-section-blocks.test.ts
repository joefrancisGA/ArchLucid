import { describe, expect, it } from "vitest";

import {
  createEmptyDrafts,
  finalizeSections,
  mergeUserAssertions,
} from "@/lib/architecture/generated-content-section-blocks";

describe("mergeUserAssertions", () => {
  it("does not copy overview into scope when scope was not stored (P-06)", () => {
    const drafts = createEmptyDrafts();

    mergeUserAssertions(drafts, {
      architectureName: "Payments",
      architectureOverview: "Overview-only brief without a dedicated scope section.",
      businessOutcome: "",
      peopleAndSystems: [],
    });

    const sections = finalizeSections(drafts);
    const scope = sections.find((section) => section.key === "scope");

    expect(scope).toBeUndefined();
  });
});

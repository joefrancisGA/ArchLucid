import { describe, expect, it } from "vitest";

import { architectureNestedFindingsPath } from "@/lib/architecture/architecture-routes";

import {
  resolveGlobalSearchFindingHref,
  resolveGlobalSearchRunHref,
} from "@/lib/global-search-inhabited-navigation";

describe("global search inhabited navigation (IP-003)", () => {
  it("Working + architectureId opens nested findings for run resume", () => {
    const href = resolveGlobalSearchRunHref("run-42", {
      isWorkingMode: true,
      architectureId: "architecture-identity-001",
    });

    expect(href).toBe(
      `${architectureNestedFindingsPath("architecture-identity-001")}?runId=run-42`,
    );
  });

  it("Guided keeps review-detail locator for run resume", () => {
    const href = resolveGlobalSearchRunHref("run-42", {
      isWorkingMode: false,
      architectureId: "architecture-identity-001",
    });

    expect(href).toContain("/architecture/architectures/architecture-identity-001/reviews/run-42");
  });

  it("Working + architectureId opens nested focusedFinding for finding hits", () => {
    const href = resolveGlobalSearchFindingHref("run-42", "finding-9", {
      isWorkingMode: true,
      architectureId: "architecture-identity-001",
    });

    expect(href).toBe(
      `${architectureNestedFindingsPath("architecture-identity-001")}?runId=run-42&focusedFinding=finding-9`,
    );
  });

  it("Guided finding hits keep evidence-trace inspect route", () => {
    const href = resolveGlobalSearchFindingHref("run-42", "finding-9", {
      isWorkingMode: false,
      architectureId: "architecture-identity-001",
    });

    expect(href).toContain("/architecture/reviews/run-42/findings/finding-9/evidence-trace");
  });
});

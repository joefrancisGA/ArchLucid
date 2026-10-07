import { describe, expect, it } from "vitest";

import {
  architectureNestedFindingsPath,
  reviewDetailPath,
} from "@/lib/architecture/architecture-routes";

import {
  governanceFindingInspectHref,
  governanceFindingManifestRecordHref,
} from "@/components/governance/findings/governance-findings-navigation";

describe("governanceFindingInspectHref (IR-004)", () => {
  it("returns nested findings focusedFinding href when Working architecture id is known", () => {
    const href = governanceFindingInspectHref("run-1", "finding-9", {
      architectureId: "arch-1",
      isWorkingMode: true,
    });

    expect(href).toBe(
      `${architectureNestedFindingsPath("arch-1")}?runId=run-1&focusedFinding=finding-9`,
    );
  });

  it("keeps evidence trace href when architecture id is unknown", () => {
    const href = governanceFindingInspectHref("run-1", "finding-9");

    expect(href).toContain("/architecture/reviews/run-1/findings/finding-9/evidence-trace");
  });
});

describe("governanceFindingManifestRecordHref", () => {
  it.each(["", "   ", " — "])("routes absent manifest ID %j to its review", (manifestId) => {
    expect(governanceFindingManifestRecordHref("run-1", manifestId)).toBe(reviewDetailPath("run-1"));
  });

  it("routes a manifest ID to its signed record", () => {
    expect(governanceFindingManifestRecordHref("run-1", "manifest-1")).toBe(
      "/governance/sealed-records/manifest-1",
    );
  });
});

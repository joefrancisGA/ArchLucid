import { describe, expect, it } from "vitest";

import {
  findOperatorSideRailBannedKindMarkerViolations,
  findOperatorSideRailDemotedTwoColViolations,
  findOperatorSideRailMissingAllowedMarkerViolations,
  surfaceDeclaresAllowedRailKind,
} from "@/lib/operator/operator-side-rail-patterns";

describe("operator-side-rail-patterns (TB-1576)", () => {
  it("detects banned teaching/static/about-aside markers", () => {
    const violations = findOperatorSideRailBannedKindMarkerViolations(
      '<aside data-operator-side-rail-kind="teaching" />',
    );

    expect(violations.map((violation) => violation.code)).toEqual(["banned-rail-kind-marker"]);
  });

  it("detects demoted about-aside two-col shells", () => {
    const violations = findOperatorSideRailDemotedTwoColViolations(
      'className={cn(OPERATOR_LAYOUT.mainWithStickyAside)}',
    );

    expect(violations.map((violation) => violation.code)).toEqual(["demoted-about-aside-two-col"]);
  });

  it("accepts live preview rail markers", () => {
    const source =
      'data-rail-kind={OPERATOR_LIVE_PREVIEW_READINESS_RAIL_KIND} data-live-rail-pinned={pin ? "true" : "false"}';

    expect(surfaceDeclaresAllowedRailKind(source, "live")).toBe(true);
    expect(findOperatorSideRailMissingAllowedMarkerViolations(source, "live")).toEqual([]);
  });

  it("accepts OperatorLivePreviewPinLayout as the live rail wrapper", () => {
    const source = "<OperatorLivePreviewPinLayout pinRail={pinLivePreviewRail} testId=\"layout\" />";

    expect(surfaceDeclaresAllowedRailKind(source, "live")).toBe(true);
  });

  it("accepts dynamic working-object markers", () => {
    const source =
      'data-operator-side-rail-kind={props.rail !== null ? "working-object" : "none"}';

    expect(surfaceDeclaresAllowedRailKind(source, "working-object")).toBe(true);
  });
});

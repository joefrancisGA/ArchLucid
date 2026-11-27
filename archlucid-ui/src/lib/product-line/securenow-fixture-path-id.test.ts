import { describe, expect, it } from "vitest";

import {
  SECURENOW_DEMO_FIXTURE_PATH_ID,
  isSecureNowSyntheticFixturePathId,
  secureNowSyntheticFixtureDisciplineForPathId,
} from "@/lib/product-line/securenow-fixture-path-id";
import { SECURENOW_SYNTHETIC_FIXTURE_DISCIPLINE } from "@/lib/product-line/securenow-synthetic-fixture-discipline";

describe("securenow-fixture-path-id", () => {
  it("recognizes synthetic fixture path ids", () => {
    expect(isSecureNowSyntheticFixturePathId(SECURENOW_DEMO_FIXTURE_PATH_ID)).toBe(true);
    expect(isSecureNowSyntheticFixturePathId("fixture-path-02")).toBe(true);
    expect(isSecureNowSyntheticFixturePathId("fixture-path-03")).toBe(true);
    expect(isSecureNowSyntheticFixturePathId("path-real-1")).toBe(false);
  });

  it("returns synthetic discipline copy only for the fixture path", () => {
    expect(secureNowSyntheticFixtureDisciplineForPathId(SECURENOW_DEMO_FIXTURE_PATH_ID)).toBe(
      SECURENOW_SYNTHETIC_FIXTURE_DISCIPLINE,
    );
    expect(secureNowSyntheticFixtureDisciplineForPathId("fixture-path-03")).toBe(
      SECURENOW_SYNTHETIC_FIXTURE_DISCIPLINE,
    );
    expect(secureNowSyntheticFixtureDisciplineForPathId("other")).toBeNull();
  });
});
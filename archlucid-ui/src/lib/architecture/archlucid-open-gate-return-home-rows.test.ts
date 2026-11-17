import { describe, expect, it } from "vitest";

import {
  ARCHLUCID_RETURN_HOME_WALKTHROUGH_HREF,
  buildArchLucidOpenGateReturnHomeRowsWithRecommendedFirst,
} from "./archlucid-open-gate-return-home-rows";

describe("archlucid open gate return home rows", () => {
  it("marks the first-review walkthrough when no open gate is stored", () => {
    const rows = buildArchLucidOpenGateReturnHomeRowsWithRecommendedFirst(null);

    expect(rows[0]?.href).toBe(ARCHLUCID_RETURN_HOME_WALKTHROUGH_HREF);
    expect(rows[0]?.recommendedFirst).toBe(true);
  });
});

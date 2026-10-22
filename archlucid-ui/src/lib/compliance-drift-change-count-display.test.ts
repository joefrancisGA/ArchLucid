import { describe, expect, it } from "vitest";

import { presentComplianceDriftChangeCount } from "./compliance-drift-change-count-display";

describe("presentComplianceDriftChangeCount", () => {
  it("labels missing counts", () => {
    expect(presentComplianceDriftChangeCount(undefined).display).toBe("Not returned");
    expect(presentComplianceDriftChangeCount(null).known).toBe(false);
  });

  it("formats finite counts", () => {
    expect(presentComplianceDriftChangeCount(3)).toEqual({
      known: true,
      display: "3",
      numeric: 3,
    });
  });
});

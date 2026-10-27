import { describe, expect, it } from "vitest";

import { findingSeverityLabel } from "./finding-severity-label";

describe("findingSeverityLabel", () => {
  it("maps contract enum values", () => {
    expect(findingSeverityLabel(0)).toBe("Info");
    expect(findingSeverityLabel(1)).toBe("Warning");
    expect(findingSeverityLabel(2)).toBe("Error");
    expect(findingSeverityLabel(3)).toBe("Critical");
  });

  it("falls back for unknown severity and undefined", () => {
    expect(findingSeverityLabel(99)).toBe("Severity label was not stored.");
    expect(findingSeverityLabel(undefined)).toBe("Severity was not stored.");
    expect(findingSeverityLabel(null)).toBe("Severity was not stored.");
  });
});

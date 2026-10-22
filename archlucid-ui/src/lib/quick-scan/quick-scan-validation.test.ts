import { describe, expect, it } from "vitest";

import { QUICK_SCAN_EXAMPLE_FORM } from "./quick-scan-example";
import { buildQuickScanRequestBody, validateQuickScanForm } from "./quick-scan-validation";

describe("quick-scan-validation", () => {
  it("requires system name, environment, and description", () => {
    const errors = validateQuickScanForm({
      systemName: "",
      primaryEnvironment: "",
      primaryEnvironmentOther: "",
      description: "",
      architectureConcerns: [],
    });

    expect(errors.systemName).toBeTruthy();
    expect(errors.primaryEnvironment).toBeTruthy();
    expect(errors.description).toBeTruthy();
  });

  it("enforces description length", () => {
    const errors = validateQuickScanForm({
      systemName: "API",
      primaryEnvironment: "Azure",
      primaryEnvironmentOther: "",
      description: "x".repeat(1501),
      architectureConcerns: [],
    });

    expect(errors.description).toMatch(/1500/);
  });

  it("allows up to three architecture concerns", () => {
    const errors = validateQuickScanForm({
      ...QUICK_SCAN_EXAMPLE_FORM,
      architectureConcerns: ["Security", "Reliability", "Cost", "Performance"],
    });

    expect(errors.architectureConcerns).toMatch(/at most 3/i);
  });

  it("builds API payload with validated environment", () => {
    const body = buildQuickScanRequestBody(QUICK_SCAN_EXAMPLE_FORM);

    expect(body.primaryEnvironment).toBe("Azure");
    expect(body.systemName).toBe("Claims intake API");
    expect(body.architectureConcerns).toEqual(["Security", "Reliability", "Compliance"]);
  });
});

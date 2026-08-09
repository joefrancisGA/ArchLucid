import { describe, expect, it } from "vitest";

import {
  exactSeverityCriticalExcludedWarning,
  formatAlertRoutingThresholdPreview,
  formatMinimumSeverityPreview,
  resolveEffectiveAlertSeverities,
  validateAlertRoutingDestination,
  validateAlertRoutingName,
} from "./alert-routing-form";

describe("alert-routing-form", () => {
  it("previews High minimum severity as High and Critical", () => {
    expect(formatMinimumSeverityPreview("High")).toBe(
      "This destination will receive High and Critical alerts.",
    );
  });

  it("uses exact severities for the threshold preview when provided", () => {
    expect(
      formatAlertRoutingThresholdPreview("High", ["High"]).preview,
    ).toBe("This destination will receive High alerts only.");

    expect(resolveEffectiveAlertSeverities("High", ["Warning", "High"])).toEqual(["Warning", "High"]);
  });

  it("warns when exact severities exclude Critical at a High minimum", () => {
    expect(exactSeverityCriticalExcludedWarning("High", ["High"])).toMatch(/Critical alerts are excluded/i);
    expect(exactSeverityCriticalExcludedWarning("High", [])).toBeNull();
    expect(exactSeverityCriticalExcludedWarning("Critical", ["Critical"])).toBeNull();
  });

  it("validates email destinations with one or more addresses", () => {
    expect(validateAlertRoutingDestination("Email", "ops@example.com, security@example.com")).toBeNull();
    expect(validateAlertRoutingDestination("Email", "not-an-email")).toMatch(/valid email/i);
  });

  it("requires HTTPS webhook URLs", () => {
    expect(validateAlertRoutingDestination("SlackWebhook", "https://hooks.example.com/slack")).toBeNull();
    expect(validateAlertRoutingDestination("SlackWebhook", "http://hooks.example.com/slack")).toMatch(/HTTPS/i);
  });

  it("requires a destination name", () => {
    expect(validateAlertRoutingName("  ")).toMatch(/name/i);
    expect(validateAlertRoutingName("Production alerts")).toBeNull();
  });
});

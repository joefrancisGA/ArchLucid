import { describe, expect, it } from "vitest";

import { resolveTroubleshootingPlatformStatus } from "@/lib/troubleshooting-platform-status";

describe("troubleshooting-platform-status", () => {
  it("maps healthy readiness to ready", () => {
    expect(resolveTroubleshootingPlatformStatus({ status: "Healthy", entries: [] })).toEqual({
      kind: "ready",
      label: "Platform healthy",
    });
  });

  it("maps unhealthy readiness to blocked", () => {
    expect(resolveTroubleshootingPlatformStatus({ status: "Unhealthy", entries: [] })).toEqual({
      kind: "blocked",
      label: "Platform unhealthy",
    });
  });

  it("maps null to unavailable", () => {
    expect(resolveTroubleshootingPlatformStatus(null)).toEqual({
      kind: "neutral",
      label: "Status unavailable",
    });
  });

  it("rolls up degraded entries when overall status is healthy", () => {
    expect(
      resolveTroubleshootingPlatformStatus({
        status: "Healthy",
        entries: [{ name: "data_archival", status: "Degraded" }],
      }),
    ).toEqual({
      kind: "needs-attention",
      label: "Platform degraded",
    });
  });
});

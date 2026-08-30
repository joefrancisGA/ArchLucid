import { describe, expect, it } from "vitest";

import {
  buildWorkspaceHealthRedirectHref,
  isWorkspaceHealthPath,
  LEGACY_SPONSOR_DASHBOARD_WORKSPACE_HEALTH_HASH,
  LEGACY_SPONSOR_DASHBOARD_WORKSPACE_HEALTH_HASH_FRAGMENT,
  WORKSPACE_HEALTH_PATH,
} from "@/lib/workspace-health-route";

describe("isWorkspaceHealthPath", () => {
  it("matches the canonical workspace health path", () => {
    expect(isWorkspaceHealthPath(WORKSPACE_HEALTH_PATH)).toBe(true);
  });

  it("matches nested workspace health routes", () => {
    expect(isWorkspaceHealthPath(`${WORKSPACE_HEALTH_PATH}/details`)).toBe(true);
  });

  it("rejects lookalike paths", () => {
    expect(isWorkspaceHealthPath("/insights/workspace-healthish")).toBe(false);
    expect(isWorkspaceHealthPath("/insights/workspace-health-extra")).toBe(false);
    expect(isWorkspaceHealthPath("/governance/dashboard")).toBe(false);
  });
});

describe("buildWorkspaceHealthRedirectHref", () => {
  it("returns the canonical path when search params are absent", () => {
    expect(buildWorkspaceHealthRedirectHref({})).toBe(WORKSPACE_HEALTH_PATH);
  });

  it("preserves legacy bookmark query strings", () => {
    expect(buildWorkspaceHealthRedirectHref({ utm_source: "email" })).toBe(
      `${WORKSPACE_HEALTH_PATH}?utm_source=email`,
    );
    expect(buildWorkspaceHealthRedirectHref({ status: "Open", cursor: "abc" })).toBe(
      `${WORKSPACE_HEALTH_PATH}?status=Open&cursor=abc`,
    );
  });

  it("preserves repeated query params", () => {
    expect(buildWorkspaceHealthRedirectHref({ tag: ["a", "b"] })).toBe(
      `${WORKSPACE_HEALTH_PATH}?tag=a&tag=b`,
    );
  });
});

describe("legacy sponsor-dashboard workspace health hash constants", () => {
  it("keeps the hash fragment aligned with the legacy section id", () => {
    expect(LEGACY_SPONSOR_DASHBOARD_WORKSPACE_HEALTH_HASH_FRAGMENT).toBe(
      `#${LEGACY_SPONSOR_DASHBOARD_WORKSPACE_HEALTH_HASH}`,
    );
  });
});

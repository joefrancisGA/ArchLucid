import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getDemoSampleAuditTrailEvents,
  shouldPreferCuratedAuditTrailForBuyerShell,
} from "@/lib/demo-audit-sample-events";

const demoUiEnvMock = vi.hoisted(() => ({
  buyerPolished: true,
  demoMode: false,
  staticOperator: false,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => demoUiEnvMock.buyerPolished,
    isNextPublicDemoMode: () => demoUiEnvMock.demoMode,
  };
});

vi.mock("@/lib/operator/operator-static-demo", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/operator/operator-static-demo")>();

  return {
    ...actual,
    isOperatorDemoStaticMode: () => demoUiEnvMock.staticOperator,
  };
});

const emptyFilters = {
  eventType: "",
  fromUtc: "",
  toUtc: "",
  correlationId: "",
  actorUserId: "",
  runId: "",
};

describe("getDemoSampleAuditTrailEvents", () => {
  afterEach(() => {
    demoUiEnvMock.buyerPolished = true;
  });

  it("sanitizes demo-prefixed ids in buyer-polished shell (BDA-006)", () => {
    const events = getDemoSampleAuditTrailEvents();

    expect(events.length).toBeGreaterThan(0);
    expect(events.some((event) => (event.actorUserId ?? "").includes("demo-jordan"))).toBe(false);
    expect(events.some((event) => (event.tenantId ?? "") === "demo-tenant")).toBe(false);
  });
});

describe("shouldPreferCuratedAuditTrailForBuyerShell", () => {
  afterEach(() => {
    demoUiEnvMock.buyerPolished = true;
    demoUiEnvMock.demoMode = false;
    demoUiEnvMock.staticOperator = false;
  });

  it("does not prefer curated rows in buyer tenant without explicit demo build", () => {
    expect(shouldPreferCuratedAuditTrailForBuyerShell(emptyFilters)).toBe(false);
  });

  it("prefers curated rows when explicit demo marketing build is enabled", () => {
    demoUiEnvMock.demoMode = true;

    expect(shouldPreferCuratedAuditTrailForBuyerShell(emptyFilters)).toBe(true);
  });
});

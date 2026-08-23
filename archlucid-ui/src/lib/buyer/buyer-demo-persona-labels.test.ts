import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ACTION_ACTOR_UNAVAILABLE } from "@/lib/action-actor-display";
import {
  buyerSafeActorDisplayName,
  buyerSafeGovernanceActorLabel,
  buyerSafeTechnicalIdLabel,
  sanitizeAuditEventForBuyerPolishedShell,
} from "@/lib/buyer/buyer-demo-persona-labels";

describe("buyer-demo-persona-labels (TB-273 / 5CZ-demo)", () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    process.env.NEXT_PUBLIC_DEMO_MODE = "true";
  });

  afterEach(() => {
    process.env = { ...envBackup };
  });

  it("preserves actor names for action attribution and returns N/A when missing", () => {
    expect(buyerSafeActorDisplayName("Jordan Lee", "finalize.run")).toBe("Jordan Lee");
    expect(buyerSafeActorDisplayName("Taylor Morgan", "com.archlucid.governance.approval.recorded")).toBe(
      "Taylor Morgan",
    );
    expect(buyerSafeGovernanceActorLabel("Jordan Lee")).toBe("Jordan Lee");
    expect(buyerSafeGovernanceActorLabel(null)).toBe(ACTION_ACTOR_UNAVAILABLE);
  });

  it("redacts demo-prefixed technical ids", () => {
    expect(buyerSafeTechnicalIdLabel("demo-jordan")).toBe("Recorded in workspace audit trail");
    expect(buyerSafeTechnicalIdLabel("corr-intake-demo-request")).toBe("Recorded in workspace audit trail");
    expect(buyerSafeTechnicalIdLabel("evt-abc-123")).toBe("evt-abc-123");
  });

  it("sanitizes curated audit events for buyer shell", () => {
    const sanitized = sanitizeAuditEventForBuyerPolishedShell({
      eventId: "demo-audit-run-started",
      occurredUtc: "2026-01-10T09:15:22.000Z",
      eventType: "RunStarted",
      actorUserId: "demo-jordan",
      actorUserName: "Jordan Lee",
      tenantId: "demo-tenant",
      workspaceId: "demo-workspace",
      projectId: "default",
      runId: "customer-intake-modernization",
      manifestId: null,
      artifactId: null,
      dataJson: "{}",
      correlationId: "corr-intake-demo-request",
    });

    expect(sanitized.actorUserName).toBe("Jordan Lee");
    expect(sanitized.tenantId).toBe("workspace");
    expect(sanitized.correlationId).toBe("Recorded in workspace audit trail");
  });
});

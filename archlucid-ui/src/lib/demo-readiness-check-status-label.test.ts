import { describe, expect, it } from "vitest";

import {
  demoReadinessCheckStatusKind,
  demoReadinessCheckStatusLabel,
} from "@/lib/demo-readiness-check-status-label";

describe("demo-readiness-check-status-label (TB-1413)", () => {
  it("maps check statuses to scan-friendly status vocabulary", () => {
    expect(demoReadinessCheckStatusLabel("pass")).toBe("Pass");
    expect(demoReadinessCheckStatusLabel("warn")).toBe("Warn");
    expect(demoReadinessCheckStatusLabel("fail")).toBe("Fail");
    expect(demoReadinessCheckStatusLabel("pending")).toBe("Pending");
  });

  it("maps check statuses to enterprise StatusTag kinds", () => {
    expect(demoReadinessCheckStatusKind("pass")).toBe("ready");
    expect(demoReadinessCheckStatusKind("warn")).toBe("needs-attention");
    expect(demoReadinessCheckStatusKind("pending")).toBe("needs-attention");
    expect(demoReadinessCheckStatusKind("fail")).toBe("blocked");
  });
});

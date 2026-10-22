import { describe, expect, it } from "vitest";

import {
  buildCtoDemoAuditFilterQueryString,
  isCtoDemoAuditFilterActive,
  isCtoDemoRelevantAuditEvent,
} from "@/lib/cto-demo-audit-filter";

describe("cto-demo-audit-filter", () => {
  it("matches demo-relevant lifecycle event types", () => {
    expect(isCtoDemoRelevantAuditEvent("RunStarted")).toBe(true);
    expect(isCtoDemoRelevantAuditEvent("findings.snapshot.created")).toBe(true);
    expect(isCtoDemoRelevantAuditEvent("finalize.run")).toBe(true);
    expect(isCtoDemoRelevantAuditEvent("artifact.bundle.created")).toBe(true);
    expect(isCtoDemoRelevantAuditEvent("context.snapshot.created")).toBe(false);
  });

  it("builds and detects the demo filter query param", () => {
    expect(buildCtoDemoAuditFilterQueryString()).toBe("filter=demo");
    expect(isCtoDemoAuditFilterActive("demo")).toBe(true);
    expect(isCtoDemoAuditFilterActive("all")).toBe(false);
  });
});

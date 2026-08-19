import { describe, expect, it } from "vitest";

import {
  UX_AUDIT_EXPECTED_PNG_TOTAL,
  UX_AUDIT_MARKETING_ROUTE_COUNT,
  UX_AUDIT_MARKETING_ROUTES,
  UX_AUDIT_OPERATOR_BUYER_ROUTE_COUNT,
  UX_AUDIT_OPERATOR_BUYER_ROUTES,
  resolveUxAuditShellMode,
} from "../e2e/ux-audit-route-registry";

describe("ux-audit-route-registry", () => {
  it("keeps persona route counts aligned with run-ux-audit.ps1 validation", () => {
    expect(UX_AUDIT_OPERATOR_BUYER_ROUTE_COUNT).toBe(14);
    expect(UX_AUDIT_MARKETING_ROUTE_COUNT).toBe(2);
    expect(UX_AUDIT_EXPECTED_PNG_TOTAL).toBe(30);
  });

  it("uses unique slugs within each capture mode", () => {
    const buyerOperatorSlugs = UX_AUDIT_OPERATOR_BUYER_ROUTES.map((route) => route.slug);
    const marketingSlugs = UX_AUDIT_MARKETING_ROUTES.map((route) => route.slug);

    expect(new Set(buyerOperatorSlugs).size).toBe(buyerOperatorSlugs.length);
    expect(new Set(marketingSlugs).size).toBe(marketingSlugs.length);
  });

  it("scopes audit capture to review context", () => {
    const auditRoute = UX_AUDIT_OPERATOR_BUYER_ROUTES.find((route) => route.slug === "audit");

    expect(auditRoute?.href).toMatch(/\/audit\?runId=/);
  });

  it("maps Playwright project names to shell capture modes", () => {
    expect(resolveUxAuditShellMode("chromium-ux-audit-buyer")).toBe("buyer");
    expect(resolveUxAuditShellMode("chromium-ux-audit-operator")).toBe("operator");
    expect(resolveUxAuditShellMode("chromium-ux-audit-marketing")).toBe("marketing");
    expect(resolveUxAuditShellMode("chromium")).toBeNull();
  });
});

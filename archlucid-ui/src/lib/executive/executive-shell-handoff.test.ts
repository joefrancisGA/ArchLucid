import { describe, expect, it } from "vitest";

import { EXECUTIVE_DASHBOARD_HREF } from "@/lib/executive/executive-dashboard-route";
import { executiveShellHandoffLinkLabel, isOperatorShellHandoffHref } from "@/lib/executive/executive-shell-handoff";

describe("executive-shell-handoff", () => {
  it("treats operator destinations as handoffs", () => {
    expect(isOperatorShellHandoffHref(EXECUTIVE_DASHBOARD_HREF)).toBe(true);
    expect(isOperatorShellHandoffHref("/architecture/reviews?filter=orphan-candidates")).toBe(true);
    expect(isOperatorShellHandoffHref("/insights/pilot-outcomes")).toBe(true);
    expect(isOperatorShellHandoffHref("/value-report/pilot")).toBe(true);
  });

  it("treats help and auth routes as in-shell", () => {
    expect(isOperatorShellHandoffHref("/help/getting-started")).toBe(false);
    expect(isOperatorShellHandoffHref("/auth/signin")).toBe(false);
  });

  it("labels operator handoffs explicitly", () => {
    expect(executiveShellHandoffLinkLabel(EXECUTIVE_DASHBOARD_HREF)).toBe("Open in Operator →");
  });
});

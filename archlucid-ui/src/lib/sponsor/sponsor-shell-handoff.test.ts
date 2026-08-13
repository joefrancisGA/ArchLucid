import { describe, expect, it } from "vitest";

import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor/sponsor-dashboard-route";
import { executiveShellHandoffLinkLabel, isOperatorShellHandoffHref } from "@/lib/sponsor/sponsor-shell-handoff";

describe("sponsor-shell-handoff", () => {
  it("treats operator destinations as handoffs", () => {
    expect(isOperatorShellHandoffHref(SPONSOR_DASHBOARD_HREF)).toBe(true);
    expect(isOperatorShellHandoffHref("/architecture/reviews?filter=orphan-candidates")).toBe(true);
    expect(isOperatorShellHandoffHref("/insights/pilot-outcomes")).toBe(true);
    expect(isOperatorShellHandoffHref("/value-report/pilot")).toBe(true);
  });

  it("treats help and auth routes as in-shell", () => {
    expect(isOperatorShellHandoffHref("/help/getting-started")).toBe(false);
    expect(isOperatorShellHandoffHref("/auth/signin")).toBe(false);
  });

  it("labels operator handoffs explicitly", () => {
    expect(executiveShellHandoffLinkLabel(SPONSOR_DASHBOARD_HREF)).toBe("Open in Operator →");
  });
});

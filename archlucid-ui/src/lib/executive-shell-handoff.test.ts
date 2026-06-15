import { describe, expect, it } from "vitest";

import { executiveShellHandoffLinkLabel, isOperatorShellHandoffHref } from "@/lib/executive-shell-handoff";

describe("executive-shell-handoff", () => {
  it("treats operator destinations as handoffs", () => {
    expect(isOperatorShellHandoffHref("/governance/dashboard")).toBe(true);
    expect(isOperatorShellHandoffHref("/reviews?filter=orphan-candidates")).toBe(true);
    expect(isOperatorShellHandoffHref("/value-report/pilot")).toBe(true);
  });

  it("treats executive and auth routes as in-shell", () => {
    expect(isOperatorShellHandoffHref("/executive/reviews")).toBe(false);
    expect(isOperatorShellHandoffHref("/auth/signin")).toBe(false);
  });

  it("labels operator handoffs explicitly", () => {
    expect(executiveShellHandoffLinkLabel("/governance/dashboard")).toBe("Open in Operator →");
    expect(executiveShellHandoffLinkLabel("/executive/reviews")).toBe("View →");
  });
});

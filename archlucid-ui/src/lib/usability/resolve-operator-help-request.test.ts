import { describe, expect, it } from "vitest";

import { resolveOperatorHelpRequestForPathname } from "@/lib/usability/resolve-operator-help-request";

describe("resolveOperatorHelpRequestForPathname", () => {
  it("navigates to the mapped help topic for operator routes with a slug", () => {
    expect(resolveOperatorHelpRequestForPathname("/governance/alerts")).toEqual({
      kind: "navigate",
      href: "/help/alerts",
    });
  });

  it("opens the drawer when the route has no job-matched help slug", () => {
    expect(resolveOperatorHelpRequestForPathname("/why-archlucid")).toEqual({
      kind: "drawer",
    });
    expect(resolveOperatorHelpRequestForPathname("/architecture/first-review-guide")).toEqual({
      kind: "drawer",
    });
    expect(resolveOperatorHelpRequestForPathname("/administration/settings")).toEqual({
      kind: "drawer",
    });
  });

  it("navigates home to first-architecture-review in Guided mode", () => {
    expect(resolveOperatorHelpRequestForPathname("/")).toEqual({
      kind: "navigate",
      href: "/help/first-architecture-review",
    });
  });

  it("navigates home to getting-started in Working mode (WA-04)", () => {
    expect(resolveOperatorHelpRequestForPathname("/", { workingMode: true })).toEqual({
      kind: "navigate",
      href: "/help/getting-started",
    });
  });

  it("opens the drawer on in-app help routes instead of reloading the same article", () => {
    expect(resolveOperatorHelpRequestForPathname("/help/findings")).toEqual({
      kind: "drawer",
    });
  });
});

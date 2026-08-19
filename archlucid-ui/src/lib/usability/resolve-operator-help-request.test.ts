import { describe, expect, it } from "vitest";

import { resolveOperatorHelpRequestForPathname } from "@/lib/usability/resolve-operator-help-request";

describe("resolveOperatorHelpRequestForPathname", () => {
  it("navigates to the mapped help topic for operator routes with a slug", () => {
    expect(resolveOperatorHelpRequestForPathname("/governance/alerts")).toEqual({
      kind: "navigate",
      href: "/help/alerts",
    });
  });

  it("includes hash fragments when the topic map specifies one", () => {
    expect(resolveOperatorHelpRequestForPathname("/why-archlucid")).toEqual({
      kind: "navigate",
      href: "/help/getting-started#how-archlucid-works",
    });
  });

  it("opens the drawer on in-app help routes instead of reloading the same article", () => {
    expect(resolveOperatorHelpRequestForPathname("/help/findings")).toEqual({
      kind: "drawer",
    });
  });

  it("opens the drawer when the route has no job-matched help slug", () => {
    expect(resolveOperatorHelpRequestForPathname("/governance/decision-register")).toEqual({
      kind: "drawer",
    });
    expect(resolveOperatorHelpRequestForPathname("/administration/settings")).toEqual({
      kind: "drawer",
    });
  });
});

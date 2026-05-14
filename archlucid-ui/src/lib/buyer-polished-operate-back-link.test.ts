import { describe, expect, it } from "vitest";

import { buyerPolishedOperateBackLink } from "./buyer-polished-operate-back-link";

describe("buyerPolishedOperateBackLink", () => {
  it("returns showcase package link for golden-path satellites", () => {
    expect(buyerPolishedOperateBackLink("/graph?runId=x")).toEqual({
      label: "Back to review package",
      href: "/reviews/claims-intake-modernization",
    });
    expect(buyerPolishedOperateBackLink("/audit")).toEqual({
      label: "Back to review package",
      href: "/reviews/claims-intake-modernization",
    });
    expect(buyerPolishedOperateBackLink("/manifests/a1c2e3f4-a5b6-7890-abcd-ef1234567890")).toEqual({
      label: "Back to review package",
      href: "/reviews/claims-intake-modernization",
    });
    expect(buyerPolishedOperateBackLink("/ask")).toEqual({
      label: "Back to review package",
      href: "/reviews/claims-intake-modernization",
    });
  });

  it("returns null when already on or under the showcase package", () => {
    expect(buyerPolishedOperateBackLink("/reviews/claims-intake-modernization")).toBeNull();
    expect(buyerPolishedOperateBackLink("/reviews/claims-intake-modernization/findings/f1")).toBeNull();
    expect(buyerPolishedOperateBackLink("/")).toBeNull();
  });
});

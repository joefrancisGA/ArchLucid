import { describe, expect, it } from "vitest";

import {
  INFRASTRUCTURE_ASK_OPEN_PARAM,
  buildInfrastructureAskHandoffHref,
  infrastructureAskDrawerCloseHref,
  tryResolveInfrastructureAskOverlayHref,
} from "@/lib/infra-evidence/infrastructure-ask-drawer-url";

describe("buildInfrastructureAskHandoffHref", () => {
  it("opens a drawer on the diagrams workbench with scoped params", () => {
    const href = buildInfrastructureAskHandoffHref(
      "/infrastructure/diagrams",
      "snapshotId=11111111-1111-1111-1111-111111111111",
      { snapshotId: "11111111-1111-1111-1111-111111111111", hubTab: "diagram" },
    );

    expect(href).toContain("/infrastructure/diagrams?");
    expect(href).toContain(`${INFRASTRUCTURE_ASK_OPEN_PARAM}=1`);
    expect(href).toContain("tab=diagram");
    expect(href).not.toContain("/infrastructure/ask");
  });

  it("falls back to the full Ask page off infrastructure workbenches", () => {
    const href = buildInfrastructureAskHandoffHref(
      "/governance/findings",
      "",
      { snapshotId: "11111111-1111-1111-1111-111111111111" },
    );

    expect(href).toBe(
      "/governance/infrastructure/ask?snapshotId=11111111-1111-1111-1111-111111111111",
    );
  });
});

describe("infrastructureAskDrawerCloseHref", () => {
  it("removes only the drawer open flag", () => {
    expect(
      infrastructureAskDrawerCloseHref(
        "/infrastructure/diagrams",
        "snapshotId=abc&infrastructureAskOpen=1",
      ),
    ).toBe("/infrastructure/diagrams?snapshotId=abc");
  });
});

describe("tryResolveInfrastructureAskOverlayHref", () => {
  it("keeps the operator on the current diagrams page", () => {
    const href = tryResolveInfrastructureAskOverlayHref(
      "/infrastructure/ask",
      "/infrastructure/diagrams",
      "snapshotId=abc",
    );

    expect(href).toBe("/infrastructure/diagrams?snapshotId=abc&infrastructureAskOpen=1");
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buyerPolishedShellVitestOverride,
  extendBuyerPolishedShellVitestMock,
} from "@/testing/buyer-polished-shell-vitest-override";

vi.mock("@/hooks/use-governance-mode", () => ({
  useGovernanceMode: () => ({
    mounted: true,
    isGovernanceModeEnabled: true,
    vocabulary: {
      authorityChainLabel: "Authority chain",
    },
  }),
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) =>
  extendBuyerPolishedShellVitestMock(importOriginal),
);

import { RunDetailActivityTabSectionNav } from "@/components/runs/RunDetailActivityTabSectionNav";

describe("RunDetailActivityTabSectionNav", () => {
  beforeEach(() => {
    buyerPolishedShellVitestOverride.value = false;
  });

  it("renders on-this-page anchors for activity tab sections", () => {
    render(<RunDetailActivityTabSectionNav placement="inline-top" />);

    fireEvent.click(screen.getByRole("button", { name: /On this page/i }));

    expect(screen.getByRole("link", { name: "Recent lifecycle events" })).toHaveAttribute(
      "href",
      "#pipeline-timeline",
    );
    expect(screen.getByRole("link", { name: "Review progress" })).toHaveAttribute(
      "href",
      "#pipeline-stages",
    );
    expect(screen.getByRole("link", { name: "Records and diagnostics" })).toHaveAttribute(
      "href",
      "#records-and-diagnostics",
    );
    expect(screen.getByRole("link", { name: "Diagnostics" })).toHaveAttribute(
      "href",
      "#agent-forensics",
    );
  });

  it("renders desktop sidebar navigation with at least three section links", () => {
    render(<RunDetailActivityTabSectionNav placement="sidebar" />);

    const desktopNav = screen.getByTestId("provenance-section-nav-desktop");
    expect(desktopNav).toBeInTheDocument();
    expect(desktopNav.querySelectorAll("a[href^='#']").length).toBeGreaterThanOrEqual(3);
  });
});

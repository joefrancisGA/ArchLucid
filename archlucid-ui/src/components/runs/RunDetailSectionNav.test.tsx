import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buyerPolishedShellVitestOverride,
  extendBuyerPolishedShellVitestMock,
} from "@/testing/buyer-polished-shell-vitest-override";

vi.mock("@/lib/demo-ui-env", async (importOriginal) =>
  extendBuyerPolishedShellVitestMock(importOriginal),
);

import { RunDetailSectionNav } from "@/components/runs/RunDetailSectionNav";

describe("RunDetailSectionNav", () => {
  /** Pinned in `vitest.setup.ts` so tests default to full-operator shell (`top-16`). */
  const pinnedOperatorExperience = process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE;

  beforeEach(() => {
    buyerPolishedShellVitestOverride.value = null;
  });

  afterEach(() => {
    buyerPolishedShellVitestOverride.value = null;
    process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE = pinnedOperatorExperience;
    vi.unstubAllGlobals();
  });

  it("renders reviewTab links when at least three tabs are available", () => {
    render(
      <RunDetailSectionNav
        runId="run-abc"
        sections={[
          { id: "overview", label: "Overview", available: true },
          { id: "findings", label: "Findings", available: true },
          { id: "evidence", label: "Evidence", available: true },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute(
      "href",
      "/architecture/reviews/run-abc?reviewTab=overview",
    );
    expect(screen.getByRole("link", { name: "Findings" })).toHaveAttribute(
      "href",
      "/architecture/reviews/run-abc?reviewTab=findings",
    );
  });

  it("returns null when fewer than three sections are available", () => {
    const { container } = render(
      <RunDetailSectionNav
        runId="run-abc"
        sections={[
          { id: "overview", label: "Overview", available: true },
          { id: "findings", label: "Findings", available: true },
          { id: "evidence", label: "Evidence", available: false },
        ]}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("uses top-16 sticky offset when full-operator experience is active", () => {
    buyerPolishedShellVitestOverride.value = false;
    process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE = "operator";

    const { getByRole } = render(
      <RunDetailSectionNav
        runId="run-abc"
        sections={[
          { id: "overview", label: "Overview", available: true },
          { id: "findings", label: "Findings", available: true },
          { id: "evidence", label: "Evidence", available: true },
        ]}
      />,
    );

    const nav = getByRole("navigation", { name: "Review detail sections" });

    expect(nav.className).toContain("top-16");
    expect(nav.className).not.toContain("top-40");
  });

  it("uses taller sticky offset when buyer-polished shell is active", () => {
    buyerPolishedShellVitestOverride.value = true;
    delete process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE;

    const { getByRole } = render(
      <RunDetailSectionNav
        runId="run-abc"
        sections={[
          { id: "overview", label: "Overview", available: true },
          { id: "findings", label: "Findings", available: true },
          { id: "evidence", label: "Evidence", available: true },
        ]}
      />,
    );

    const nav = getByRole("navigation", { name: "Review detail sections" });

    expect(nav.className).toContain("top-40");
    expect(nav.className).toContain("lg:top-44");
  });
});

import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RunDetailSectionNav } from "@/components/RunDetailSectionNav";

describe("RunDetailSectionNav", () => {
  /** Pinned in `vitest.setup.ts` so tests default to full-operator shell (`top-16`). */
  const pinnedOperatorExperience = process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE;

  beforeEach(() => {
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe = vi.fn();

        disconnect = vi.fn();

        takeRecords = vi.fn().mockReturnValue([]);

        constructor(cb: IntersectionObserverCallback, opts?: IntersectionObserverInit) {
          void cb;
          void opts;
        }
      },
    );
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE = pinnedOperatorExperience;
    vi.unstubAllGlobals();
  });

  it("renders section links when at least three sections are available", () => {
    render(
      <RunDetailSectionNav
        sections={[
          { id: "run-metadata", label: "Run", available: true },
          { id: "pipeline-timeline", label: "Timeline", available: true },
          { id: "run-actions", label: "Actions", available: true },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: "Run" })).toHaveAttribute("href", "#run-metadata");
    expect(screen.getByRole("link", { name: "Timeline" })).toHaveAttribute("href", "#pipeline-timeline");
  });

  it("returns null when fewer than three sections are available", () => {
    const { container } = render(
      <RunDetailSectionNav
        sections={[
          { id: "a", label: "A", available: true },
          { id: "b", label: "B", available: true },
          { id: "c", label: "C", available: false },
        ]}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("uses top-16 sticky offset when full-operator experience is active", () => {
    process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE = "operator";

    const { getByRole } = render(
      <RunDetailSectionNav
        sections={[
          { id: "run-metadata", label: "Run", available: true },
          { id: "pipeline-timeline", label: "Timeline", available: true },
          { id: "run-actions", label: "Actions", available: true },
        ]}
      />,
    );

    const nav = getByRole("navigation", { name: "Review detail sections" });

    expect(nav.className).toContain("top-16");
    expect(nav.className).not.toContain("top-40");
  });

  it("uses taller sticky offset when buyer-polished shell is active", () => {
    delete process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE;

    const { getByRole } = render(
      <RunDetailSectionNav
        sections={[
          { id: "run-metadata", label: "Run", available: true },
          { id: "pipeline-timeline", label: "Timeline", available: true },
          { id: "run-actions", label: "Actions", available: true },
        ]}
      />,
    );

    const nav = getByRole("navigation", { name: "Review detail sections" });

    expect(nav.className).toContain("top-40");
    expect(nav.className).toContain("lg:top-44");
  });
});

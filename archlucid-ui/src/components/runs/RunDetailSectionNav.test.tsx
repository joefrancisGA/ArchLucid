import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buyerPolishedShellVitestOverride,
  extendBuyerPolishedShellVitestMock,
} from "@/testing/buyer-polished-shell-vitest-override";

vi.mock("@/lib/demo-ui-env", async (importOriginal) =>
  extendBuyerPolishedShellVitestMock(importOriginal),
);

const pathnameMock = vi.hoisted(() => ({ value: "/architecture/reviews/run-abc" }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("reviewTab=overview"),
  usePathname: () => pathnameMock.value,
}));

import { RunDetailSectionNav } from "@/components/runs/RunDetailSectionNav";

describe("RunDetailSectionNav", () => {
  /** Pinned in `vitest.setup.ts` so tests default to full-operator shell (`top-16`). */
  const pinnedOperatorExperience = process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE;

  beforeEach(() => {
    buyerPolishedShellVitestOverride.value = null;
    class IntersectionObserverMock {
      observe = vi.fn();
      disconnect = vi.fn();
      unobserve = vi.fn();
      constructor() {}
    }

    vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
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

    const nav = getByRole("navigation", { name: "On this page sections" });

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

    const nav = getByRole("navigation", { name: "On this page sections" });

    expect(nav.className).toContain("top-40");
    expect(nav.className).toContain("lg:top-44");
  });

  it("AO-33: uses nested review tab hrefs on architecture nested routes", () => {
    pathnameMock.value = "/architecture/architectures/architecture-identity-001/reviews/run-abc";

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

    expect(screen.getByRole("link", { name: "Findings" })).toHaveAttribute(
      "href",
      "/architecture/architectures/architecture-identity-001/reviews/run-abc?reviewTab=findings",
    );

    pathnameMock.value = "/architecture/reviews/run-abc";
  });

  it("scrolls to in-page section anchors on click", () => {
    const scrollIntoView = vi.fn();
    const target = document.createElement("section");
    target.id = "submitted-evidence-inventory";
    target.scrollIntoView = scrollIntoView;
    document.body.appendChild(target);

    render(
      <RunDetailSectionNav
        runId="run-abc"
        sections={[
          { id: "submitted-evidence-inventory", label: "Submitted evidence", available: true },
          { id: "artifacts-exports", label: "Deliverables", available: true },
          { id: "trust-evidence", label: "Evidence basis", available: true },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("link", { name: "Submitted evidence" }));

    expect(scrollIntoView).toHaveBeenCalled();
    target.remove();
  });
});

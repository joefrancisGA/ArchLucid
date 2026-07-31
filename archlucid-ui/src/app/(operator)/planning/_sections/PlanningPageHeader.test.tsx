import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { IMPROVEMENT_PLANNING_PAGE_SUBTITLE } from "@/lib/planning-page-copy";

vi.mock("next/navigation", () => ({
  usePathname: () => "/planning",
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { PlanningPageHeader } from "@/app/(operator)/planning/_sections/PlanningPageHeader";

describe("PlanningPageHeader", () => {
  it("renders h1, help, refresh, and last-updated metadata", () => {
    const onRefresh = vi.fn();

    render(
      <PlanningPageHeader
        subtitle={IMPROVEMENT_PLANNING_PAGE_SUBTITLE}
        refreshing={false}
        generatedUtc="2026-01-01T00:00:00.000Z"
        onRefresh={onRefresh}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Improvement planning" })).toBeInTheDocument();
    expect(screen.getByText(IMPROVEMENT_PLANNING_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("planning-refresh-button")).toBeInTheDocument();
    expect(screen.getByTestId("planning-last-updated")).toHaveTextContent(/Last updated/i);

    fireEvent.click(screen.getByTestId("planning-refresh-button"));

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});

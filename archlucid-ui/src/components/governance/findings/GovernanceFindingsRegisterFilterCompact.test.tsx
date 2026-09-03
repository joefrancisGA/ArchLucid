import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GovernanceFindingsRegisterFilterCompact } from "./GovernanceFindingsRegisterFilterCompact";

vi.mock("next/navigation", () => ({
  usePathname: () => "/governance/findings",
  useSearchParams: () => new URLSearchParams(""),
}));

describe("GovernanceFindingsRegisterFilterCompact", () => {
  it("renders All and Open filters with counts and clear action", () => {
    const onRegisterFilterChange = vi.fn();
    const onClearAllFilters = vi.fn();

    render(
      <GovernanceFindingsRegisterFilterCompact
        registerFilter="open"
        onRegisterFilterChange={onRegisterFilterChange}
        onClearAllFilters={onClearAllFilters}
        allCount={12}
        openCount={4}
      />,
    );

    expect(screen.getByRole("link", { name: "All (12)" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open (4)" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "All (12)" }));
    expect(onRegisterFilterChange).toHaveBeenCalledWith("all");
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(onClearAllFilters).toHaveBeenCalled();
  });
});

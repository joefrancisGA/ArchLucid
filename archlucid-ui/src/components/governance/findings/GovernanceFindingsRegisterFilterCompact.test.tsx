import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GovernanceFindingsRegisterFilterCompact } from "./GovernanceFindingsRegisterFilterCompact";

describe("GovernanceFindingsRegisterFilterCompact", () => {
  it("renders All and Open filters with clear action", () => {
    const onRegisterFilterChange = vi.fn();
    const onClearAllFilters = vi.fn();

    render(
      <GovernanceFindingsRegisterFilterCompact
        registerFilter="open"
        onRegisterFilterChange={onRegisterFilterChange}
        onClearAllFilters={onClearAllFilters}
      />,
    );

    expect(screen.getByTestId("governance-findings-register-filter-compact")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "All" }));
    expect(onRegisterFilterChange).toHaveBeenCalledWith("all");
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(onClearAllFilters).toHaveBeenCalled();
  });
});

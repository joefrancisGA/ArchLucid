import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GovernanceFindingsFilterBar } from "./GovernanceFindingsFilterBar";

describe("GovernanceFindingsFilterBar", () => {
  it("confirms before removing a saved filter preset", () => {
    const onRemovePreset = vi.fn();

    render(
      <GovernanceFindingsFilterBar
        registerFilter="all"
        onRegisterFilterChange={vi.fn()}
        jobView="all"
        onJobViewChange={vi.fn()}
        savedPresets={[{ id: "preset-1", label: "Open critical", filter: "open" }]}
        onSaveCurrentFilterAsPreset={vi.fn()}
        onRemovePreset={onRemovePreset}
        groupByResource={false}
        onToggleGroupByResource={vi.fn()}
        displayedRows={[]}
        filterableRows={[]}
      />,
    );

    fireEvent.click(screen.getByTestId("governance-findings-remove-preset-preset-1"));

    expect(screen.getByRole("heading", { name: /Remove saved filter/i })).toBeInTheDocument();
    expect(onRemovePreset).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Remove filter" }));

    expect(onRemovePreset).toHaveBeenCalledWith("preset-1");
  });
});

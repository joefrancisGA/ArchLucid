import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const navigationState = vi.hoisted(() => ({
  search: "",
  pathname: "/governance/findings",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationState.pathname,
  useRouter: () => ({
    replace: (href: string) => {
      const queryIndex = href.indexOf("?");
      navigationState.search = queryIndex >= 0 ? href.slice(queryIndex + 1) : "";
    },
    push: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(navigationState.search),
}));

import { GovernanceFindingsFilterBar } from "./GovernanceFindingsFilterBar";

describe("GovernanceFindingsFilterBar", () => {
  it("confirms before removing a saved filter preset", async () => {
    navigationState.search = "";
    const onRemovePreset = vi.fn();

    render(
      <GovernanceFindingsFilterBar
        registerFilter="all"
        onRegisterFilterChange={vi.fn()}
        jobView="all"
        onJobViewChange={vi.fn()}
        nlFacets={{ severity: null, status: null, titleKeywords: [] }}
        onNlFacetsChange={vi.fn()}
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

    await waitFor(() => {
      expect(screen.getByText("Remove saved filter?")).toBeInTheDocument();
    });
    expect(onRemovePreset).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Remove filter" }));

    expect(onRemovePreset).toHaveBeenCalledWith("preset-1");
  });
});

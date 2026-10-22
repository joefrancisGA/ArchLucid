import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("cmdk", async (importOriginal) => {
  const actual = await importOriginal<typeof import("cmdk")>();

  return {
    ...actual,
    useCommandState: (selector: (state: { search: string }) => unknown) => selector({ search: "payments" }),
  };
});

import { CommandPaletteArchitectureIdentitiesGroup } from "@/components/CommandPaletteArchitectureIdentitiesGroup";
import { Command, CommandList } from "@/components/ui/command";

const useArchitectureIdentitiesListQueryMock = vi.fn();

vi.mock("@/hooks/use-architecture-identities-list-query", () => ({
  useArchitectureIdentitiesListQuery: (...args: unknown[]) => useArchitectureIdentitiesListQueryMock(...args),
}));

describe("CommandPaletteArchitectureIdentitiesGroup (CA-34)", () => {
  it("opens the identity desk path for a matching architecture row", () => {
    useArchitectureIdentitiesListQueryMock.mockReturnValue({
      data: {
        items: [
          {
            architectureId: "architecture-identity-001",
            displayName: "Payments platform",
            updatedUtc: "2026-01-01T00:00:00Z",
            draftCount: 1,
            reviewCount: 1,
          },
        ],
      },
    });
    const onNavigate = vi.fn();

    render(
      <Command shouldFilter={false}>
        <CommandList>
          <CommandPaletteArchitectureIdentitiesGroup enabled onNavigate={onNavigate} />
        </CommandList>
      </Command>,
    );

    expect(screen.getByText("Open architecture Payments platform")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Open architecture Payments platform"));
    expect(onNavigate).toHaveBeenCalledWith("/architecture/architectures/architecture-identity-001");
  });
});

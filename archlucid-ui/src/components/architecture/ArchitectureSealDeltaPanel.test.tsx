import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArchitectureSealDeltaPanel } from "@/components/architecture/ArchitectureSealDeltaPanel";

const useArchitectureSealDeltaQuery = vi.fn();

vi.mock("@/hooks/use-architecture-seal-delta-query", () => ({
  useArchitectureSealDeltaQuery: (...args: unknown[]) => useArchitectureSealDeltaQuery(...args),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/created/arch-1",
  useRouter: () => ({
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
    push: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("ArchitectureSealDeltaPanel (PC-06)", () => {
  it("shows honesty copy and one changed assumption row", () => {
    useArchitectureSealDeltaQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        architectureId: "arch-1",
        hasPriorSeal: true,
        honestyCopy:
          "This panel compares your current draft to the last sealed record for orientation only.",
        diffs: [
          {
            section: "Assumptions",
            key: "Multi-region failover required",
            diffKind: "Added",
            afterValue: "Multi-region failover required",
          },
        ],
        latestSealedReviewRunId: "sealed-run",
      },
      refetch: vi.fn(),
    });

    render(<ArchitectureSealDeltaPanel architectureId="arch-1" currentReviewRunId="current-run" />);

    expect(screen.getByTestId("architecture-seal-delta-honesty")).toHaveTextContent("orientation only");
    expect(screen.getByTestId("architecture-seal-delta-row")).toHaveTextContent("Multi-region failover required");
    expect(screen.getByTestId("architecture-seal-delta-compare-link")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-seal-delta-what-if-link")).toBeInTheDocument();
  });

  it("shows empty state when no prior seal", () => {
    useArchitectureSealDeltaQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        architectureId: "arch-1",
        hasPriorSeal: false,
        honestyCopy: "Orientation only.",
        emptyStateCopy: "No prior sealed record for this architecture yet.",
        diffs: [],
      },
      refetch: vi.fn(),
    });

    render(<ArchitectureSealDeltaPanel architectureId="arch-1" />);

    expect(screen.getByTestId("architecture-seal-delta-empty")).toHaveTextContent("No prior sealed record");
  });
});

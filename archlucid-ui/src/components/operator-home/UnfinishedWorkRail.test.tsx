import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture-draft-registry";
import type { RunSummary } from "@/types/authority";

let mockDraftEntries: ArchitectureDraftRegistryEntry[] = [];

vi.mock("@/hooks/use-architecture-draft-registry-entries", () => ({
  useArchitectureDraftRegistryEntries: () => mockDraftEntries,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: import("react").ReactNode;
  } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { UnfinishedWorkRail } from "./UnfinishedWorkRail";

describe("UnfinishedWorkRail (TB-2209)", () => {
  beforeEach(() => {
    mockDraftEntries = [];
  });

  it("renders compact list when unfinished work exists", () => {
    mockDraftEntries = [
      {
        architectureId: "arch-1",
        displayName: "Payments edge",
        customerStatus: "draft",
        ownerLabel: "You",
        lastUpdatedUtc: "2026-08-10T12:00:00Z",
        linkedReviewId: null,
        serverUpdatedUtc: "2026-08-10T12:00:00Z",
      },
    ];

    render(<UnfinishedWorkRail runs={[]} />);

    expect(screen.getByTestId("unfinished-work-rail")).toBeInTheDocument();
    expect(screen.getByText("Continue where you left off")).toBeInTheDocument();
    expect(screen.getByText("Payments edge")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Payments edge/i })).toHaveAttribute(
      "href",
      "/architecture/architectures/arch-1",
    );
  });

  it("hides when empty", () => {
    mockDraftEntries = [];
    const { container } = render(<UnfinishedWorkRail runs={[] as RunSummary[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("surfaces mid-execute reviews from runs props", () => {
    mockDraftEntries = [];
    const runs = [
      {
        runId: "run-mid",
        projectId: "default",
        createdUtc: "2026-08-10T11:00:00Z",
        description: "Edge review in flight",
        hasFindingsSnapshot: false,
        hasGoldenManifest: false,
      },
    ] as RunSummary[];

    render(<UnfinishedWorkRail runs={runs} />);

    expect(screen.getByTestId("unfinished-work-rail")).toBeInTheDocument();
    expect(screen.getByText("Edge review in flight")).toBeInTheDocument();
    expect(screen.getByText("In progress")).toBeInTheDocument();
  });
});
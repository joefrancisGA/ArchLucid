import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { CitationReference } from "@/types/explanation";

const demoUiEnvMock = { buyerPolishedShell: false };

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => demoUiEnvMock.buyerPolishedShell,
  };
});

import { CitationChips } from "@/components/explanation/CitationChips";

describe("CitationChips", () => {
  const base: CitationReference = {
    kind: "Finding",
    id: "finding-123",
    label: "Example finding",
  };

  it("links Finding citations to in-page anchors in operator shells", () => {
    demoUiEnvMock.buyerPolishedShell = false;
    render(<CitationChips citations={[base]} runId="run-a" />);

    const link = screen.getByRole("link", { name: /Finding: Example finding/i });
    expect(link.getAttribute("href")).toBe("/architecture/reviews/run-a#finding-finding-123");
  });

  it("does not invent review deep links when run id is missing (P-07)", () => {
    demoUiEnvMock.buyerPolishedShell = true;
    render(<CitationChips citations={[base]} runId="   " />);

    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText(/Example finding/)).toBeInTheDocument();
  });

  it("does not link citations with empty ids", () => {
    demoUiEnvMock.buyerPolishedShell = false;
    render(
      <CitationChips
        citations={[{ kind: "Finding", id: "  ", label: "Example finding" }]}
        runId="run-a"
      />,
    );

    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText(/Citation id was not stored on this explanation\./)).toBeInTheDocument();
  });

  it("does not link citations when citation id is empty (P-20)", () => {
    demoUiEnvMock.buyerPolishedShell = true;
    render(<CitationChips citations={[{ kind: "Finding", id: "   ", label: "Example finding" }]} runId="run-a" />);

    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText(/Example finding/)).toBeInTheDocument();
  });

  it("links Finding citations to the findings route in buyer-polished shells", () => {
    demoUiEnvMock.buyerPolishedShell = true;
    render(<CitationChips citations={[base]} runId="run-a" />);

    const link = screen.getByRole("link", { name: /Finding: Example finding/i });
    expect(link.getAttribute("href")).toBe("/architecture/reviews/run-a/findings/finding-123");
  });
});

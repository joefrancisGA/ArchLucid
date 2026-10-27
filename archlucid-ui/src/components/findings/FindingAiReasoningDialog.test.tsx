import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FindingAiReasoningDialog } from "@/components/findings/FindingAiReasoningDialog";

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
}));

describe("FindingAiReasoningDialog", () => {
  it("uses finding title in the dialog title and labels missing ids (P-14 / P-15)", () => {
    render(
      <FindingAiReasoningDialog
        open
        onOpenChange={vi.fn()}
        findingId="   "
        findingTitle="Encryption gap"
        snapshot={null}
      />,
    );

    expect(screen.getByRole("heading", { name: "AI reasoning — Encryption gap" })).toBeInTheDocument();
    expect(screen.getByText("Finding id was not stored.")).toBeInTheDocument();
  });

  it("labels missing and stored-empty reasoning traces (P-16)", () => {
    const { rerender } = render(
      <FindingAiReasoningDialog
        open
        onOpenChange={vi.fn()}
        findingId="f-1"
        findingTitle="Title"
        snapshot={{ wireJson: "{}", reasoningTrace: "" }}
      />,
    );

    expect(screen.getByText("Reasoning trace was stored empty.")).toBeInTheDocument();

    rerender(
      <FindingAiReasoningDialog
        open
        onOpenChange={vi.fn()}
        findingId="f-1"
        findingTitle="Title"
        snapshot={{ wireJson: "{}", reasoningTrace: "trace line" }}
      />,
    );

    expect(screen.getByText("trace line")).toBeInTheDocument();
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ClarificationGapRow } from "@/components/architecture/ClarificationGapRow";
import type { ArchitectureMissingItem } from "@/lib/architecture/architecture-created-home-model";

const clarificationItem: ArchitectureMissingItem = {
  id: "business-outcome",
  label: "Business outcome is still brief or missing",
  href: "/architecture/reviews/new?path=guided-intake&rerun=run-1",
  category: "clarification",
  source: { label: "From your brief", capturedAtLabel: "captured 12:04" },
};

describe("ClarificationGapRow", () => {
  it("renders status tag, impact, source label, and actions", () => {
    const onDismiss = vi.fn();

    render(
      <ClarificationGapRow
        item={clarificationItem}
        impact="Sponsors need a clear outcome before approving assessment scope."
        answerHref="/architecture/reviews/new?path=guided-intake&rerun=run-1"
        onNavigateTab={vi.fn()}
        onDismiss={onDismiss}
      />,
    );

    expect(screen.getByTestId("clarification-gap-status-business-outcome")).toBeInTheDocument();
    expect(screen.getByText(/Sponsors need a clear outcome/)).toBeInTheDocument();
    expect(screen.getByText(/From your brief · captured 12:04/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Answer · Guided questions/i })).toHaveAttribute(
      "href",
      "/architecture/reviews/new?path=guided-intake&rerun=run-1",
    );

    fireEvent.click(screen.getByRole("button", { name: "Not applicable" }));
    expect(onDismiss).toHaveBeenCalledWith("business-outcome");
  });
});

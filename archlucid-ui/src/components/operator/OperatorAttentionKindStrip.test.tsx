import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  OPERATOR_ATTENTION_KIND_STRIP_HELPER,
  OperatorAttentionKindStrip,
} from "@/components/operator/OperatorAttentionKindStrip";
import { OPERATOR_ATTENTION_KIND_DESTINATIONS } from "@/lib/operator/operator-attention-kind-destinations";
import { OPERATOR_ATTENTION_KIND_LABELS } from "@/lib/operator/operator-attention-taxonomy";

vi.mock("@/hooks/use-operator-attention-summary", () => ({
  useOperatorAttentionSummary: () => ({
    summaries: [
      { partition: "unfinished-work", totalCount: 2 },
      { partition: "assigned-to-me", totalCount: 1 },
      { partition: "alerts", totalCount: 0 },
      { partition: "awaiting-approval", totalCount: 3 },
    ],
    surfaceCounts: {},
  }),
}));

describe("OperatorAttentionKindStrip (TB-2353)", () => {
  it("renders actionable chips with counts and destinations", () => {
    render(<OperatorAttentionKindStrip />);

    const strip = screen.getByTestId("operator-attention-kind-strip");
    expect(strip).toHaveAttribute("data-variant", "default");
    expect(strip.textContent).toContain(OPERATOR_ATTENTION_KIND_STRIP_HELPER);
    expect(screen.getByTestId("operator-attention-kind-chips")).toBeInTheDocument();

    for (const kind of Object.keys(OPERATOR_ATTENTION_KIND_LABELS) as Array<
      keyof typeof OPERATOR_ATTENTION_KIND_LABELS
    >) {
      const chip = screen.getByTestId(`operator-attention-kind-chip-${kind}`);
      expect(chip).toHaveAttribute("href", OPERATOR_ATTENTION_KIND_DESTINATIONS[kind].href);
      expect(chip.textContent).toContain(OPERATOR_ATTENTION_KIND_LABELS[kind]);
    }

    expect(screen.getByTestId("operator-attention-kind-chip-unfinished-work")).toHaveTextContent("2");
    expect(screen.getByTestId("operator-attention-kind-chip-awaiting-approval")).toHaveTextContent("3");
  });

  it("omits helper text in compact hub layout", () => {
    render(<OperatorAttentionKindStrip variant="compact" />);

    expect(screen.getByTestId("operator-attention-kind-strip")).toHaveAttribute("data-variant", "compact");
    expect(screen.queryByText(OPERATOR_ATTENTION_KIND_STRIP_HELPER)).not.toBeInTheDocument();
    expect(screen.getByTestId("operator-attention-kind-chips")).toBeInTheDocument();
  });
});

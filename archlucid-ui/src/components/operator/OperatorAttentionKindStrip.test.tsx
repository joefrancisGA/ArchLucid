import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  OPERATOR_ATTENTION_KIND_STRIP_COMPACT_HELPER,
  OPERATOR_ATTENTION_KIND_STRIP_HELPER,
  OperatorAttentionKindStrip,
} from "@/components/operator/OperatorAttentionKindStrip";
import { OPERATOR_ATTENTION_KIND_LABELS } from "@/lib/operator/operator-attention-taxonomy";

describe("OperatorAttentionKindStrip (TB-2353)", () => {
  it("renders the four-kind inventory with data-testid", () => {
    render(<OperatorAttentionKindStrip />);

    const strip = screen.getByTestId("operator-attention-kind-strip");
    expect(strip).toHaveAttribute("data-variant", "default");
    expect(strip.textContent).toContain(OPERATOR_ATTENTION_KIND_STRIP_HELPER);
    expect(strip.textContent).toContain(OPERATOR_ATTENTION_KIND_LABELS["unfinished-work"]);
    expect(strip.textContent).toContain(OPERATOR_ATTENTION_KIND_LABELS["awaiting-approval"]);
    expect(screen.getByTestId("operator-attention-kind-strip-inventory").textContent).toBe(
      "unfinished-work,assigned-to-me,alerts,awaiting-approval",
    );
  });

  it("supports compact helper text for hub pages", () => {
    render(<OperatorAttentionKindStrip variant="compact" />);

    expect(screen.getByTestId("operator-attention-kind-strip")).toHaveAttribute("data-variant", "compact");
    expect(screen.getByTestId("operator-attention-kind-strip")).toHaveTextContent(
      OPERATOR_ATTENTION_KIND_STRIP_COMPACT_HELPER,
    );
  });
});

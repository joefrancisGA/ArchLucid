import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OperatorHomePrimaryAttentionLead } from "@/components/operator-home/OperatorHomePrimaryAttentionLead";
import { OPERATOR_ATTENTION_KIND_DESTINATIONS } from "@/lib/operator/operator-attention-kind-destinations";

vi.mock("@/hooks/use-operator-attention-summary", () => ({
  useOperatorAttentionSummary: () => ({
    summaries: [
      { partition: "unfinished-work", totalCount: 0 },
      { partition: "assigned-to-me", totalCount: 0 },
      { partition: "alerts", totalCount: 0 },
      { partition: "awaiting-approval", totalCount: 3 },
    ],
    surfaceCounts: {},
  }),
}));

describe("OperatorHomePrimaryAttentionLead", () => {
  it("describes awaiting approval as reviews waiting for approval", () => {
    render(<OperatorHomePrimaryAttentionLead />);

    expect(screen.getByTestId("operator-home-primary-attention-lead")).toHaveAttribute(
      "data-attention-kind",
      "awaiting-approval",
    );
    expect(
      screen.getByText(
        new RegExp(OPERATOR_ATTENTION_KIND_DESTINATIONS["awaiting-approval"].description.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: OPERATOR_ATTENTION_KIND_DESTINATIONS["awaiting-approval"].ctaLabel }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/approval warnings count governance checks/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/governance/i)).not.toBeInTheDocument();
  });
});

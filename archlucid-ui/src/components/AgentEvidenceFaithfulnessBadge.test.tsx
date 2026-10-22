import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AgentEvidenceFaithfulnessBadge } from "@/components/AgentEvidenceFaithfulnessBadge";

describe("AgentEvidenceFaithfulnessBadge", () => {
  it("renders tier label and numeric ratio for strong grounding", () => {
    render(<AgentEvidenceFaithfulnessBadge ratio={0.82} />);

    expect(screen.getByText("Strong")).toBeInTheDocument();
    expect(screen.getByText("(0.82)")).toBeInTheDocument();
  });

  it("renders em dash when ratio is absent", () => {
    const { container } = render(<AgentEvidenceFaithfulnessBadge ratio={null} />);

    expect(container.textContent).toBe(" — ");
  });

  it("exposes heuristic disclaimer via FieldHelpTooltip for non-absent ratios", () => {
    render(<AgentEvidenceFaithfulnessBadge ratio={0.5} />);

    expect(screen.getByRole("button", { name: /help: evidence grounding/i })).toBeInTheDocument();
  });
});

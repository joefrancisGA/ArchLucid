import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FindingConfidenceBadge } from "@/components/FindingConfidenceBadge";

describe("FindingConfidenceBadge", () => {
  it.each([
    ["High", "High confidence", "--al-status-ready-bg"],
    ["Medium", "Medium confidence", "--al-status-warn-bg"],
    ["Low", "Low confidence", "--al-status-blocked-bg"],
  ] as const)("renders %s with label and enterprise status styling", (level, label, statusToken) => {
    render(<FindingConfidenceBadge level={level} />);

    const badge = screen.getByRole("status", { name: label });

    expect(badge).toHaveAttribute("data-archlucid-confidence", level);
    expect(badge.className).toContain(statusToken);
  });

  it.each([null, undefined] as const)("renders nothing when level is %s", (level) => {
    const { container } = render(<FindingConfidenceBadge level={level} />);

    expect(container.querySelector(".finding-confidence-badge")).toBeNull();
  });
});

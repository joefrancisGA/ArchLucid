import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RemediationPrioritySortKeyDisclosure } from "./RemediationPrioritySortKeyDisclosure";

describe("RemediationPrioritySortKeyDisclosure", () => {
  it("hides the four-decimal sort key until Show sort key is opened", () => {
    const findingId = "finding-1";

    render(<RemediationPrioritySortKeyDisclosure findingId={findingId} totalScore={0.42} />);

    const toggle = screen.getByTestId(`remediation-priority-sort-key-${findingId}`);
    expect(toggle).toHaveTextContent("Show sort key");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(/0\.4200/)).not.toBeInTheDocument();

    fireEvent.click(toggle);

    expect(toggle).toHaveTextContent("Hide sort key");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByText("Sort key 0.4200. Ordering only — not a percentage, probability, or live risk score."),
    ).toBeInTheDocument();
  });
});

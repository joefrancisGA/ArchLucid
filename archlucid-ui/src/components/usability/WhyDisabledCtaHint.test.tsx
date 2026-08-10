import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { whyDisabledNeedsRole } from "@/lib/why-disabled-cta";

describe("WhyDisabledCtaHint", () => {
  it("renders nothing when reason is null", () => {
    const { container } = render(<WhyDisabledCtaHint reason={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders a status helper with the reason message", () => {
    render(<WhyDisabledCtaHint reason={whyDisabledNeedsRole("Architect")} />);

    const hint = screen.getByTestId("why-disabled-cta-hint");

    expect(hint).toHaveAttribute("role", "status");
    expect(hint).toHaveTextContent("Requires Architect to continue.");
  });
});
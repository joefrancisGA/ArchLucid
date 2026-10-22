import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CtoDemoNextStepsClosingSection } from "@/components/cto-demo/CtoDemoNextStepsClosingSection";

describe("CtoDemoNextStepsClosingSection", () => {
  it("renders pilot, security review, and trust pack CTAs", () => {
    render(<CtoDemoNextStepsClosingSection />);

    expect(screen.getByTestId("cto-demo-next-steps-closing")).toBeInTheDocument();
    expect(screen.getByTestId("cto-demo-next-steps-pilot")).toHaveAttribute("href", "/get-started");
    expect(screen.getByTestId("cto-demo-next-steps-security-review")).toHaveAttribute(
      "href",
      "/trust?focus=security-review",
    );
    expect(screen.getByTestId("cto-demo-next-steps-trust-pack")).toHaveAttribute("href", "/trust");
  });
});

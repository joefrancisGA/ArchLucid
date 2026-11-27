import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SecureNowAcceleratorHomeSection } from "@/components/product-line/SecureNowAcceleratorHomeSection";

describe("SecureNowAcceleratorHomeSection", () => {
  it("lists specialty templates and fixture-path-03 quick links", () => {
    render(<SecureNowAcceleratorHomeSection />);

    expect(screen.getByTestId("securenow-accelerator-home-section")).toBeInTheDocument();
    expect(screen.getByTestId("securenow-accelerator-home-link-/help/specialty-walkthroughs")).toHaveAttribute(
      "href",
      "/help/specialty-walkthroughs",
    );
    expect(
      screen.getByTestId(
        "securenow-accelerator-home-link-/administration/securenow-scenario-walks#fixture-path-03",
      ),
    ).toHaveAttribute("href", "/administration/securenow-scenario-walks#fixture-path-03");
  });
});

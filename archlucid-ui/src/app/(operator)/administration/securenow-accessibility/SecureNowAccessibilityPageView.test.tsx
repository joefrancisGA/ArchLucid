import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SecureNowAccessibilityPageView } from "./SecureNowAccessibilityPageView";

describe("SecureNow accessibility page", () => {
  it("renders the scoped target and barrier-reporting path", () => {
    render(<SecureNowAccessibilityPageView />);

    expect(screen.getByTestId("securenow-accessibility-page")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Accessibility" })).toBeInTheDocument();
    expect(screen.getByTestId("securenow-accessibility-lead")).toHaveTextContent(/WCAG 2\.2 Level AA/);
    expect(screen.getByTestId("securenow-accessibility-claim-discipline")).toHaveTextContent(
      "This page does not record assistive-technology user testing.",
    );
    expect(screen.getByRole("link", { name: "Report an accessibility barrier" })).toHaveAttribute(
      "href",
      "mailto:accessibility@archlucid.net",
    );
  });

  it("does not make certification or VPAT claims", () => {
    const { container } = render(<SecureNowAccessibilityPageView />);
    const text = container.textContent ?? "";

    expect(text).not.toMatch(/\$/);
    expect(text).not.toMatch(/WCAG certified/i);
    expect(text).not.toMatch(/VPAT/i);
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderInline } from "./MarketingAccessibilityMarkdownInline";

describe("MarketingAccessibilityMarkdownInline", () => {
  it("does not open mailto links in a new tab", () => {
    render(<>{renderInline("[Contact](mailto:privacy@example.com)", "t", { linkMode: "external-only" })}</>);

    const link = screen.getByRole("link", { name: "Contact" });

    expect(link).toHaveAttribute("href", "mailto:privacy@example.com");
    expect(link).not.toHaveAttribute("target", "_blank");
  });

  it("opens http links in a new tab", () => {
    render(<>{renderInline("[Example](https://example.com)", "t", { linkMode: "external-only" })}</>);

  const link = screen.getByRole("link", { name: "Example" });

    expect(link).toHaveAttribute("target", "_blank");
  });
});

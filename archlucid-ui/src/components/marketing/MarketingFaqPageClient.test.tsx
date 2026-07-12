import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarketingFaqPageClient } from "./MarketingFaqPageClient";

describe("MarketingFaqPageClient", () => {
  it("renders buyer intro, category index, and top CTAs", () => {
    render(<MarketingFaqPageClient />);

    expect(screen.getByRole("heading", { level: 1, name: "Product FAQ" })).toBeInTheDocument();
    expect(screen.getByText("Answers for architects and sponsors evaluating ArchLucid.")).toBeInTheDocument();
    expect(screen.getByTestId("marketing-faq-toc")).toBeInTheDocument();
    expect(screen.getByTestId("marketing-faq-cta-top")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to overview" })).toHaveAttribute("href", "/welcome");
  });

  it("filters accordion items when searching", () => {
    render(<MarketingFaqPageClient />);

    fireEvent.change(screen.getByTestId("marketing-faq-search"), { target: { value: "one architect" } });

    expect(screen.getByTestId("marketing-faq-item-one-architect-license")).toBeInTheDocument();
    expect(screen.queryByTestId("marketing-faq-item-what-is-archlucid")).not.toBeInTheDocument();
  });
});

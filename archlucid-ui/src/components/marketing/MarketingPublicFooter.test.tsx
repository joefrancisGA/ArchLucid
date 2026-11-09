import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  PUBLIC_SAMPLE_REVIEW_HREF,
  PUBLIC_SAMPLE_REVIEW_LABEL,
  PUBLIC_SECURENOW_FIXTURE_SAMPLE_HREF,
  PUBLIC_SECURENOW_FIXTURE_SAMPLE_LABEL,
  PUBLIC_SECURENOW_SKU_CARD_HREF,
  PUBLIC_SECURENOW_SKU_CARD_LABEL,
} from "@/lib/marketing/public-sample-entry-links";

import { MarketingPublicFooter } from "./MarketingPublicFooter";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/welcome"),
}));

describe("MarketingPublicFooter", () => {
  it("omits the current route from footer links", async () => {
    const { usePathname } = await import("next/navigation");
    vi.mocked(usePathname).mockReturnValue("/privacy");

    render(<MarketingPublicFooter />);

    expect(screen.getByRole("link", { name: "Trust Center" })).toHaveAttribute("href", "/trust");
    expect(screen.getByRole("link", { name: "Assurance status" })).toHaveAttribute("href", "/assurance-status");
    expect(screen.queryByRole("link", { name: "Privacy policy" })).toBeNull();
    expect(screen.getByRole("link", { name: "Product FAQ" })).toHaveAttribute("href", "/faq");
  });

  it("shows Francis Architecture, LLC copyright", () => {
    render(<MarketingPublicFooter />);

    expect(screen.getByTestId("marketing-public-footer-copyright")).toHaveTextContent(
      `© ${new Date().getFullYear()} Francis Architecture, LLC. All rights reserved.`,
    );
  });

  it("includes the approved public sample review and SecureNow fixture links", () => {
    render(<MarketingPublicFooter />);

    expect(screen.getByRole("link", { name: PUBLIC_SAMPLE_REVIEW_LABEL })).toHaveAttribute(
      "href",
      PUBLIC_SAMPLE_REVIEW_HREF,
    );
    expect(screen.getByRole("link", { name: PUBLIC_SECURENOW_FIXTURE_SAMPLE_LABEL })).toHaveAttribute(
      "href",
      PUBLIC_SECURENOW_FIXTURE_SAMPLE_HREF,
    );
    expect(screen.getByRole("link", { name: PUBLIC_SECURENOW_SKU_CARD_LABEL })).toHaveAttribute(
      "href",
      PUBLIC_SECURENOW_SKU_CARD_HREF,
    );
    expect(screen.queryByRole("link", { name: /why securenow/i })).toBeNull();
  });

  it("omits Sign in on signup routes where the header already exposes it", async () => {
    const { usePathname } = await import("next/navigation");
    vi.mocked(usePathname).mockReturnValue("/signup");

    render(<MarketingPublicFooter />);

    expect(screen.queryByRole("link", { name: "Sign in" })).toBeNull();
    expect(screen.getByRole("link", { name: "Product FAQ" })).toHaveAttribute("href", "/faq");
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

  it("omits Sign in on signup routes where the header already exposes it", async () => {
    const { usePathname } = await import("next/navigation");
    vi.mocked(usePathname).mockReturnValue("/signup");

    render(<MarketingPublicFooter />);

    expect(screen.queryByRole("link", { name: "Sign in" })).toBeNull();
    expect(screen.getByRole("link", { name: "Product FAQ" })).toHaveAttribute("href", "/faq");
  });
});

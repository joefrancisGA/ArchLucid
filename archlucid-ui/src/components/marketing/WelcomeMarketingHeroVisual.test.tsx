import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WELCOME_SEE_IT_HREF } from "@/components/marketing/welcome-marketing-copy";

import { WelcomeMarketingHeroVisual } from "./WelcomeMarketingHeroVisual";

describe("WelcomeMarketingHeroVisual", () => {
  it("links to the see-it proof slice with a sample finding frame", () => {
    render(<WelcomeMarketingHeroVisual />);

    expect(screen.getByTestId("welcome-hero-product-visual")).toHaveAttribute("href", WELCOME_SEE_IT_HREF);
    expect(screen.getByText(/Cross-region data residency gap/i)).toBeInTheDocument();
    expect(screen.getByText(/network-topology.json/i)).toBeInTheDocument();
  });
});

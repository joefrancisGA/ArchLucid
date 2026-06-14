import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/usability/PilotCommandCenterCard", () => ({
  PilotCommandCenterCard: () => <div data-testid="home-block-pilot-command-center" />,
}));

import { BuyerPolishedHomeHeroSection } from "@/components/operator-home/BuyerPolishedHomeHeroSection";

describe("BuyerPolishedHomeHeroSection", () => {
  it("renders only the compact pilot command center hero", () => {
    render(<BuyerPolishedHomeHeroSection />);

    expect(screen.getByTestId("operator-home-hero-section")).toBeInTheDocument();
    expect(screen.getByTestId("home-block-pilot-command-center")).toBeInTheDocument();
    expect(screen.queryByTestId("buyer-home-secondary-panels")).toBeNull();
  });
});

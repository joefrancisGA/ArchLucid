import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

import { OPERATOR_HOME_CARD_SECTION_HEADING } from "@/lib/design-tokens";

import { OperatorHomeContinueSetupCard } from "./OperatorHomeContinueSetupCard";

describe("OperatorHomeContinueSetupCard", () => {
  it("renders the Continue setup card with setup guide CTA", () => {
    render(<OperatorHomeContinueSetupCard />);

    expect(screen.getByTestId("home-block-continue-setup")).toBeInTheDocument();

    const heading = screen.getByRole("heading", { level: 2, name: "Continue setup" });

    expect(heading).toBeInTheDocument();
    expect(heading.className).toContain("tracking-tight");
    expect(OPERATOR_HOME_CARD_SECTION_HEADING).toContain("tracking-tight");
    expect(
      screen.getByText("Finish workspace setup, reviewer access, and optional cloud connections."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/evidence checklist/i)).not.toBeInTheDocument();

    const setupGuideLink = screen.getByRole("link", { name: "Open setup guide" });

    expect(setupGuideLink).toHaveAttribute("href", "/onboarding");
    expect(screen.queryByText(/Continue getting started/i)).not.toBeInTheDocument();
  });
});

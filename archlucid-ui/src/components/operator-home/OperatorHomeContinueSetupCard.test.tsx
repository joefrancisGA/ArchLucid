import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

import { OPERATOR_HOME_CARD_SECTION_HEADING } from "@/lib/design-tokens";

import { OperatorHomeContinueSetupCard } from "./OperatorHomeContinueSetupCard";

describe("OperatorHomeContinueSetupCard", () => {
  it("uses buyer-safe setup copy and getting-started CTA", () => {
    render(<OperatorHomeContinueSetupCard />);

    const heading = screen.getByRole("heading", { level: 2, name: "Continue setup" });

    expect(heading).toBeInTheDocument();
    expect(heading.className).toContain("tracking-tight");
    expect(OPERATOR_HOME_CARD_SECTION_HEADING).toContain("tracking-tight");
    expect(
      screen.getByText("Finish workspace setup, reviewer access, and optional cloud connections."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/evidence checklist/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Continue getting started/i })).toHaveAttribute("href", "/onboarding");
  });
});

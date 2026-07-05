import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

const useFinishSetupReadinessContext = vi.fn();

vi.mock("@/hooks/use-finish-setup-readiness-context", () => ({
  useFinishSetupReadinessContext: () => useFinishSetupReadinessContext(),
}));

import { OperatorHomeContinueSetupSlot } from "./OperatorHomeContinueSetupSlot";

describe("OperatorHomeContinueSetupSlot", () => {
  it("renders Continue setup prominently when setup is incomplete", () => {
    useFinishSetupReadinessContext.mockReturnValue({
      phase: "ready",
      context: {
        healthReady: true,
        healthLoadFailed: false,
        principalAdmin: false,
      },
      readyCount: 1,
      totalCount: 4,
    });

    render(<OperatorHomeContinueSetupSlot placement="prominent" />);

    expect(screen.getByTestId("home-block-continue-setup")).toBeInTheDocument();
    expect(screen.getByTestId("inline-guidance-setup-readiness")).toHaveTextContent("Setup readiness:");
    expect(screen.getByText("1 of 4 complete")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open setup guide" })).toHaveAttribute("href", "/onboarding");
  });

  it("hides Continue setup when every tracked setup step is complete", () => {
    useFinishSetupReadinessContext.mockReturnValue({
      phase: "ready",
      context: {
        healthReady: true,
        healthLoadFailed: false,
        principalAdmin: true,
      },
      readyCount: 4,
      totalCount: 4,
    });

    render(<OperatorHomeContinueSetupSlot placement="prominent" />);

    expect(screen.queryByTestId("home-block-continue-setup")).not.toBeInTheDocument();
  });
});

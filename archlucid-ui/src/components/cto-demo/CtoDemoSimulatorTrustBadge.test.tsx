import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CtoDemoSimulatorTrustBadge } from "@/components/cto-demo/CtoDemoSimulatorTrustBadge";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();
  return {
    ...actual,
  isBuyerPolishedOperatorShellEnv: vi.fn(() => true),
};
});

vi.mock("@/hooks/useIsLiveApiActive", () => ({
  useIsLiveApiActive: vi.fn(() => false),
}));

describe("CtoDemoSimulatorTrustBadge", () => {
  it("renders simulator label when buyer shell is active and API is not live", async () => {
    const { isBuyerPolishedOperatorShellEnv } = await import("@/lib/demo-ui-env");
    const { useIsLiveApiActive } = await import("@/hooks/useIsLiveApiActive");

    vi.mocked(isBuyerPolishedOperatorShellEnv).mockReturnValue(true);
    vi.mocked(useIsLiveApiActive).mockReturnValue(false);

    render(<CtoDemoSimulatorTrustBadge />);

    expect(screen.getByTestId("cto-demo-simulator-trust-badge")).toBeInTheDocument();
    expect(screen.getByText(/Rule-based analysis/)).toBeInTheDocument();
  });

  it("does not render when buyer shell is inactive", async () => {
    const { isBuyerPolishedOperatorShellEnv } = await import("@/lib/demo-ui-env");

    vi.mocked(isBuyerPolishedOperatorShellEnv).mockReturnValue(false);

    const { container } = render(<CtoDemoSimulatorTrustBadge />);

    expect(container.firstChild).toBeNull();
  });
});

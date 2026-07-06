import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BuyerCtoDemoReadinessPanel } from "@/components/operator-home/BuyerCtoDemoReadinessPanel";

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => true,
}));

vi.mock("@/lib/cto-demo-presenter-pack", () => ({
  isCtoDemoOperatorToolingEnv: () => true,
  isCtoDemoInternalOperatorControlsEnv: () => internalControlsForced.on,
}));

const internalControlsForced = vi.hoisted(() => ({ on: false as boolean }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/lib/buyer-cto-demo-orchestration", () => ({
  resetBuyerCtoDemoSession: vi.fn(async () => ({
    seedSucceeded: true,
    destinationHref: "/operator",
  })),
}));

vi.mock("@/lib/buyer-cto-demo-readiness", () => ({
  buyerCtoDemoReadinessStatusKind: () => "ready",
  evaluateBuyerCtoDemoReadiness: vi.fn(async () => ({
    verdict: "ready",
    checks: [
      {
        id: "buyer-shell",
        label: "Buyer-polished shell",
        status: "pass",
        detail: "Buyer-safe labels and demo chrome are active.",
      },
      {
        id: "journey-routes",
        label: "Five-step demo path",
        status: "pass",
        detail: "All journey routes resolve.",
      },
    ],
  })),
}));

import { evaluateBuyerCtoDemoReadiness } from "@/lib/buyer-cto-demo-readiness";

const mockEvaluate = vi.mocked(evaluateBuyerCtoDemoReadiness);

describe("BuyerCtoDemoReadinessPanel", () => {
  beforeEach(() => {
    mockEvaluate.mockClear();
    internalControlsForced.on = false;
  });

  it("shows a demo ready badge after checks complete without internal demo controls by default", async () => {
    render(<BuyerCtoDemoReadinessPanel embedded />);

    await waitFor(() => {
      expect(screen.getByTestId("buyer-cto-demo-readiness-badge")).toHaveTextContent("Demo ready");
    });

    expect(screen.getByTestId("buyer-cto-demo-readiness-check-buyer-shell")).toBeInTheDocument();
    expect(mockEvaluate).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("buyer-cto-demo-run-of-show-download")).toBeNull();
    expect(screen.getByRole("button", { name: "Recheck readiness" })).toBeInTheDocument();
  });

  it("shows run-of-show download when internal demo-operator controls are enabled", async () => {
    internalControlsForced.on = true;

    render(<BuyerCtoDemoReadinessPanel embedded />);

    await waitFor(() => {
      expect(screen.getByTestId("buyer-cto-demo-run-of-show-download")).toBeInTheDocument();
    });
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BuyerCtoDemoReadinessPanel } from "@/components/operator-home/BuyerCtoDemoReadinessPanel";
import { BUYER_CTO_DEMO_READINESS_ARIA } from "@/lib/buyer/buyer-polish-copy";

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => true,
}));

vi.mock("@/lib/cto-demo-presenter-pack", () => ({
  isCtoDemoInternalOperatorControlsEnv: () => internalControlsForced.on,
  isCtoDemoPackEnv: () => false,
}));

const internalControlsForced = vi.hoisted(() => ({ on: false as boolean }));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
    usePathname: () => "/",
  };
});

vi.mock("@/lib/buyer/buyer-cto-demo-orchestration", () => ({
  resetBuyerCtoDemoSession: vi.fn(async () => ({
    seedSucceeded: true,
    destinationHref: "/operator",
  })),
}));

vi.mock("@/lib/buyer/buyer-cto-demo-readiness", () => ({
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
      {
        id: "api-ready",
        label: "API readiness",
        status: "pass",
        detail: "Live API is reachable.",
      },
    ],
  })),
}));

import { evaluateBuyerCtoDemoReadiness } from "@/lib/buyer/buyer-cto-demo-readiness";

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

    expect(screen.getByRole("region", { name: BUYER_CTO_DEMO_READINESS_ARIA })).toBeInTheDocument();
    expect(BUYER_CTO_DEMO_READINESS_ARIA.toLowerCase()).not.toContain("cto demo");
    expect(screen.getByTestId("buyer-cto-demo-readiness-check-buyer-shell")).toBeInTheDocument();
    expect(screen.getByTestId("demo-readiness-check-status-buyer-shell")).toHaveTextContent("Pass");
    expect(screen.getByText("Buyer-polished shell")).toBeInTheDocument();
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

  it("groups checks into sections on the internal admin layout without a duplicate panel title", async () => {
    render(<BuyerCtoDemoReadinessPanel layout="internal-page" />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Demo experience" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Platform services" })).toBeInTheDocument();
    });

    expect(screen.queryByRole("heading", { name: "Demo readiness" })).toBeNull();
    expect(screen.getByTestId("demo-readiness-last-checked")).toBeInTheDocument();
  });
});

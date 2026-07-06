import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OperatorHomeDemoOperationsSection } from "@/components/operator-home/OperatorHomeDemoOperationsSection";
import { OPERATOR_HOME_DEMO_OPERATIONS_TITLE } from "@/lib/buyer-polish-copy";

const operatorToolingForced = vi.hoisted(() => ({ on: false as boolean }));

vi.mock("@/lib/cto-demo-presenter-pack", () => ({
  isCtoDemoOperatorToolingEnv: () => operatorToolingForced.on,
  isCtoDemoInternalOperatorControlsEnv: () => false,
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
    ],
  })),
}));

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

describe("OperatorHomeDemoOperationsSection", () => {
  beforeEach(() => {
    localStorage.clear();
    operatorToolingForced.on = false;
  });

  it("renders nothing when demo operator tooling is disabled", () => {
    const { container } = render(<OperatorHomeDemoOperationsSection />);

    expect(container).toBeEmptyDOMElement();
  });

  it("shows demo operations controls when demo operator tooling is enabled", async () => {
    operatorToolingForced.on = true;

    render(<OperatorHomeDemoOperationsSection />);

    expect(screen.getByRole("heading", { name: OPERATOR_HOME_DEMO_OPERATIONS_TITLE })).toBeInTheDocument();

    const expand = screen.getByRole("button", { name: /expand demo operations/i });
    expand.click();

    await waitFor(() => {
      expect(screen.getByTestId("buyer-cto-demo-readiness-panel")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Recheck readiness" })).toBeInTheDocument();
    expect(screen.queryByTestId("buyer-cto-demo-run-of-show-download")).toBeNull();
    expect(screen.queryByRole("heading", { name: "Demo readiness" })).toBeNull();
  });
});

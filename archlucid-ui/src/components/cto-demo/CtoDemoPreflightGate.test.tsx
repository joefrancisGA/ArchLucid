import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CtoDemoPreflightGate } from "@/components/cto-demo/CtoDemoPreflightGate";
import { BUYER_CTO_DEMO_PREFLIGHT_ACKNOWLEDGED_STORAGE_KEY } from "@/lib/buyer/buyer-cto-demo-tour";

vi.mock("@/lib/buyer/buyer-cto-demo-readiness", () => ({
  buyerCtoDemoReadinessStatusKind: () => "ready",
  evaluateBuyerCtoDemoReadiness: vi.fn(async () => ({
    verdict: "ready",
    checks: [],
  })),
}));

describe("CtoDemoPreflightGate", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("shows agenda preview and begins demo when ready", async () => {
    const onAcknowledged = vi.fn();

    render(<CtoDemoPreflightGate onAcknowledged={onAcknowledged} />);

    await waitFor(() => {
      expect(screen.getByTestId("cto-demo-agenda-preview")).toBeInTheDocument();
      expect(screen.getByTestId("cto-demo-preflight-begin")).not.toBeDisabled();
    });

    fireEvent.click(screen.getByTestId("cto-demo-preflight-begin"));

    expect(onAcknowledged).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(BUYER_CTO_DEMO_PREFLIGHT_ACKNOWLEDGED_STORAGE_KEY)).toBe("1");
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CtoDemoCustomerPreflightGate } from "@/components/cto-demo/CtoDemoCustomerPreflightGate";
import {
  BUYER_CTO_DEMO_PREFLIGHT_HEADING,
  BUYER_CTO_DEMO_START_FAILED_MESSAGE,
} from "@/lib/buyer/buyer-polish-copy";

vi.mock("@/lib/buyer/buyer-cto-demo-customer-start", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/buyer/buyer-cto-demo-customer-start")>();

  return {
    ...actual,
    evaluateBuyerCtoDemoCustomerStart: vi.fn(async () => ({ status: "ready" as const })),
    acknowledgeBuyerCtoDemoCustomerStart: vi.fn(),
  };
});

import {
  evaluateBuyerCtoDemoCustomerStart,
} from "@/lib/buyer/buyer-cto-demo-customer-start";

const mockEvaluate = vi.mocked(evaluateBuyerCtoDemoCustomerStart);

describe("CtoDemoCustomerPreflightGate", () => {
  beforeEach(() => {
    mockEvaluate.mockReset();
    mockEvaluate.mockResolvedValue({ status: "ready" });
  });

  it("runs invisible preflight and acknowledges without internal check rows", async () => {
    const onAcknowledged = vi.fn();

    render(<CtoDemoCustomerPreflightGate onAcknowledged={onAcknowledged} />);

    expect(screen.getByText(BUYER_CTO_DEMO_PREFLIGHT_HEADING)).toBeInTheDocument();
    expect(screen.getByText("Preparing demo…")).toBeInTheDocument();
    expect(screen.queryByTestId("buyer-cto-demo-readiness-check-buyer-shell")).toBeNull();

    await waitFor(() => {
      expect(onAcknowledged).toHaveBeenCalled();
    });
  });

  it("shows a recoverable customer-facing error without internal diagnostics", async () => {
    mockEvaluate.mockResolvedValue({
      status: "failed",
      message: BUYER_CTO_DEMO_START_FAILED_MESSAGE,
    });

    render(<CtoDemoCustomerPreflightGate onAcknowledged={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId("cto-demo-customer-start-error")).toBeInTheDocument();
    });

    expect(screen.getByText(BUYER_CTO_DEMO_START_FAILED_MESSAGE)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Contact support" })).toHaveAttribute("href", "/administration/support");
    expect(screen.queryByText(/api-ready/i)).toBeNull();
  });
});

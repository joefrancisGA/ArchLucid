import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BuyerCtoDemoReadinessPanel } from "@/components/operator-home/BuyerCtoDemoReadinessPanel";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();
  return {
    ...actual,
  isBuyerPolishedOperatorShellEnv: () => true,
};
});

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

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
  });

  it("shows a demo ready badge after checks complete", async () => {
    render(<BuyerCtoDemoReadinessPanel />);

    await waitFor(() => {
      expect(screen.getByTestId("buyer-cto-demo-readiness-badge")).toHaveTextContent("Demo ready");
    });

    expect(screen.getByTestId("buyer-cto-demo-readiness-check-buyer-shell")).toBeInTheDocument();
    expect(mockEvaluate).toHaveBeenCalledTimes(1);
  });
});

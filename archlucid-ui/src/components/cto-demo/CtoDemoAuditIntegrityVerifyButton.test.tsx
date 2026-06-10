import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CtoDemoAuditIntegrityVerifyButton } from "@/components/cto-demo/CtoDemoAuditIntegrityVerifyButton";
import { BUYER_CTO_DEMO_TOUR_ACTIVE_STORAGE_KEY } from "@/lib/buyer-cto-demo-tour";

vi.mock("@/lib/cto-demo-presenter-pack", () => ({
  isCtoDemoPackEnv: () => false,
}));

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => true,
}));

describe("CtoDemoAuditIntegrityVerifyButton", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(BUYER_CTO_DEMO_TOUR_ACTIVE_STORAGE_KEY, "1");
  });

  it("verifies the showcase audit chain on click", async () => {
    render(<CtoDemoAuditIntegrityVerifyButton />);

    fireEvent.click(screen.getByTestId("cto-demo-audit-integrity-verify-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("cto-demo-audit-integrity-verify-result")).toBeInTheDocument();
    });

    expect(screen.getByText(/events · head hash/)).toBeInTheDocument();
  });
});

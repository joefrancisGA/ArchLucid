import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CtoDemoAuditIntegrityVerifyButton } from "@/components/cto-demo/CtoDemoAuditIntegrityVerifyButton";

const verifyAuditIntegrityChainMock = vi.hoisted(() =>
  vi.fn(async () => ({
    verified: true,
    eventCount: 4,
    headHash: "deadbeef",
    links: [],
  })),
);

vi.mock("@/lib/cto-demo-presenter-pack", () => ({
  isCtoDemoPackEnv: () => false,
}));

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => true,
}));

vi.mock("@/lib/buyer-cto-demo-tour", () => ({
  readBuyerCtoDemoTourActive: () => true,
}));

vi.mock("@/lib/cto-demo-audit-integrity-chain", () => ({
  formatAuditIntegrityHeadHash: (headHash: string) => headHash,
  verifyAuditIntegrityChain: verifyAuditIntegrityChainMock,
}));

describe("CtoDemoAuditIntegrityVerifyButton", () => {
  beforeEach(() => {
    verifyAuditIntegrityChainMock.mockClear();
  });

  it("verifies the showcase audit chain on click", async () => {
    render(<CtoDemoAuditIntegrityVerifyButton />);

    fireEvent.click(screen.getByTestId("cto-demo-audit-integrity-verify-btn"));

    await waitFor(() => {
      expect(verifyAuditIntegrityChainMock).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByTestId("cto-demo-audit-integrity-verify-result")).toBeInTheDocument();
    });

    expect(screen.getByText(/events · head hash/)).toBeInTheDocument();
  });
});

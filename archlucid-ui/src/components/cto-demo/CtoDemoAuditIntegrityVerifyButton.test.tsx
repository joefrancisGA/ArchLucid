import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CtoDemoAuditIntegrityVerifyButton } from "@/components/cto-demo/CtoDemoAuditIntegrityVerifyButton";

vi.mock("@/lib/cto-demo-presenter-pack", () => ({
  isCtoDemoPackEnv: () => false,
}));

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => true,
}));

vi.mock("@/lib/buyer-cto-demo-tour", () => ({
  readBuyerCtoDemoTourActive: () => true,
}));

vi.mock("@/lib/demo-audit-sample-events", () => ({
  getDemoSampleAuditTrailEvents: () => [
    {
      eventId: "demo-event-1",
      occurredUtc: "2026-01-10T09:15:22.000Z",
      eventType: "RunStarted",
      actorUserId: "demo-jordan",
      actorUserName: "Jordan Lee",
      tenantId: "demo-tenant",
      workspaceId: "demo-workspace",
      projectId: "default",
      runId: "claims-intake-modernization",
      manifestId: null,
      artifactId: null,
      dataJson: "{}",
      correlationId: "corr-intake-demo-request",
    },
  ],
}));

vi.mock("@/lib/cto-demo-audit-integrity-chain", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/cto-demo-audit-integrity-chain")>();

  return {
    ...actual,
    verifyAuditIntegrityChain: vi.fn(async () => ({
      verified: true,
      eventCount: 1,
      headHash: "deadbeef",
      links: [],
    })),
  };
});

describe("CtoDemoAuditIntegrityVerifyButton", () => {
  it("verifies the showcase audit chain on click", async () => {
    const user = userEvent.setup();

    render(<CtoDemoAuditIntegrityVerifyButton />);

    await user.click(screen.getByTestId("cto-demo-audit-integrity-verify-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("cto-demo-audit-integrity-verify-result")).toBeInTheDocument();
    });

    expect(screen.getByText(/events · head hash/)).toBeInTheDocument();
  });
});

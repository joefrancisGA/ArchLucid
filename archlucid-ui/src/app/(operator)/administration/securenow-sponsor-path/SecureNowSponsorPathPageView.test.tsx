import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SecureNowSponsorPathPageView } from "@/app/(operator)/administration/securenow-sponsor-path/SecureNowSponsorPathPageView";
import { SECURENOW_PILOT_DISPOSITION_TENANT_AUDIT_SAVED_LINE } from "@/lib/product-line/securenow-pilot-disposition-storage";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("pathId=path-tenant-1"),
}));

vi.mock("@/components/security/SecurityEvidencePathInspectPanel", () => ({
  SecurityEvidencePathInspectPanel: () => <div data-testid="sponsor-path-inspect-stub" />,
}));

const persist = vi.fn();

vi.mock("@/lib/product-line/securenow-pilot-disposition-sync", () => ({
  loadSecureNowPilotDispositionForPath: vi.fn(async () => null),
  persistSecureNowPilotDispositionForPath: (...args: unknown[]) => persist(...args),
}));

describe("SecureNowSponsorPathPageView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    persist.mockResolvedValue({ status: "saved", tenantAuditRecorded: true });
  });

  it("shows the synthetic ROI walkthrough beside trust links", () => {
    render(<SecureNowSponsorPathPageView />);

    expect(screen.getByTestId("securenow-sponsor-path-synthetic-roi")).toBeInTheDocument();
    expect(screen.getByTestId("securenow-procurement-trust-strip")).toBeInTheDocument();
  });

  it("shows tenant audit confirmation after a successful save", async () => {
    render(<SecureNowSponsorPathPageView />);

    fireEvent.change(screen.getByLabelText("Path disposition outcome"), { target: { value: "Proceed" } });
    fireEvent.change(screen.getByLabelText("Path disposition rationale"), {
      target: { value: "Sponsor readout complete." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save path disposition" }));

    await waitFor(() => {
      expect(screen.getByTestId("securenow-sponsor-path-tenant-audit-saved")).toHaveTextContent(
        SECURENOW_PILOT_DISPOSITION_TENANT_AUDIT_SAVED_LINE,
      );
    });
  });
});

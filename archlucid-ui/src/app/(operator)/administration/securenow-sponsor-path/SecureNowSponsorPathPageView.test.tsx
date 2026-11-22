import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SecureNowSponsorPathPageView } from "@/app/(operator)/administration/securenow-sponsor-path/SecureNowSponsorPathPageView";
import { SECURENOW_PILOT_DISPOSITION_TENANT_AUDIT_SAVED_LINE } from "@/lib/product-line/securenow-pilot-disposition-storage";
import {
  SECURENOW_INVESTIGATION_EFFORT_PATH,
  SECURENOW_SPONSOR_PATH_INVESTIGATION_EFFORT_HINT,
} from "@/lib/product-line/securenow-investigation-effort-copy";

let searchParams = new URLSearchParams("pathId=path-tenant-1");

vi.mock("next/navigation", () => ({
  usePathname: () => "/administration/securenow-sponsor-path",
  useSearchParams: () => searchParams,
}));

vi.mock("@/components/security/SecurityEvidencePathInspectPanel", () => ({
  SecurityEvidencePathInspectPanel: () => <div data-testid="sponsor-path-inspect-stub" />,
}));

const persist = vi.fn();
const load = vi.fn();

vi.mock("@/lib/product-line/securenow-pilot-disposition-sync", () => ({
  loadSecureNowPilotDispositionForPath: (...args: unknown[]) => load(...args),
  persistSecureNowPilotDispositionForPath: (...args: unknown[]) => persist(...args),
}));

describe("SecureNowSponsorPathPageView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParams = new URLSearchParams("pathId=path-tenant-1");
    load.mockResolvedValue(null);
    persist.mockResolvedValue({
      status: "saved",
      tenantAuditRecorded: true,
      recordedUtc: "2026-11-14T12:00:00.000Z",
    });
  });

  it("shows procurement trust strip on the sponsor path", () => {
    render(<SecureNowSponsorPathPageView />);

    expect(screen.getByTestId("securenow-procurement-trust-strip")).toBeInTheDocument();
  });

  it("links investigation effort with ROI guardrail copy", () => {
    render(<SecureNowSponsorPathPageView />);

    const hint = screen.getByTestId("securenow-sponsor-path-investigation-hint");

    expect(hint).toHaveTextContent(SECURENOW_SPONSOR_PATH_INVESTIGATION_EFFORT_HINT);

    expect(screen.getByRole("link", { name: "Investigation effort" })).toHaveAttribute(
      "href",
      SECURENOW_INVESTIGATION_EFFORT_PATH,
    );
  });

  it("shows Proceed commercial links when Proceed is selected", () => {
    render(<SecureNowSponsorPathPageView />);

    fireEvent.change(screen.getByLabelText("Path disposition outcome"), { target: { value: "Proceed" } });

    expect(screen.getByTestId("securenow-sponsor-path-proceed-commercial")).toBeInTheDocument();
  });

  it("shows synthetic ROI when Extend is selected", () => {
    render(<SecureNowSponsorPathPageView />);

    fireEvent.change(screen.getByLabelText("Path disposition outcome"), { target: { value: "Extend" } });

    expect(screen.getByTestId("securenow-sponsor-path-synthetic-roi")).toBeInTheDocument();
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
      expect(screen.getByTestId("securenow-sponsor-path-tenant-audit-recorded-utc")).toHaveTextContent(
        "Tenant audit recorded",
      );
    });
  });

  it("clears tenant audit confirmation when the selected path only has a cached disposition", async () => {
    load
      .mockResolvedValueOnce({
        record: { outcome: "Proceed", rationale: "Recorded for path one." },
        recordedUtc: "2026-11-14T12:00:00.000Z",
      })
      .mockResolvedValueOnce({
        record: { outcome: "Extend", rationale: "Cached for path two." },
        recordedUtc: null,
      });

    const view = render(<SecureNowSponsorPathPageView />);

    await waitFor(() => {
      expect(screen.getByTestId("securenow-sponsor-path-tenant-audit-saved")).toBeInTheDocument();
    });

    searchParams = new URLSearchParams("pathId=path-cached-2");
    view.rerender(<SecureNowSponsorPathPageView />);

    await waitFor(() => {
      expect(screen.getByTestId("securenow-sponsor-path-saved-disposition")).toHaveTextContent(
        "Saved Extend: Cached for path two.",
      );
    });
    expect(screen.queryByTestId("securenow-sponsor-path-tenant-audit-saved")).not.toBeInTheDocument();
  });

  it("starts with a blank disposition when the next path is still loading", async () => {
    load
      .mockResolvedValueOnce({
        record: { outcome: "Proceed", rationale: "Synthetic first-path disposition." },
        recordedUtc: "2026-11-14T12:00:00.000Z",
      })
      .mockImplementationOnce(() => new Promise(() => {}));
    const view = render(<SecureNowSponsorPathPageView />);

    await waitFor(() => {
      expect(screen.getByLabelText("Path disposition outcome")).toHaveValue("Proceed");
    });

    searchParams = new URLSearchParams("pathId=path-pending-2");
    view.rerender(<SecureNowSponsorPathPageView />);

    expect(load).toHaveBeenCalledWith("path-pending-2");
    expect(screen.getByLabelText("Path disposition outcome")).toHaveValue("");
    expect(screen.getByLabelText("Path disposition rationale")).toHaveValue("");
    expect(screen.queryByTestId("securenow-sponsor-path-saved-disposition")).not.toBeInTheDocument();
    expect(screen.queryByTestId("securenow-sponsor-path-tenant-audit-saved")).not.toBeInTheDocument();
  });
});

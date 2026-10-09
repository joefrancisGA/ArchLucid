import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ExtractUploadAcceptedPackagePanel } from "./ExtractUploadAcceptedPackagePanel";

const showSuccess = vi.fn();

vi.mock("@/lib/toast", () => ({
  showSuccess: (...args: unknown[]) => showSuccess(...args),
}));

vi.mock("@/lib/use-iana-time-zone-preference", () => ({
  useIanaTimeZonePreference: () => ({
    ianaTimeZoneId: "America/Los_Angeles",
    mounted: true,
    accountSyncState: "synced",
    setAndPersist: vi.fn(),
  }),
}));

const sampleRecord = {
  packageId: "11111111-1111-1111-1111-111111111111",
  acceptedAtUtc: "2026-09-01T12:00:00Z",
  actorLabel: "Operator",
  resourceCount: 42,
} as const;

describe("ExtractUploadAcceptedPackagePanel", () => {
  beforeEach(() => {
    showSuccess.mockClear();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(async () => undefined),
      },
    });
  });

  it("shows the accepted time in the selected time zone", () => {
    render(<ExtractUploadAcceptedPackagePanel record={sampleRecord} />);

    expect(screen.getByTestId("extract-upload-accepted-package-id-full")).toHaveTextContent(sampleRecord.packageId);
    expect(screen.getByTestId("extract-upload-accepted-at")).toHaveTextContent(
      "9/1/2026, 5:00 AM PDT",
    );
  });

  it("labels missing actor and resource count without changing stored zero", () => {
    const { rerender } = render(
      <ExtractUploadAcceptedPackagePanel
        record={{ ...sampleRecord, actorLabel: "", resourceCount: null }}
      />,
    );

    expect(screen.getByTestId("extract-upload-accepted-actor")).toHaveTextContent("Actor was not stored");
    expect(screen.getByTestId("extract-upload-accepted-resource-count")).toHaveTextContent(
      "Resource count was not stored",
    );

    rerender(
      <ExtractUploadAcceptedPackagePanel
        record={{ ...sampleRecord, actorLabel: "", resourceCount: 0 }}
      />,
    );

    expect(screen.getByTestId("extract-upload-accepted-resource-count")).toHaveTextContent("0");
  });

  it("uses SecureNow follow-up destinations instead of architecture review links", () => {
    render(<ExtractUploadAcceptedPackagePanel record={sampleRecord} productLineId="security" />);

    expect(screen.getByRole("link", { name: "Findings" })).toHaveAttribute("href", "/compliance/findings");
    expect(screen.getByRole("link", { name: "Audit evidence" })).toHaveAttribute(
      "href",
      "/compliance/audit-evidence",
    );
    expect(screen.queryByRole("link", { name: "Start a review" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Architecture reviews" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("extract-upload-accepted-evidence-trail-link")).not.toBeInTheDocument();
  });

  it("shows an inline error instead of a toast when package id copy fails", async () => {
    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error("Clipboard blocked"));

    render(<ExtractUploadAcceptedPackagePanel record={sampleRecord} />);

    fireEvent.click(screen.getByTestId("extract-upload-accepted-package-id-copy"));

    expect(await screen.findByTestId("extract-upload-accepted-package-id-copy-error")).toHaveTextContent(
      "Package id",
    );
    expect(screen.getByTestId("extract-upload-accepted-package-id-copy-error")).toHaveTextContent(
      "Could not write to clipboard — copy manually.",
    );
  });
});

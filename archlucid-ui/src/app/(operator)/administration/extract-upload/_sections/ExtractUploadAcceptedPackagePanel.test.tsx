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

  it("shows the linked review value without replacing stored empty text", () => {
    const { rerender } = render(
      <ExtractUploadAcceptedPackagePanel record={{ ...sampleRecord, associateRunId: "run-1" }} />,
    );

    expect(screen.getByTestId("extract-upload-accepted-associate-run-id")).toHaveTextContent("run-1");

    rerender(<ExtractUploadAcceptedPackagePanel record={{ ...sampleRecord, associateRunId: "" }} />);
    expect(screen.getByTestId("extract-upload-accepted-associate-run-id")).toHaveTextContent("");
    expect(screen.getByTestId("extract-upload-accepted-associate-run-id")).not.toHaveTextContent(
      "Linked review was not stored.",
    );
  });

  it("labels an omitted linked review", () => {
    render(<ExtractUploadAcceptedPackagePanel record={sampleRecord} />);

    expect(screen.getByTestId("extract-upload-accepted-associate-run-id")).toHaveTextContent(
      "Linked review was not stored.",
    );
  });

  it("offers one SecureNow next action instead of a follow-up link list", () => {
    render(<ExtractUploadAcceptedPackagePanel record={sampleRecord} productLineId="security" />);

    expect(screen.getByTestId("extract-upload-accepted-next-action")).toHaveTextContent("Review findings");
    expect(screen.getByTestId("extract-upload-accepted-next-action")).toHaveAttribute("href", "/compliance/findings");
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.queryByText("Continue")).not.toBeInTheDocument();
    expect(screen.queryByTestId("extract-upload-accepted-evidence-trail-link")).not.toBeInTheDocument();
  });

  it("offers start a review and the evidence graph for architecture packages", () => {
    render(<ExtractUploadAcceptedPackagePanel record={sampleRecord} />);

    expect(screen.getByTestId("extract-upload-accepted-next-action")).toHaveTextContent("Start a review");
    expect(screen.getByTestId("extract-upload-accepted-next-action")).toHaveAttribute(
      "href",
      "/architecture/reviews/new",
    );
    expect(screen.getByTestId("extract-upload-accepted-evidence-trail-link")).toHaveTextContent("Evidence graph");
    expect(screen.getAllByRole("link")).toHaveLength(2);
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

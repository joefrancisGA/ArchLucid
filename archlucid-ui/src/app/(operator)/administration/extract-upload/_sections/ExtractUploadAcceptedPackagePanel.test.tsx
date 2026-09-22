import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ExtractUploadAcceptedPackagePanel } from "./ExtractUploadAcceptedPackagePanel";

const showSuccess = vi.fn();

vi.mock("@/lib/toast", () => ({
  showSuccess: (...args: unknown[]) => showSuccess(...args),
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

  it("shows an inline error instead of a toast when package id copy fails", async () => {
    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error("Clipboard blocked"));

    render(
      <ExtractUploadAcceptedPackagePanel record={sampleRecord} onReplaceInventory={vi.fn()} />,
    );

    fireEvent.click(screen.getByTestId("extract-upload-accepted-package-id-copy"));

    expect(await screen.findByTestId("extract-upload-accepted-package-id-copy-error")).toHaveTextContent(
      "Package id",
    );
    expect(screen.getByTestId("extract-upload-accepted-package-id-copy-error")).toHaveTextContent(
      "Could not write to clipboard — copy manually.",
    );
  });
});

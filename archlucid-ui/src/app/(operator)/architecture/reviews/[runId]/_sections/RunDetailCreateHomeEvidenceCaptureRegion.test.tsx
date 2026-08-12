import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

vi.mock("./RunDetailCaptureEvidenceSection", () => ({
  RunDetailCaptureEvidenceSection: (props: {
    readonly onUploadSummary?: (summary: {
      uploadedCount: number;
      outcomes: { fileName: string; status: "uploaded" | "failed" }[];
    }) => void;
  }) => (
    <button
      type="button"
      data-testid="mock-upload-summary-trigger"
      onClick={() => {
        props.onUploadSummary?.({
          uploadedCount: 1,
          outcomes: [{ fileName: "network-diagram.png", status: "uploaded" }],
        });
      }}
    >
      Mock upload summary
    </button>
  ),
}));

import { RunDetailCreateHomeEvidenceCaptureRegion } from "./RunDetailCreateHomeEvidenceCaptureRegion";
import { RUN_DETAIL_CREATE_HOME_CAPTURED_EVIDENCE_HEADING } from "@/lib/runs/run-detail-create-home-evidence-copy";

describe("RunDetailCreateHomeEvidenceCaptureRegion", () => {
  beforeEach(() => {
    refreshMock.mockReset();
  });

  it("shows captured evidence inventory after mock upload summary (TB-1847)", async () => {
    render(
      <RunDetailCreateHomeEvidenceCaptureRegion
        runId="run-evidence"
        buyerPolished
        artifacts={[]}
      />,
    );

    expect(screen.getByText(RUN_DETAIL_CREATE_HOME_CAPTURED_EVIDENCE_HEADING)).toBeInTheDocument();
    expect(screen.getByTestId("run-detail-create-home-captured-evidence-inventory")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("mock-upload-summary-trigger"));

    await waitFor(() => {
      expect(screen.getByText("network-diagram.png")).toBeInTheDocument();
    });
    expect(refreshMock).toHaveBeenCalled();
  });

  it("lists run artifacts in captured inventory on load (TB-1847)", () => {
    render(
      <RunDetailCreateHomeEvidenceCaptureRegion
        runId="run-evidence"
        buyerPolished
        artifacts={[{ artifactId: "art-1", name: "inventory.zip", createdUtc: "2026-08-12T10:00:00Z" }]}
      />,
    );

    expect(screen.getByText("inventory.zip")).toBeInTheDocument();
  });

  it("does not leak captured inventory when runId changes (TB-1847)", async () => {
    const { rerender } = render(
      <RunDetailCreateHomeEvidenceCaptureRegion runId="run-a" buyerPolished artifacts={[]} />,
    );

    fireEvent.click(screen.getByTestId("mock-upload-summary-trigger"));

    await waitFor(() => {
      expect(screen.getByText("network-diagram.png")).toBeInTheDocument();
    });

    rerender(
      <RunDetailCreateHomeEvidenceCaptureRegion
        runId="run-b"
        buyerPolished
        artifacts={[{ artifactId: "art-b", name: "brief-b.md", createdUtc: "2026-08-12T10:00:00Z" }]}
      />,
    );

    expect(screen.queryByText("network-diagram.png")).not.toBeInTheDocument();
    expect(screen.getByText("brief-b.md")).toBeInTheDocument();
  });
});

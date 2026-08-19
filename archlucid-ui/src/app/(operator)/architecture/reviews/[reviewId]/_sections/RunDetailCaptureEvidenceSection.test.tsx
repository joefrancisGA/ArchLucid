import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RUN_DETAIL_EVIDENCE_CAPTURE_SECTION_TITLE } from "@/lib/bulk-evidence-upload-copy";

vi.mock("@/components/BulkEvidenceUpload", () => ({
  BulkEvidenceUpload: () => <div data-testid="bulk-evidence-upload" />,
}));

import { RunDetailCaptureEvidenceSection } from "./RunDetailCaptureEvidenceSection";

describe("RunDetailCaptureEvidenceSection", () => {
  it("uses the shared Add evidence product label and lighter section chrome (TB-1849)", () => {
    render(<RunDetailCaptureEvidenceSection runId="run-1" />);

    expect(screen.getByTestId("run-detail-capture-evidence-section")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: RUN_DETAIL_EVIDENCE_CAPTURE_SECTION_TITLE }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Capture evidence")).not.toBeInTheDocument();
    expect(screen.getByTestId("bulk-evidence-upload")).toBeInTheDocument();
  });
});

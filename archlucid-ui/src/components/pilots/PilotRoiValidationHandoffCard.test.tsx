import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/insights/sponsor-report",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams("runId=r1"),
}));

import type { PilotRunDeltasProofSummaryJson } from "@/lib/pilot-proof-readiness";

import { PilotRoiValidationHandoffCard } from "./PilotRoiValidationHandoffCard";

const strongRealPayload: PilotRunDeltasProofSummaryJson = {
  isDemoTenant: false,
  structuralExecutionMode: "Real",
  proofPackageCompleteness: {
    sponsorProofReadiness: "Sendable",
    proofSendability: "Sendable",
    roiEvidenceConfidence: "Strong",
    roiBaselineInputs: { projectedDollarClaimsSponsorSafe: true },
    agentOutputPilotStrictEvidenceSatisfied: true,
  },
};

const lowConfidencePayload: PilotRunDeltasProofSummaryJson = {
  ...strongRealPayload,
  proofPackageCompleteness: {
    ...strongRealPayload.proofPackageCompleteness,
    roiEvidenceConfidence: "Low",
  },
};

describe("PilotRoiValidationHandoffCard", () => {
  it("renders sendable state for Strong ROI confidence", () => {
    render(<PilotRoiValidationHandoffCard runId="run-1" payload={strongRealPayload} />);

    expect(screen.getByTestId("pilot-roi-validation-handoff-card")).toBeInTheDocument();
    expect(screen.getByText(/Safe to quote ROI externally/i)).toBeInTheDocument();
    expect(screen.getByText(/ROI confidence: Strong/i)).toBeInTheDocument();
  });

  it("renders hold state when ROI confidence is Low", () => {
    render(<PilotRoiValidationHandoffCard runId="run-2" payload={lowConfidencePayload} />);

    expect(screen.getByText(/Do not send sponsor PDF/i)).toBeInTheDocument();
    expect(screen.getByText(/ROI confidence: Low/i)).toBeInTheDocument();
  });

  it("copies validation checklist to clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(
      <PilotRoiValidationHandoffCard runId="run-copy" manifestVersion="v12" payload={strongRealPayload} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Copy validation notes/i }));

    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalledOnce();
    });

    expect(String(writeText.mock.calls[0]?.[0])).toContain("Run ID: run-copy");
  });
});

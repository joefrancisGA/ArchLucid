import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ImpactPreviewPolicyEnvelopeEntryStrip } from "@/components/architecture/ImpactPreviewPolicyEnvelopeEntryStrip";
import {
  SYSTEM_NOT_JOB_IMPACT_PREVIEW_ARCHITECTURE_DESK_CTA_LABEL,
  SYSTEM_NOT_JOB_IMPACT_PREVIEW_POLICY_ENVELOPE_HEADING,
} from "@/lib/system-not-job-impact-preview-envelope-entry";

const useArchitectureIdentityQuery = vi.fn();

vi.mock("@/hooks/use-architecture-identity-query", () => ({
  useArchitectureIdentityQuery: (...args: unknown[]) => useArchitectureIdentityQuery(...args),
}));

describe("ImpactPreviewPolicyEnvelopeEntryStrip (SN-007)", () => {
  it("shows policy envelope honesty and desk clone link when no current draft", () => {
    useArchitectureIdentityQuery.mockReturnValue({
      data: { currentDraftId: null },
      isLoading: false,
    });

    render(<ImpactPreviewPolicyEnvelopeEntryStrip architectureId="arch-1" />);

    expect(screen.getByText(SYSTEM_NOT_JOB_IMPACT_PREVIEW_POLICY_ENVELOPE_HEADING)).toBeInTheDocument();
    expect(screen.getByTestId("impact-preview-policy-envelope-production-disclaimer")).toBeInTheDocument();
    expect(screen.getByTestId("impact-preview-architecture-desk-clone-link")).toHaveAttribute(
      "href",
      "/architecture/architectures/arch-1",
    );
    expect(screen.getByText(SYSTEM_NOT_JOB_IMPACT_PREVIEW_ARCHITECTURE_DESK_CTA_LABEL)).toBeInTheDocument();
  });

  it("shows clone-from-snapshot control when architecture has a current draft", () => {
    useArchitectureIdentityQuery.mockReturnValue({
      data: { currentDraftId: "draft-1" },
      isLoading: false,
    });

    render(<ImpactPreviewPolicyEnvelopeEntryStrip architectureId="arch-1" />);

    expect(screen.getByTestId("impact-preview-architecture-clone-snapshot")).toBeInTheDocument();
    expect(screen.queryByTestId("impact-preview-architecture-desk-clone-link")).not.toBeInTheDocument();
  });
});

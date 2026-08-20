import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";

import { ConnectGcpSecurelyHelpEvidenceOrientationStrip } from "@/components/help/ConnectGcpSecurelyHelpEvidenceOrientationStrip";
import {
  CONNECT_GCP_SECURELY_CLAIM_DISCIPLINE,
  CONNECT_GCP_SECURELY_CLAIM_DISCIPLINE_HEADING,
  CONNECT_GCP_SECURELY_SOURCES,
} from "@/lib/connect-gcp-securely-help-evidence-copy";

describe("ConnectGcpSecurelyHelpEvidenceOrientationStrip", () => {
  it("renders claim discipline as an info callout with accessible name and diligence links", () => {
    render(<ConnectGcpSecurelyHelpEvidenceOrientationStrip />);

    expect(
      screen.getByRole("heading", { level: 2, name: CONNECT_GCP_SECURELY_CLAIM_DISCIPLINE_HEADING }),
    ).toBeInTheDocument();

    const claimDiscipline = screen.getByTestId("connect-gcp-securely-help-claim-discipline");
    expect(claimDiscipline.className).toContain("bg-al-surface-raised");
    expect(claimDiscipline.className).not.toContain("bg-amber");
    expect(claimDiscipline).toHaveAttribute("aria-labelledby", "connect-gcp-securely-help-claim-discipline-heading");
    expect(claimDiscipline).toHaveTextContent(CONNECT_GCP_SECURELY_CLAIM_DISCIPLINE);

    for (const link of CONNECT_GCP_SECURELY_SOURCES) {
      expectFollowUpLink(screen, link);
    }
  });
});

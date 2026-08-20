import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";

import { ConnectAzureSecurelyHelpEvidenceOrientationStrip } from "@/components/help/ConnectAzureSecurelyHelpEvidenceOrientationStrip";
import {
  CONNECT_AZURE_SECURELY_CLAIM_DISCIPLINE,
  CONNECT_AZURE_SECURELY_SOURCES,
} from "@/lib/connect-azure-securely-help-content";

describe("ConnectAzureSecurelyHelpEvidenceOrientationStrip", () => {
  it("renders claim discipline and where-to-go-next links", () => {
    render(<ConnectAzureSecurelyHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("connect-azure-securely-help-claim-discipline")).toHaveTextContent(
      CONNECT_AZURE_SECURELY_CLAIM_DISCIPLINE,
    );

    for (const link of CONNECT_AZURE_SECURELY_SOURCES) {
      expectFollowUpLink(screen, link);
    }
  });
});

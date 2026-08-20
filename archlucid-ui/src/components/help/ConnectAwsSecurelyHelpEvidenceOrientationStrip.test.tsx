import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";

import { ConnectAwsSecurelyHelpEvidenceOrientationStrip } from "@/components/help/ConnectAwsSecurelyHelpEvidenceOrientationStrip";
import {
  CONNECT_AWS_SECURELY_CLAIM_DISCIPLINE,
  CONNECT_AWS_SECURELY_SOURCES,
} from "@/lib/connect-aws-securely-help-evidence-copy";

describe("ConnectAwsSecurelyHelpEvidenceOrientationStrip", () => {
  it("renders claim discipline and Sources follow-up links", () => {
    render(<ConnectAwsSecurelyHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("connect-aws-securely-help-orientation")).toBeInTheDocument();
    expect(screen.getByTestId("connect-aws-securely-help-claim-discipline")).toHaveTextContent(
      CONNECT_AWS_SECURELY_CLAIM_DISCIPLINE,
    );

    for (const source of CONNECT_AWS_SECURELY_SOURCES) {
      expectFollowUpLink(screen, source);
    }
  });
});

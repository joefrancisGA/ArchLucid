import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  expectWhereToGoNextFollowUpLinks,
} from "@/lib/claim-discipline-test-helpers";

import { ConnectAwsSecurelyHelpEvidenceOrientationStrip } from "@/components/help/ConnectAwsSecurelyHelpEvidenceOrientationStrip";
import {
  CONNECT_AWS_SECURELY_SOURCES,
} from "@/lib/connect-aws-securely-help-evidence-copy";

describe("ConnectAwsSecurelyHelpEvidenceOrientationStrip", () => {
  it("renders sources-only follow-ups when header carries claim discipline", () => {
    render(<ConnectAwsSecurelyHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("connect-aws-securely-help-orientation")).toBeInTheDocument();
    expect(screen.queryByTestId("connect-aws-securely-help-claim-discipline")).toBeNull();

    expectWhereToGoNextFollowUpLinks(screen, CONNECT_AWS_SECURELY_SOURCES);
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";

import { SecurityTrustHelpEvidenceOrientationStrip } from "@/components/help/SecurityTrustHelpEvidenceOrientationStrip";
import {
  SECURITY_TRUST_HELP_CLAIM_DISCIPLINE,
  SECURITY_TRUST_HELP_SOURCES,
} from "@/lib/security-trust-help-evidence-copy";

describe("SecurityTrustHelpEvidenceOrientationStrip", () => {
  it("renders claim discipline and all Sources links", () => {
    render(<SecurityTrustHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("security-trust-help-claim-discipline")).toHaveTextContent(
      SECURITY_TRUST_HELP_CLAIM_DISCIPLINE,
    );

    for (const link of SECURITY_TRUST_HELP_SOURCES) {
      expectFollowUpLink(screen, link);
    }
  });
});

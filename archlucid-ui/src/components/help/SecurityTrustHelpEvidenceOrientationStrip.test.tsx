import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";

import { SecurityTrustHelpEvidenceOrientationStrip } from "@/components/help/SecurityTrustHelpEvidenceOrientationStrip";
import {
  expectClaimDisciplineBandContent,
} from "@/lib/claim-discipline-test-helpers";
import {
  SECURITY_TRUST_HELP_CLAIM_DISCIPLINE,
  SECURITY_TRUST_HELP_SOURCES,
} from "@/lib/security-trust-help-evidence-copy";

describe("SecurityTrustHelpEvidenceOrientationStrip", () => {
  it("renders claim discipline and all Sources links", () => {
    render(<SecurityTrustHelpEvidenceOrientationStrip />);

    expectClaimDisciplineBandContent(
      screen,
      "security-trust-help",
      "security-trust-help-claim-discipline",
      SECURITY_TRUST_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );

    for (const link of SECURITY_TRUST_HELP_SOURCES) {
      expectFollowUpLink(screen, link);
    }
  });
});

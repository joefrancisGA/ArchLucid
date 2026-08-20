import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";

import { SubprocessorsHelpEvidenceOrientationStrip } from "@/components/help/SubprocessorsHelpEvidenceOrientationStrip";
import {
  SUBPROCESSORS_HELP_CLAIM_DISCIPLINE,
  SUBPROCESSORS_HELP_SOURCES,
} from "@/lib/subprocessors-help-evidence-copy";

describe("SubprocessorsHelpEvidenceOrientationStrip", () => {
  it("renders claim discipline and all Sources links", () => {
    render(<SubprocessorsHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("subprocessors-help-claim-discipline")).toHaveTextContent(
      SUBPROCESSORS_HELP_CLAIM_DISCIPLINE,
    );

    for (const link of SUBPROCESSORS_HELP_SOURCES) {
      expectFollowUpLink(screen, link);
    }
  });
});

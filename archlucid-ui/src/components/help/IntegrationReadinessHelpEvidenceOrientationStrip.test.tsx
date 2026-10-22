import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  expectClaimDisciplineBandContent,
  expectWhereToGoNextFollowUpLinks,
} from "@/lib/claim-discipline-test-helpers";

import { IntegrationReadinessHelpEvidenceOrientationStrip } from "@/components/help/IntegrationReadinessHelpEvidenceOrientationStrip";
import {
  INTEGRATION_READINESS_HELP_CLAIM_DISCIPLINE,
  INTEGRATION_READINESS_HELP_SOURCES,
} from "@/lib/integration-readiness-help-evidence-copy";

describe("IntegrationReadinessHelpEvidenceOrientationStrip", () => {
  it("renders connector follow-up links without duplicate claim discipline when omitted", () => {
    render(<IntegrationReadinessHelpEvidenceOrientationStrip />);

    expectClaimDisciplineBandContent(
      screen,
      "integration-readiness-help",
      "integration-readiness-help-claim-discipline",
      INTEGRATION_READINESS_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );

    expectWhereToGoNextFollowUpLinks(screen, INTEGRATION_READINESS_HELP_SOURCES);
  });
});

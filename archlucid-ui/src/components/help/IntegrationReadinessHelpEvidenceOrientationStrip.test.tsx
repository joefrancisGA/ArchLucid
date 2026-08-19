import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { IntegrationReadinessHelpEvidenceOrientationStrip } from "@/components/help/IntegrationReadinessHelpEvidenceOrientationStrip";
import {
  INTEGRATION_READINESS_HELP_CLAIM_DISCIPLINE,
  INTEGRATION_READINESS_HELP_SOURCES,
} from "@/lib/integration-readiness-help-evidence-copy";

describe("IntegrationReadinessHelpEvidenceOrientationStrip", () => {
  it("renders claim discipline and all connector follow-up links", () => {
    render(<IntegrationReadinessHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("integration-readiness-help-claim-discipline")).toHaveTextContent(
      INTEGRATION_READINESS_HELP_CLAIM_DISCIPLINE,
    );

    for (const link of INTEGRATION_READINESS_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }
  });
});

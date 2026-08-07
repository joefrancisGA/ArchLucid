import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { IntegrationReadinessHelpEvidenceOrientationStrip } from "@/app/(operator)/help/_sections/IntegrationReadinessHelpEvidenceOrientationStrip";
import {
  INTEGRATION_READINESS_HELP_CANONICAL_PATH,
  INTEGRATION_READINESS_HELP_SOURCES,
} from "@/lib/integration-readiness-help-evidence-copy";

describe("IntegrationReadinessHelpEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking integration-readiness help", () => {
    render(<IntegrationReadinessHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("integration-readiness-help-sources")).toBeInTheDocument();
    expect(screen.getByTestId("integration-readiness-help-claim-discipline")).toBeInTheDocument();

    for (const link of INTEGRATION_READINESS_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      INTEGRATION_READINESS_HELP_SOURCES.some(
        (link) => link.href === INTEGRATION_READINESS_HELP_CANONICAL_PATH,
      ),
    ).toBe(false);
  });
});

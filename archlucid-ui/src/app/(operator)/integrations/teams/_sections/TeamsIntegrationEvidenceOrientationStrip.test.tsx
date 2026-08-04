import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TeamsIntegrationEvidenceOrientationStrip } from "@/app/(operator)/integrations/teams/_sections/TeamsIntegrationEvidenceOrientationStrip";
import {
  TEAMS_INTEGRATION_CLAIM_DISCIPLINE,
  TEAMS_INTEGRATION_SOURCES_INTRO,
} from "@/lib/teams-integration-evidence-copy";

describe("TeamsIntegrationEvidenceOrientationStrip", () => {
  it("renders Sources and claim-discipline chrome", () => {
    render(<TeamsIntegrationEvidenceOrientationStrip />);

    expect(screen.getByTestId("teams-integration-sources")).toBeInTheDocument();
    expect(screen.getByTestId("teams-integration-claim-discipline")).toBeInTheDocument();
    expect(screen.getByText(TEAMS_INTEGRATION_SOURCES_INTRO)).toBeInTheDocument();
    expect(screen.getByText(TEAMS_INTEGRATION_CLAIM_DISCIPLINE)).toBeInTheDocument();
  });
});

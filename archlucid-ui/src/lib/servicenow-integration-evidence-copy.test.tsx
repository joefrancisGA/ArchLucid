import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ServiceNowIntegrationEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  SERVICENOW_INTEGRATION_CANONICAL_PATH,
  SERVICENOW_INTEGRATION_FOLLOW_UPS_TITLE,
  SERVICENOW_INTEGRATION_SOURCES,
  SERVICENOW_INTEGRATION_SOURCES_INTRO,
} from "@/lib/servicenow-integration-evidence-copy";

describe("servicenow-integration-evidence-copy", () => {
  it("publishes its canonical operator path", () => {
    expect(SERVICENOW_INTEGRATION_CANONICAL_PATH).toBe("/integrations/servicenow");
  });

  it("renders claim discipline and operator Sources follow-ups", () => {
    render(<ServiceNowIntegrationEvidenceOrientationStrip />);

    expect(screen.queryByTestId("servicenow-integration-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByText(SERVICENOW_INTEGRATION_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("servicenow-integration-sources");

    for (const link of SERVICENOW_INTEGRATION_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${SERVICENOW_INTEGRATION_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels claim discipline and follow-ups for accessibility parity", () => {
    render(<ServiceNowIntegrationEvidenceOrientationStrip />);
    expect(screen.getByRole("heading", { name: SERVICENOW_INTEGRATION_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByText(/Sources package/i)).toBeNull();
  });
});

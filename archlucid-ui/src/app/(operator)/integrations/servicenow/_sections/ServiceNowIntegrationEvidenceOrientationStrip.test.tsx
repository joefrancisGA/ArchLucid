import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ServiceNowIntegrationEvidenceOrientationStrip } from "@/app/(operator)/integrations/servicenow/_sections/ServiceNowIntegrationEvidenceOrientationStrip";
import {
  SERVICENOW_INTEGRATION_CANONICAL_PATH,
  SERVICENOW_INTEGRATION_SOURCES,
} from "@/lib/servicenow-integration-evidence-copy";

describe("ServiceNowIntegrationEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking ServiceNow integration", () => {
    render(<ServiceNowIntegrationEvidenceOrientationStrip />);

    expect(screen.getByTestId("servicenow-integration-sources")).toBeInTheDocument();
    expect(screen.getByTestId("servicenow-integration-claim-discipline")).toBeInTheDocument();

    for (const link of SERVICENOW_INTEGRATION_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      SERVICENOW_INTEGRATION_SOURCES.some((link) => link.href === SERVICENOW_INTEGRATION_CANONICAL_PATH),
    ).toBe(false);
  });
});

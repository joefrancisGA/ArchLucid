import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";

import { AzureBoardsIntegrationEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  AZURE_BOARDS_INTEGRATION_CANONICAL_PATH,
  AZURE_BOARDS_INTEGRATION_FOLLOW_UPS_TITLE,
  AZURE_BOARDS_INTEGRATION_SOURCES,
  AZURE_BOARDS_INTEGRATION_SOURCES_INTRO,
} from "@/lib/azure-boards-integration-evidence-copy";

describe("azure-boards-integration-evidence-copy", () => {
  it("publishes its canonical operator path", () => {
    expect(AZURE_BOARDS_INTEGRATION_CANONICAL_PATH).toBe("/integrations/azure-boards");
  });

  it("renders claim discipline and operator Sources follow-ups", () => {
    render(<AzureBoardsIntegrationEvidenceOrientationStrip />);

    expect(screen.queryByTestId("azure-boards-integration-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByText(AZURE_BOARDS_INTEGRATION_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("azure-boards-integration-sources");

    for (const link of AZURE_BOARDS_INTEGRATION_SOURCES) {
      expectFollowUpLink(within(sources), link);
    }

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${AZURE_BOARDS_INTEGRATION_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels claim discipline and follow-ups for accessibility parity", () => {
    render(<AzureBoardsIntegrationEvidenceOrientationStrip />);
    expect(screen.getByRole("heading", { name: AZURE_BOARDS_INTEGRATION_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByText(/Sources package/i)).toBeNull();
  });
});

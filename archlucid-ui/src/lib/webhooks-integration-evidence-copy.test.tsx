import { render, screen, within } from "@testing-library/react";
import { describe, expect, it , vi} from "vitest";
import { expectWhereToGoNextFollowUpLinks } from "@/lib/claim-discipline-test-helpers";

import { WebhooksIntegrationEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  WEBHOOKS_INTEGRATION_CANONICAL_PATH,
  WEBHOOKS_INTEGRATION_FOLLOW_UPS_TITLE,
  WEBHOOKS_INTEGRATION_SOURCES,
  WEBHOOKS_INTEGRATION_SOURCES_INTRO,
} from "@/lib/webhooks-integration-evidence-copy";

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

describe("webhooks-integration-evidence-copy", () => {
  it("publishes its canonical operator path", () => {
    expect(WEBHOOKS_INTEGRATION_CANONICAL_PATH).toBe("/integrations/webhooks");
  });

  it("renders claim discipline and operator Sources follow-ups", () => {
    render(<WebhooksIntegrationEvidenceOrientationStrip />);

    expect(screen.queryByTestId("webhooks-integration-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByText(WEBHOOKS_INTEGRATION_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("webhooks-integration-sources");

    expectWhereToGoNextFollowUpLinks(within(sources), WEBHOOKS_INTEGRATION_SOURCES, WEBHOOKS_INTEGRATION_CANONICAL_PATH);

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${WEBHOOKS_INTEGRATION_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels claim discipline and follow-ups for accessibility parity", () => {
    render(<WebhooksIntegrationEvidenceOrientationStrip />);
    expect(screen.getByRole("heading", { name: WEBHOOKS_INTEGRATION_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByText(/Sources package/i)).toBeNull();
  });
});

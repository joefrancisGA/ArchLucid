import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";

import { IntegrationEventsDlqEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  INTEGRATION_EVENTS_DLQ_CANONICAL_PATH,
  INTEGRATION_EVENTS_DLQ_FOLLOW_UPS_TITLE,
  INTEGRATION_EVENTS_DLQ_SOURCES,
  INTEGRATION_EVENTS_DLQ_SOURCES_INTRO,
} from "@/lib/integration-events-dlq-evidence-copy";

describe("integration-events-dlq-evidence-copy", () => {
  it("publishes its canonical operator path", () => {
    expect(INTEGRATION_EVENTS_DLQ_CANONICAL_PATH).toBe("/internal/failed-integration-messages");
  });

  it("renders operator Sources follow-ups without a claim-discipline callout", () => {
    render(<IntegrationEventsDlqEvidenceOrientationStrip />);

    expect(screen.queryByTestId("integration-events-dlq-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByText(INTEGRATION_EVENTS_DLQ_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("integration-events-dlq-sources");

    for (const link of INTEGRATION_EVENTS_DLQ_SOURCES) {
      expectFollowUpLink(within(sources), link);
    }

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${INTEGRATION_EVENTS_DLQ_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels follow-ups for accessibility parity", () => {
    render(<IntegrationEventsDlqEvidenceOrientationStrip />);
    expect(screen.getByRole("heading", { name: INTEGRATION_EVENTS_DLQ_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Sources package/i })).toBeNull();
  });
});

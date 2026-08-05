import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { IntegrationEventsDlqEvidenceOrientationStrip } from "@/app/(operator)/operate/integration-events/dlq/_sections/IntegrationEventsDlqEvidenceOrientationStrip";
import {
  INTEGRATION_EVENTS_DLQ_CANONICAL_PATH,
  INTEGRATION_EVENTS_DLQ_SOURCES,
} from "@/lib/integration-events-dlq-evidence-copy";

describe("IntegrationEventsDlqEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking the DLQ page", () => {
    render(<IntegrationEventsDlqEvidenceOrientationStrip />);

    expect(screen.getByTestId("integration-events-dlq-sources")).toBeInTheDocument();
    expect(screen.getByTestId("integration-events-dlq-claim-discipline")).toBeInTheDocument();

    for (const link of INTEGRATION_EVENTS_DLQ_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      INTEGRATION_EVENTS_DLQ_SOURCES.some((link) => link.href === INTEGRATION_EVENTS_DLQ_CANONICAL_PATH),
    ).toBe(false);
  });
});

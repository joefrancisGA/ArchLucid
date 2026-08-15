import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { IntegrationEventsDlqEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  INTEGRATION_EVENTS_DLQ_CANONICAL_PATH,
  INTEGRATION_EVENTS_DLQ_FOLLOW_UPS_TITLE,
  INTEGRATION_EVENTS_DLQ_SOURCES,
  INTEGRATION_EVENTS_DLQ_SOURCES_INTRO,
} from "@/lib/integration-events-dlq-evidence-copy";
import { readClaimAndSourcesRegistrySource } from "@/lib/testing/claim-and-sources-registry-source";

describe("integration-events-dlq-evidence-copy", () => {
  it("wires exports into the integration DLQ evidence strip registry", () => {
    const registrySource = readClaimAndSourcesRegistrySource();

    expect(registrySource).toContain("integration-events-dlq-evidence-copy");
    expect(registrySource).toContain("IntegrationEventsDlqEvidenceOrientationStrip");
    expect(INTEGRATION_EVENTS_DLQ_CANONICAL_PATH).toBe("/internal/failed-integration-messages");
  });

  it("renders operator Sources follow-ups without a claim-discipline callout", () => {
    render(<IntegrationEventsDlqEvidenceOrientationStrip />);

    expect(screen.queryByTestId("integration-events-dlq-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByText(INTEGRATION_EVENTS_DLQ_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("integration-events-dlq-sources");

    for (const link of INTEGRATION_EVENTS_DLQ_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
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

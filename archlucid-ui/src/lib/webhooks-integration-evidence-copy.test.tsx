import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WebhooksIntegrationEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { readClaimAndSourcesRegistrySource } from "@/lib/testing/claim-and-sources-registry-source";
import {
  WEBHOOKS_INTEGRATION_CANONICAL_PATH,
  WEBHOOKS_INTEGRATION_FOLLOW_UPS_TITLE,
  WEBHOOKS_INTEGRATION_SOURCES,
  WEBHOOKS_INTEGRATION_SOURCES_INTRO,
} from "@/lib/webhooks-integration-evidence-copy";

describe("webhooks-integration-evidence-copy", () => {
  it("wires exports into the Webhooks integration evidence strip registry", () => {
    const registrySource = readClaimAndSourcesRegistrySource();

    expect(registrySource).toContain("webhooks-integration-evidence-copy");
    expect(registrySource).toContain("WebhooksIntegrationEvidenceOrientationStrip");
    expect(WEBHOOKS_INTEGRATION_CANONICAL_PATH).toBe("/integrations/webhooks");
  });

  it("renders claim discipline and operator Sources follow-ups", () => {
    render(<WebhooksIntegrationEvidenceOrientationStrip />);

    expect(screen.queryByTestId("webhooks-integration-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByText(WEBHOOKS_INTEGRATION_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("webhooks-integration-sources");

    for (const link of WEBHOOKS_INTEGRATION_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

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

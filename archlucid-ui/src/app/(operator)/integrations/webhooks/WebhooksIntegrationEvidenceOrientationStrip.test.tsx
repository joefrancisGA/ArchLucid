import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WebhooksIntegrationEvidenceOrientationStrip } from "@/app/(operator)/integrations/webhooks/WebhooksIntegrationEvidenceOrientationStrip";
import {
  WEBHOOKS_INTEGRATION_CANONICAL_PATH,
  WEBHOOKS_INTEGRATION_SOURCES,
} from "@/lib/webhooks-integration-evidence-copy";

describe("WebhooksIntegrationEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking webhooks integration", () => {
    render(<WebhooksIntegrationEvidenceOrientationStrip />);

    expect(screen.getByTestId("webhooks-integration-sources")).toBeInTheDocument();
    expect(screen.getByTestId("webhooks-integration-claim-discipline")).toBeInTheDocument();

    for (const link of WEBHOOKS_INTEGRATION_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      WEBHOOKS_INTEGRATION_SOURCES.some((link) => link.href === WEBHOOKS_INTEGRATION_CANONICAL_PATH),
    ).toBe(false);
  });
});

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CloudConnectionsEvidenceOrientationStrip } from "@/app/(operator)/integrations/cloud-connections/_sections/CloudConnectionsEvidenceOrientationStrip";
import {
  CLOUD_CONNECTIONS_CANONICAL_PATH,
  CLOUD_CONNECTIONS_SOURCES,
} from "@/lib/cloud-connections-evidence-copy";

describe("CloudConnectionsEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking the landing page", () => {
    render(<CloudConnectionsEvidenceOrientationStrip />);

    expect(screen.getByTestId("cloud-connections-sources")).toBeInTheDocument();
    expect(screen.getByTestId("cloud-connections-claim-discipline")).toHaveTextContent(
      /Connection readiness|diligence Sources/i,
    );

    const sources = screen.getByTestId("cloud-connections-sources");

    for (const link of CLOUD_CONNECTIONS_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(CLOUD_CONNECTIONS_SOURCES.some((link) => link.href === CLOUD_CONNECTIONS_CANONICAL_PATH)).toBe(
      false,
    );
  });
});

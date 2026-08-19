import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CloudConnectionsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  CLOUD_CONNECTIONS_CANONICAL_PATH,
  CLOUD_CONNECTIONS_FOLLOW_UPS_TITLE,
  CLOUD_CONNECTIONS_SOURCES,
  CLOUD_CONNECTIONS_SOURCES_INTRO,
} from "@/lib/cloud-connections-evidence-copy";

describe("cloud-connections-evidence-copy", () => {
  it("publishes its canonical operator path", () => {
    expect(CLOUD_CONNECTIONS_CANONICAL_PATH).toBe("/integrations/cloud-connections");
  });

  it("renders claim discipline and operator Sources follow-ups", () => {
    render(<CloudConnectionsEvidenceOrientationStrip />);

    expect(screen.queryByTestId("cloud-connections-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByText(CLOUD_CONNECTIONS_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("cloud-connections-sources");

    for (const link of CLOUD_CONNECTIONS_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${CLOUD_CONNECTIONS_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels claim discipline and follow-ups for accessibility parity", () => {
    render(<CloudConnectionsEvidenceOrientationStrip />);
    expect(screen.getByRole("heading", { name: CLOUD_CONNECTIONS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByText(/Sources package/i)).toBeNull();
  });
});

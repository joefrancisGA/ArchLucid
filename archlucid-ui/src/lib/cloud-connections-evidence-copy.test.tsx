import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";

import { CloudConnectionsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  CLOUD_CONNECTIONS_CANONICAL_PATH,
  CLOUD_CONNECTIONS_FOLLOW_UPS_TITLE,
  CLOUD_CONNECTIONS_SOURCES,
  CLOUD_CONNECTIONS_SOURCES_INTRO,
} from "@/lib/cloud-connections-evidence-copy";
import { HUB_SECONDARY_FOLLOW_UPS_TITLES } from "@/lib/evidence-orientation/hub-secondary-follow-ups";

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
      expectFollowUpLink(within(sources), link);
    }

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${CLOUD_CONNECTIONS_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels claim discipline and follow-ups for accessibility parity", () => {
    render(<CloudConnectionsEvidenceOrientationStrip />);
    expect(screen.getByRole("heading", { name: CLOUD_CONNECTIONS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(CLOUD_CONNECTIONS_FOLLOW_UPS_TITLE).toBe(HUB_SECONDARY_FOLLOW_UPS_TITLES.cloudConnections);
    expect(CLOUD_CONNECTIONS_SOURCES_INTRO.toLowerCase()).toContain("above");
    expect(screen.queryByText(/Sources package/i)).toBeNull();
  });

  it("does not single out a cloud provider in hub follow-ups", () => {
    const labels = CLOUD_CONNECTIONS_SOURCES.map((link) => link.label.toLowerCase()).join(" ");
    const hrefs = CLOUD_CONNECTIONS_SOURCES.map((link) => link.href).join(" ");

    expect(labels).not.toMatch(/\b(azure|aws|gcp)\b/);
    expect(hrefs).not.toContain("azure-permissions");
  });
});

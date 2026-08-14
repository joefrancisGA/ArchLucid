import { readFileSync } from "node:fs";
import path from "node:path";

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CloudConnectionsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  CLOUD_CONNECTIONS_CANONICAL_PATH,
  CLOUD_CONNECTIONS_CLAIM_DISCIPLINE,
  CLOUD_CONNECTIONS_CLAIM_DISCIPLINE_HEADING,
  CLOUD_CONNECTIONS_CLAIM_HEADING_ID,
  CLOUD_CONNECTIONS_FOLLOW_UPS_TITLE,
  CLOUD_CONNECTIONS_SOURCES,
  CLOUD_CONNECTIONS_SOURCES_INTRO,
} from "@/lib/cloud-connections-evidence-copy";

describe("cloud-connections-evidence-copy", () => {
  it("wires exports into the cloud connections evidence strip registry", () => {
    const registryPath = path.join(
      process.cwd(),
      "src/components/evidence-orientation/registry/claim-and-sources-strips.tsx",
    );
    const registrySource = readFileSync(registryPath, "utf8");

    expect(registrySource).toContain("cloud-connections-evidence-copy");
    expect(registrySource).toContain("CloudConnectionsEvidenceOrientationStrip");
    expect(CLOUD_CONNECTIONS_CANONICAL_PATH).toBe("/integrations/cloud-connections");
  });

  it("renders claim discipline and operator Sources follow-ups", () => {
    render(<CloudConnectionsEvidenceOrientationStrip />);

    expect(screen.getByTestId("cloud-connections-claim-discipline")).toHaveTextContent(
      CLOUD_CONNECTIONS_CLAIM_DISCIPLINE,
    );
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

    const claim = screen.getByTestId("cloud-connections-claim-discipline");
    expect(claim).toHaveAttribute("aria-labelledby", CLOUD_CONNECTIONS_CLAIM_HEADING_ID);
    expect(screen.getByRole("heading", { name: CLOUD_CONNECTIONS_CLAIM_DISCIPLINE_HEADING })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: CLOUD_CONNECTIONS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByText(/Sources package/i)).toBeNull();
  });
});

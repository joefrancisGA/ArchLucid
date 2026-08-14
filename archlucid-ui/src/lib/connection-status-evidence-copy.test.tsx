import { readFileSync } from "node:fs";
import path from "node:path";

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ConnectionStatusEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  CONNECTION_STATUS_CANONICAL_PATH,
  CONNECTION_STATUS_CLAIM_DISCIPLINE,
  CONNECTION_STATUS_CLAIM_DISCIPLINE_HEADING,
  CONNECTION_STATUS_CLAIM_HEADING_ID,
  CONNECTION_STATUS_FOLLOW_UPS_TITLE,
  CONNECTION_STATUS_SOURCES,
  CONNECTION_STATUS_SOURCES_INTRO,
} from "@/lib/connection-status-evidence-copy";

describe("connection-status-evidence-copy", () => {
  it("wires exports into the Connection status evidence strip registry", () => {
    const registryPath = path.join(
      process.cwd(),
      "src/components/evidence-orientation/registry/claim-and-sources-strips.tsx",
    );
    const registrySource = readFileSync(registryPath, "utf8");

    expect(registrySource).toContain("connection-status-evidence-copy");
    expect(registrySource).toContain("ConnectionStatusEvidenceOrientationStrip");
    expect(CONNECTION_STATUS_CANONICAL_PATH).toBe("/administration/connection-status");
  });

  it("renders claim discipline and operator Sources follow-ups", () => {
    render(<ConnectionStatusEvidenceOrientationStrip />);

    expect(screen.getByTestId("connection-status-claim-discipline")).toHaveTextContent(
      CONNECTION_STATUS_CLAIM_DISCIPLINE,
    );
    expect(screen.getByText(CONNECTION_STATUS_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("connection-status-sources");

    for (const link of CONNECTION_STATUS_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${CONNECTION_STATUS_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels claim discipline and follow-ups for accessibility parity", () => {
    render(<ConnectionStatusEvidenceOrientationStrip />);

    const claim = screen.getByTestId("connection-status-claim-discipline");
    expect(claim).toHaveAttribute("aria-labelledby", CONNECTION_STATUS_CLAIM_HEADING_ID);
    expect(screen.getByRole("heading", { name: CONNECTION_STATUS_CLAIM_DISCIPLINE_HEADING })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: CONNECTION_STATUS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Sources package/i })).toBeNull();
  });
});

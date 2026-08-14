import { readFileSync } from "node:fs";
import path from "node:path";

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DeploymentStatusEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  DEPLOYMENT_STATUS_CANONICAL_PATH,
  DEPLOYMENT_STATUS_CLAIM_DISCIPLINE,
  DEPLOYMENT_STATUS_CLAIM_DISCIPLINE_HEADING,
  DEPLOYMENT_STATUS_CLAIM_HEADING_ID,
  DEPLOYMENT_STATUS_FOLLOW_UPS_TITLE,
  DEPLOYMENT_STATUS_SOURCES,
  DEPLOYMENT_STATUS_SOURCES_INTRO,
} from "@/lib/deployment-status-evidence-copy";

describe("deployment-status-evidence-copy", () => {
  it("wires exports into the Deployment status evidence strip registry", () => {
    const registryPath = path.join(
      process.cwd(),
      "src/components/evidence-orientation/registry/claim-and-sources-strips.tsx",
    );
    const registrySource = readFileSync(registryPath, "utf8");

    expect(registrySource).toContain("deployment-status-evidence-copy");
    expect(registrySource).toContain("DeploymentStatusEvidenceOrientationStrip");
    expect(DEPLOYMENT_STATUS_CANONICAL_PATH).toBe("/internal/deployment-status");
  });

  it("renders claim discipline and operator Sources follow-ups", () => {
    render(<DeploymentStatusEvidenceOrientationStrip />);

    expect(screen.getByTestId("deployment-status-claim-discipline")).toHaveTextContent(
      DEPLOYMENT_STATUS_CLAIM_DISCIPLINE,
    );
    expect(screen.getByText(DEPLOYMENT_STATUS_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("deployment-status-sources");

    for (const link of DEPLOYMENT_STATUS_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${DEPLOYMENT_STATUS_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels claim discipline and follow-ups for accessibility parity", () => {
    render(<DeploymentStatusEvidenceOrientationStrip />);

    const claim = screen.getByTestId("deployment-status-claim-discipline");
    expect(claim).toHaveAttribute("aria-labelledby", DEPLOYMENT_STATUS_CLAIM_HEADING_ID);
    expect(screen.getByRole("heading", { name: DEPLOYMENT_STATUS_CLAIM_DISCIPLINE_HEADING })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: DEPLOYMENT_STATUS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Sources package/i })).toBeNull();
  });
});

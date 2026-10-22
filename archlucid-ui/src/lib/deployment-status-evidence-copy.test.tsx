import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";

import { DeploymentStatusEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  DEPLOYMENT_STATUS_CANONICAL_PATH,
  DEPLOYMENT_STATUS_FOLLOW_UPS_TITLE,
  DEPLOYMENT_STATUS_SOURCES,
  DEPLOYMENT_STATUS_SOURCES_INTRO,
} from "@/lib/deployment-status-evidence-copy";

describe("deployment-status-evidence-copy", () => {
  it("publishes its canonical operator path", () => {
    expect(DEPLOYMENT_STATUS_CANONICAL_PATH).toBe("/internal/deployment-status");
  });

  it("renders claim discipline and operator Sources follow-ups", () => {
    render(<DeploymentStatusEvidenceOrientationStrip />);

    expect(screen.queryByTestId("deployment-status-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByText(DEPLOYMENT_STATUS_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("deployment-status-sources");

    for (const link of DEPLOYMENT_STATUS_SOURCES) {
      expectFollowUpLink(within(sources), link);
    }

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${DEPLOYMENT_STATUS_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels claim discipline and follow-ups for accessibility parity", () => {
    render(<DeploymentStatusEvidenceOrientationStrip />);
    expect(screen.getByRole("heading", { name: DEPLOYMENT_STATUS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Sources package/i })).toBeNull();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DeploymentStatusEvidenceOrientationStrip } from "@/app/(operator)/admin/deployment-status/_sections/DeploymentStatusEvidenceOrientationStrip";
import {
  DEPLOYMENT_STATUS_CANONICAL_PATH,
  DEPLOYMENT_STATUS_SOURCES,
} from "@/lib/deployment-status-evidence-copy";

describe("DeploymentStatusEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking deployment status", () => {
    render(<DeploymentStatusEvidenceOrientationStrip />);

    expect(screen.getByTestId("deployment-status-sources")).toBeInTheDocument();
    expect(screen.getByTestId("deployment-status-claim-discipline")).toBeInTheDocument();

    for (const link of DEPLOYMENT_STATUS_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      DEPLOYMENT_STATUS_SOURCES.some((link) => link.href === DEPLOYMENT_STATUS_CANONICAL_PATH),
    ).toBe(false);
  });
});

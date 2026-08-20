import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";

import { AdminHealthEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  ADMIN_HEALTH_CANONICAL_PATH,
  ADMIN_HEALTH_FOLLOW_UPS_TITLE,
  ADMIN_HEALTH_SOURCES,
  ADMIN_HEALTH_SOURCES_INTRO,
} from "@/lib/admin-health-evidence-copy";

describe("admin-health-evidence-copy", () => {
  it("publishes its canonical operator path", () => {
    expect(ADMIN_HEALTH_CANONICAL_PATH).toBe("/internal/health");
  });

  it("renders operator Sources follow-ups without a claim-discipline callout", () => {
    render(<AdminHealthEvidenceOrientationStrip />);

    expect(screen.queryByTestId("admin-health-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByText(ADMIN_HEALTH_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("admin-health-sources");

    for (const link of ADMIN_HEALTH_SOURCES) {
      expectFollowUpLink(within(sources), link);
    }

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${ADMIN_HEALTH_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels follow-ups for accessibility parity", () => {
    render(<AdminHealthEvidenceOrientationStrip />);
    expect(screen.getByRole("heading", { name: ADMIN_HEALTH_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Sources package/i })).toBeNull();
  });
});

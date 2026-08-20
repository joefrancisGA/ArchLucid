import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";

import { AdminItsmConnectorsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  ADMIN_ITSM_CONNECTORS_CANONICAL_PATH,
  ADMIN_ITSM_CONNECTORS_FOLLOW_UPS_TITLE,
  ADMIN_ITSM_CONNECTORS_SOURCES,
  ADMIN_ITSM_CONNECTORS_SOURCES_INTRO,
} from "@/lib/admin-itsm-connectors-evidence-copy";

describe("admin-itsm-connectors-evidence-copy", () => {
  it("publishes its canonical operator path", () => {
    expect(ADMIN_ITSM_CONNECTORS_CANONICAL_PATH).toBe("/internal/integrations/itsm");
  });

  it("renders operator Sources follow-ups without a claim-discipline callout", () => {
    render(<AdminItsmConnectorsEvidenceOrientationStrip />);

    expect(screen.queryByTestId("admin-itsm-connectors-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByText(ADMIN_ITSM_CONNECTORS_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("admin-itsm-connectors-sources");

    for (const link of ADMIN_ITSM_CONNECTORS_SOURCES) {
      expectFollowUpLink(within(sources), link);
    }

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${ADMIN_ITSM_CONNECTORS_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels follow-ups for accessibility parity", () => {
    render(<AdminItsmConnectorsEvidenceOrientationStrip />);
    expect(screen.getByRole("heading", { name: ADMIN_ITSM_CONNECTORS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Sources package/i })).toBeNull();
  });
});

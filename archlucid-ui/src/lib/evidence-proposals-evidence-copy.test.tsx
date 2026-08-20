import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";

import { EvidenceProposalsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  EVIDENCE_PROPOSALS_CANONICAL_PATH,
  EVIDENCE_PROPOSALS_FOLLOW_UPS_TITLE,
  EVIDENCE_PROPOSALS_SOURCES,
  EVIDENCE_PROPOSALS_SOURCES_INTRO,
} from "@/lib/evidence-proposals-evidence-copy";

describe("evidence-proposals-evidence-copy", () => {
  it("publishes its canonical operator path", () => {
    expect(EVIDENCE_PROPOSALS_CANONICAL_PATH).toBe("/internal/evidence-proposals");
  });

  it("renders claim discipline and operator Sources follow-ups", () => {
    render(<EvidenceProposalsEvidenceOrientationStrip />);

    expect(screen.queryByTestId("evidence-proposals-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByText(EVIDENCE_PROPOSALS_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("evidence-proposals-sources");

    for (const link of EVIDENCE_PROPOSALS_SOURCES) {
      expectFollowUpLink(within(sources), link);
    }

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${EVIDENCE_PROPOSALS_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels claim discipline and follow-ups for accessibility parity", () => {
    render(<EvidenceProposalsEvidenceOrientationStrip />);
    expect(screen.getByRole("heading", { name: EVIDENCE_PROPOSALS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Sources package/i })).toBeNull();
  });
});

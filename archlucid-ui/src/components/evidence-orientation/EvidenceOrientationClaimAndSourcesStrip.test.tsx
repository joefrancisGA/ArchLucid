import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { HELP_DILIGENCE_ARTIFACT_INDEX_TITLE } from "@/lib/help/help-diligence-artifact-index";

describe("EvidenceOrientationClaimAndSourcesStrip", () => {
  it("derives every band test id from the slug and defaults to the diligence index title", () => {
    render(
      <EvidenceOrientationClaimAndSourcesStrip
        slug="findings-help"
        claim="Help orientation, not a diligence package."
        sourcesIntro="Follow-ups."
        sources={[{ label: "Findings", href: "/governance/findings" }]}
      />,
    );

    expect(screen.getByTestId("findings-help-orientation")).toBeInTheDocument();
    expect(screen.getByTestId("findings-help-claim-discipline").textContent).toContain(
      "Help orientation, not a diligence package.",
    );
    expect(screen.getByTestId("findings-help-sources")).toHaveAttribute(
      "aria-labelledby",
      "findings-help-sources-heading",
    );
    expect(
      screen.getByRole("heading", { name: HELP_DILIGENCE_ARTIFACT_INDEX_TITLE }),
    ).toBeInTheDocument();
  });

  it("honors published test ids and headings that predate the slug convention", () => {
    render(
      <EvidenceOrientationClaimAndSourcesStrip
        slug="help-digests"
        claim="Digest orientation."
        claimTestId="help-digests-claim-discipline"
        sourcesTitle="Where to go next"
        sourcesIntro="Follow-ups."
        sources={[{ label: "Digests", href: "/insights/digests" }]}
        sourcesHeadingId="where-to-go-next"
      />,
    );

    expect(screen.getByTestId("help-digests-claim-discipline")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Where to go next" })).toHaveAttribute(
      "id",
      "where-to-go-next",
    );
  });
});

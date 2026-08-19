import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
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

    expect(screen.queryByTestId("help-digests-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Where to go next" })).toHaveAttribute(
      "id",
      "where-to-go-next",
    );
  });

  it("omits claim discipline for policy-listed operational slugs", () => {
    render(
      <EvidenceOrientationClaimAndSourcesStrip
        slug="help-preferences"
        claim="Preferences orientation."
        sourcesIntro="Follow-ups."
        sources={[{ label: "Getting started", href: "/help/getting-started" }]}
      />,
    );

    expect(screen.queryByTestId("help-preferences-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-preferences-sources")).toBeInTheDocument();
  });

  it("applies the operator strip preset rather than the leaf-primitive defaults", () => {
    render(
      <EvidenceOrientationClaimAndSourcesStrip
        slug="preset-default"
        claim="Operator orientation."
        sourcesIntro="Follow-ups."
        sources={[{ label: "Findings", href: "/governance/findings" }]}
      />,
    );

    expect(screen.getByTestId("preset-default-claim-discipline").tagName).toBe("DIV");
    expect(screen.getByTestId("preset-default-sources")).toHaveClass(
      ...EVIDENCE_SOURCES_STYLE.operatorRaised.panel.split(" "),
    );
    // `stacked` gives each follow-up its own line; the `wrap` chip row would set flex-wrap instead.
    expect(screen.getByRole("list")).toHaveClass("space-y-2");
    expect(screen.getByRole("list")).not.toHaveClass("flex-wrap");
  });

  it("still honors the leaf-primitive look when a surface asks for it", () => {
    render(
      <EvidenceOrientationClaimAndSourcesStrip
        slug="leaf-default"
        claim="Marketing orientation."
        sourcesIntro="Follow-ups."
        sources={[{ label: "Findings", href: "/governance/findings" }]}
        claimElement="aside"
        sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorMuted}
        sourcesLayout="wrap"
      />,
    );

    expect(screen.getByTestId("leaf-default-claim-discipline").tagName).toBe("ASIDE");
    expect(screen.getByTestId("leaf-default-sources")).toHaveClass(
      ...EVIDENCE_SOURCES_STYLE.operatorMuted.panel.split(" "),
    );
    expect(screen.getByRole("list")).toHaveClass("flex-wrap");
  });
});

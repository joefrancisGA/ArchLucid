import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import { WhereToGoNextPreferenceProvider } from "@/components/WhereToGoNextPreferenceProvider";
import { HELP_FOLLOW_UPS_DEFAULT_TITLE } from "@/lib/help/help-markdown-headings";
import {
  WHERE_TO_GO_NEXT_STORAGE_KEY,
  resetWhereToGoNextSessionStateForTests,
} from "@/lib/where-to-go-next-preference";

describe("EvidenceOrientationClaimAndSourcesStrip", () => {
  it("derives every band test id from the slug and defaults to the where-to-go-next title", () => {
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
      screen.getByRole("heading", { name: HELP_FOLLOW_UPS_DEFAULT_TITLE }),
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
    expect(screen.getByTestId("preset-default-sources")).toHaveAttribute("data-layout", "columns");
    expect(screen.getByRole("list")).toHaveClass("sm:grid-cols-2");
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

  it("omits sources-only strips when Where to go next is turned off", () => {
    resetWhereToGoNextSessionStateForTests();
    window.localStorage.setItem(WHERE_TO_GO_NEXT_STORAGE_KEY, "false");

    render(
      <WhereToGoNextPreferenceProvider>
        <EvidenceOrientationClaimAndSourcesStrip
          slug="cloud-connections"
          sourcesIntro="Follow-ups."
          sources={[{ label: "Preferences", href: "/account/preferences" }]}
        />
      </WhereToGoNextPreferenceProvider>,
    );

    expect(screen.queryByTestId("cloud-connections-orientation")).not.toBeInTheDocument();
    resetWhereToGoNextSessionStateForTests();
  });
});

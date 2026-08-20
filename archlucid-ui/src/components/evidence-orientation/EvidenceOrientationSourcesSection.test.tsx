import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import { WhereToGoNextPreferenceProvider } from "@/components/WhereToGoNextPreferenceProvider";
import type { EvidenceOrientationLink } from "@/lib/evidence-surface-copy";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import {
  WHERE_TO_GO_NEXT_STORAGE_KEY,
  resetWhereToGoNextSessionStateForTests,
} from "@/lib/where-to-go-next-preference";

const LINKS: readonly EvidenceOrientationLink[] = [
  { label: "Audit", href: "/governance/audit" },
  { label: "Findings", href: "/governance/findings" },
];

describe("EvidenceOrientationSourcesSection", () => {
  it("names the region with its heading and renders every link", () => {
    render(
      <EvidenceOrientationSourcesSection
        testId="audit-trail-help-sources"
        headingId="audit-trail-help-sources-heading"
        title="Where to go next"
        intro="Use these follow-ups."
        links={LINKS}
      />,
    );

    const section = screen.getByTestId("audit-trail-help-sources");
    expect(section).toHaveAttribute("aria-labelledby", "audit-trail-help-sources-heading");
    expect(screen.getByRole("heading", { name: "Where to go next" })).toHaveAttribute(
      "id",
      "audit-trail-help-sources-heading",
    );
    expect(section.textContent).toContain("Use these follow-ups.");

    for (const link of LINKS) {
      expect(
        screen.getByRole("link", { name: formatHelpFollowUpLinkAccessibleName(link.href, link.label) }),
      ).toHaveAttribute("href", link.href);
    }
  });

  it("prefixes help and product destinations by default", () => {
    render(
      <EvidenceOrientationSourcesSection
        testId="preferences-settings-sources"
        headingId="preferences-settings-sources-heading"
        title="Where to go next"
        intro="Follow-ups."
        links={[
          { label: "Getting started", href: "/help/getting-started" },
          { label: "Sign-in methods", href: "/account/security" },
        ]}
        distinguishFollowUpDestinations
      />,
    );

    expect(screen.getByRole("link", { name: "Read Getting started" })).toHaveAttribute(
      "href",
      "/help/getting-started",
    );
    expect(screen.getByRole("link", { name: "Open Sign-in methods" })).toHaveAttribute("href", "/account/security");
  });

  it("can render raw labels when destination labeling is turned off", () => {
    render(
      <EvidenceOrientationSourcesSection
        testId="marketing-sources"
        headingId="marketing-sources-heading"
        title="Sources for follow-up"
        intro="Follow-ups."
        links={LINKS}
        distinguishFollowUpDestinations={false}
      />,
    );

    for (const link of LINKS) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }
  });

  it("tags admin-only destinations so operators know access is restricted", () => {
    render(
      <EvidenceOrientationSourcesSection
        testId="report-a-problem-help-sources"
        headingId="report-a-problem-help-sources-heading"
        title="Where to go next"
        intro="Follow-ups."
        links={[{ label: "Support inbox", href: "/administration/support", adminOnly: true }]}
      />,
    );

    expect(screen.getByTestId("report-a-problem-help-sources").textContent).toContain("(Admin)");
  });

  it("captions each link with its `when` guidance in the stacked layout", () => {
    render(
      <EvidenceOrientationSourcesSection
        testId="caiq-sig-response-help-sources"
        headingId="caiq-sig-response-help-sources-heading"
        title="Where to go next"
        intro="Follow-ups."
        links={[{ label: "Trust center", href: "/assurance-status", when: "During vendor review" }]}
        layout="stacked"
      />,
    );

    expect(screen.getByText("During vendor review")).toBeInTheDocument();
  });

  it("renders the raised panel wash when the band sits on a muted page section", () => {
    render(
      <EvidenceOrientationSourcesSection
        testId="help-digests-sources"
        headingId="where-to-go-next"
        title="Where to go next"
        intro="Follow-ups."
        links={LINKS}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
      />,
    );

    const section = screen.getByTestId("help-digests-sources");
    expect(section).toHaveClass("bg-al-surface-raised");
    expect(section).not.toHaveClass("bg-neutral-50/80");
    expect(section.querySelector("p")).toHaveClass("max-w-none");
    expect(section.querySelector("p")?.className).not.toContain("max-w-3xl");
  });

  it("uses a two-column index so follow-ups sit beside the intro", () => {
    render(
      <EvidenceOrientationSourcesSection
        testId="cloud-connections-sources"
        headingId="where-to-go-next"
        title="Where to go next"
        intro="Follow-ups."
        links={LINKS}
        layout="columns"
      />,
    );

    const section = screen.getByTestId("cloud-connections-sources");
    expect(section).toHaveAttribute("data-layout", "columns");
    expect(section).toHaveClass("md:grid", "md:grid-cols-[minmax(0,1fr)_auto]");
    expect(section.querySelector("ul")).toHaveClass("flex-col");
    expect(section.querySelector("ul")).not.toHaveClass("sm:grid-cols-2");
  });

  it("uses a dense link grid when many follow-ups need a two-column index", () => {
    render(
      <EvidenceOrientationSourcesSection
        testId="cloud-connections-sources"
        headingId="where-to-go-next"
        title="Where to go next"
        intro="Follow-ups."
        links={[
          ...LINKS,
          { label: "Reviews", href: "/architecture/reviews" },
          { label: "Help", href: "/help" },
        ]}
        layout="columns"
      />,
    );

    const section = screen.getByTestId("cloud-connections-sources");
    expect(section.querySelector("ul")).toHaveClass("sm:grid-cols-2");
    expect(section.querySelector("ul")).not.toHaveClass("flex-col");
  });

  it("renders nothing when Where to go next is turned off in personal preferences", () => {
    resetWhereToGoNextSessionStateForTests();
    window.localStorage.setItem(WHERE_TO_GO_NEXT_STORAGE_KEY, "false");

    render(
      <WhereToGoNextPreferenceProvider>
        <EvidenceOrientationSourcesSection
          testId="audit-trail-help-sources"
          headingId="audit-trail-help-sources-heading"
          title="Where to go next"
          intro="Use these follow-ups."
          links={LINKS}
        />
      </WhereToGoNextPreferenceProvider>,
    );

    expect(screen.queryByTestId("audit-trail-help-sources")).not.toBeInTheDocument();
    resetWhereToGoNextSessionStateForTests();
  });
});

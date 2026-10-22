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

  it("omits administration and internal destinations from Where to go next strips", () => {
    render(
      <EvidenceOrientationSourcesSection
        testId="preferences-settings-sources"
        headingId="preferences-settings-sources-heading"
        title="Where to go next"
        intro="Follow-ups."
        links={[
          { label: "Getting started", href: "/help/getting-started" },
          { label: "Users and roles", href: "/administration/users", adminOnly: true },
          { label: "Sign-in methods", href: "/account/security" },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: "Read Getting started" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Sign-in methods" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Users and roles/i })).not.toBeInTheDocument();
  });

  it("still tags admin-only destinations on non-Where to go next follow-up strips", () => {
    render(
      <EvidenceOrientationSourcesSection
        testId="report-a-problem-help-sources"
        headingId="report-a-problem-help-sources-heading"
        title="Related resources"
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

  it("uses a two-column link index when four or more follow-ups sit beside the intro", () => {
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
    const body = section.querySelector("div.md\\:grid");
    expect(section).toHaveAttribute("data-layout", "columns");
    expect(body).toHaveClass("md:grid", "md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]", "md:items-start");
    expect(section.querySelector("ul")).toHaveClass("grid-cols-[minmax(0,1fr)_minmax(0,1fr)]");
    expect(section.querySelector("ul")).not.toHaveClass("flex-col");
    expect(section.querySelector("li")).toHaveClass("min-w-0");
    expect(section.querySelector("a")).toHaveClass("break-words", "min-w-0");
    expect(screen.getByRole("heading", { name: "Where to go next" }).parentElement).toBe(section);
  });

  it("uses a compact single-column link list when one follow-up sits beside the intro", () => {
    render(
      <EvidenceOrientationSourcesSection
        testId="cloud-connections-sources"
        headingId="where-to-go-next"
        title="Where to go next"
        intro="Follow-ups."
        links={[LINKS[0]!]}
        layout="columns"
      />,
    );

    const section = screen.getByTestId("cloud-connections-sources");
    expect(section.querySelector("ul")).toHaveClass("flex-col");
    expect(section.querySelector("ul")).not.toHaveClass("grid-cols-[minmax(0,1fr)_minmax(0,1fr)]");
    expect(section.querySelector("div.md\\:grid")).toHaveClass("md:items-center");
  });

  it("uses a two-column link index when two or three follow-ups sit beside the intro", () => {
    render(
      <EvidenceOrientationSourcesSection
        testId="model-governance-settings-sources"
        headingId="where-to-go-next"
        title="Where to go next"
        intro="Follow-ups."
        links={[
          { label: "Billing help", href: "/help/billing" },
          { label: "How ArchLucid works", href: "/help/getting-started" },
          { label: "Assurance status", href: "/assurance-status" },
        ]}
        layout="columns"
      />,
    );

    const section = screen.getByTestId("model-governance-settings-sources");
    const body = section.querySelector("div.md\\:grid");
    expect(section.querySelector("ul")).toHaveClass("grid-cols-[minmax(0,1fr)_minmax(0,1fr)]");
    expect(section.querySelector("ul")).not.toHaveClass("flex-col");
    expect(body).toHaveClass("md:items-start");
    expect(body).not.toHaveClass("md:items-center");
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
    const body = section.querySelector("div.md\\:grid");
    expect(section.querySelector("ul")).toHaveClass("grid-cols-[minmax(0,1fr)_minmax(0,1fr)]");
    expect(section.querySelector("ul")).not.toHaveClass("flex-col");
    expect(body).toHaveClass("md:items-start");
    expect(body).not.toHaveClass("md:items-center");
  });

  it("keeps the heading outside the intro/link row so a single link row aligns with the intro", () => {
    render(
      <EvidenceOrientationSourcesSection
        testId="reviews-new-sources"
        headingId="reviews-new-sources-heading"
        title="Related resources"
        intro="Use these when you need guides after choosing a start path above. Primary actions on this page come first."
        links={[
          { label: "First review guide", href: "/architecture/first-review-guide" },
          { label: "How ArchLucid works", href: "/help/getting-started#how-archlucid-works" },
        ]}
        layout="columns"
      />,
    );

    const section = screen.getByTestId("reviews-new-sources");
    const heading = screen.getByRole("heading", { name: "Related resources" });
    const body = section.querySelector("div.md\\:grid");

    expect(heading.parentElement).toBe(section);
    expect(body).toContainElement(screen.getByText(/Use these when you need guides/i));
    expect(body).toContainElement(screen.getByRole("list"));
    expect(body).toHaveClass("md:items-center");
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

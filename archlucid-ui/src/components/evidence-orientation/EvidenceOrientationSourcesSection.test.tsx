import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import type { EvidenceOrientationLink } from "@/lib/evidence-surface-copy";

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
        title="Diligence artifact index"
        intro="Use these follow-ups."
        links={LINKS}
      />,
    );

    const section = screen.getByTestId("audit-trail-help-sources");
    expect(section).toHaveAttribute("aria-labelledby", "audit-trail-help-sources-heading");
    expect(screen.getByRole("heading", { name: "Diligence artifact index" })).toHaveAttribute(
      "id",
      "audit-trail-help-sources-heading",
    );
    expect(section.textContent).toContain("Use these follow-ups.");

    for (const link of LINKS) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }
  });

  it("tags admin-only destinations so operators know access is restricted", () => {
    render(
      <EvidenceOrientationSourcesSection
        testId="report-a-problem-help-sources"
        headingId="report-a-problem-help-sources-heading"
        title="Diligence artifact index"
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
        title="Diligence artifact index"
        intro="Follow-ups."
        links={[{ label: "Trust center", href: "/security-trust", when: "During vendor review" }]}
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
  });
});

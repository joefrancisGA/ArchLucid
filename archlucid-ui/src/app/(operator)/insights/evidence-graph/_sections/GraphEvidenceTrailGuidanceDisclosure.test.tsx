import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GraphEvidenceTrailGuidanceDisclosure } from "@/app/(operator)/insights/evidence-graph/_sections/GraphEvidenceTrailGuidanceDisclosure";

describe("GraphEvidenceTrailGuidanceDisclosure", () => {
  it("uses buyer-safe evidence graph framing without manifest vocabulary", () => {
    render(<GraphEvidenceTrailGuidanceDisclosure />);

    const disclosure = screen.getByTestId("evidence-trail-guidance-disclosure");

    expect(disclosure.textContent ?? "").toContain("What is the evidence graph?");
    expect(disclosure.textContent ?? "").toContain("trace review evidence");
    expect(disclosure.textContent ?? "").not.toMatch(/\bmanifest\b/i);
    expect(disclosure.textContent ?? "").not.toContain("Advanced operations");
  });

  it("links to the evidence-trail help topic from page-help-topic-map", () => {
    render(<GraphEvidenceTrailGuidanceDisclosure />);

    expect(screen.getByRole("link", { name: "Evidence graph guide" })).toHaveAttribute(
      "href",
      "/help/evidence-trail",
    );
  });
});

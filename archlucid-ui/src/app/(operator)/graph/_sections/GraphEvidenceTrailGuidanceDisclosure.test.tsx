import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GraphEvidenceTrailGuidanceDisclosure } from "@/app/(operator)/graph/_sections/GraphEvidenceTrailGuidanceDisclosure";

describe("GraphEvidenceTrailGuidanceDisclosure", () => {
  it("uses buyer-safe evidence graph framing without manifest vocabulary", () => {
    render(<GraphEvidenceTrailGuidanceDisclosure />);

    const disclosure = screen.getByTestId("evidence-trail-guidance-disclosure");

    expect(disclosure.textContent ?? "").toContain("How this graph helps");
    expect(disclosure.textContent ?? "").toContain("Review package · Evidence · Trace");
    expect(disclosure.textContent ?? "").toContain("finalized review package");
    expect(disclosure.textContent ?? "").not.toMatch(/\bmanifest\b/i);
    expect(disclosure.textContent ?? "").not.toContain("Advanced operations");
  });
});

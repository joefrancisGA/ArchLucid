import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SEE_IT_PAGE_TITLE } from "@/lib/see-it-page-copy";
import { CANONICAL_ANONYMOUS_PROOF_HREF } from "@/lib/showcase-static-demo";

import { SEE_IT_HERO_LEAD, SeeItHeroSection } from "./SeeItHeroSection";

describe("SeeItHeroSection (TB-1281 / TB-1282)", () => {
  it("keeps first-viewport hero to one headline, lead, and primary CTA", () => {
    render(<SeeItHeroSection />);

    expect(screen.getByTestId("see-it-hero")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: SEE_IT_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("see-it-outcome-led-lead")).toHaveTextContent(SEE_IT_HERO_LEAD);
    expect(screen.getByTestId("see-it-cta-showcase")).toHaveAttribute("href", CANONICAL_ANONYMOUS_PROOF_HREF);
    expect(screen.getByTestId("see-it-deliverable-preview")).toHaveAttribute(
      "href",
      CANONICAL_ANONYMOUS_PROOF_HREF,
    );
  });

  it("does not surface retired /live-demo or /demo/preview ladder links", () => {
    render(<SeeItHeroSection />);

    expect(screen.queryByTestId("see-it-guided-walkthrough-link")).toBeNull();
    expect(document.body.innerHTML).not.toContain("/live-demo");
    expect(document.body.innerHTML).not.toContain("/demo/preview");

    const visible = document.body.textContent ?? "";

    expect(visible.toLowerCase()).not.toContain("manifest");
  });

  it("exposes only one primary showcase CTA in the hero", () => {
    render(<SeeItHeroSection />);

    expect(screen.getAllByTestId("see-it-cta-showcase")).toHaveLength(1);
    expect(screen.queryByTestId("see-it-full-preview-link")).toBeNull();
  });
});

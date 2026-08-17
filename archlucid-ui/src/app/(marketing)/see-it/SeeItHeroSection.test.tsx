import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CANONICAL_GET_STARTED_PATH } from "@/lib/legacy-quick-start-route";
import { SEE_IT_HERO_LEAD, SEE_IT_PAGE_TITLE } from "@/lib/see-it-page-copy";
import { CANONICAL_ANONYMOUS_PROOF_HREF } from "@/lib/showcase-static-demo";

import {
  SEE_IT_LAST_REVIEWED_LABEL,
  SEE_IT_SECONDARY_GET_STARTED_LABEL,
} from "./see-it-page-content";
import { SeeItHeroSection } from "./SeeItHeroSection";
import { SeeItMarketingPageChrome } from "./SeeItMarketingPageChrome";

describe("SeeItHeroSection (TB-1281 / TB-1282)", () => {
  it("keeps first-viewport hero to one headline, lead, primary showcase CTA, and get-started ladder", () => {
    render(<SeeItHeroSection />);

    expect(screen.getByTestId("see-it-hero")).toBeInTheDocument();
    expect(screen.getByTestId("see-it-breadcrumb")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: SEE_IT_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("see-it-outcome-led-lead")).toHaveTextContent(SEE_IT_HERO_LEAD);
    expect(screen.getByTestId("see-it-hero-meta")).toHaveTextContent(SEE_IT_LAST_REVIEWED_LABEL);
    expect(screen.getByTestId("see-it-cta-showcase")).toHaveAttribute("href", CANONICAL_ANONYMOUS_PROOF_HREF);
    expect(screen.getByTestId("see-it-cta-get-started")).toHaveAttribute("href", CANONICAL_GET_STARTED_PATH);
    expect(screen.getByTestId("see-it-cta-get-started")).toHaveTextContent(SEE_IT_SECONDARY_GET_STARTED_LABEL);
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

describe("SeeItMarketingPageChrome", () => {
  it("renders skip link, scope disclosure, revision history, and top Sources orientation", () => {
    render(
      <SeeItMarketingPageChrome>
        <p data-testid="see-it-chrome-child">Sample body</p>
      </SeeItMarketingPageChrome>,
    );

    expect(screen.getByRole("link", { name: /Skip to sample review content/i })).toHaveAttribute(
      "href",
      "#see-it-primary-content",
    );
    expect(screen.getByTestId("see-it-orientation-top")).toBeInTheDocument();
    expect(screen.getByTestId("see-it-scope-disclosure")).toBeInTheDocument();
    expect(screen.getByTestId("trust-center-revision-history")).toBeInTheDocument();
    expect(screen.getByTestId("see-it-sources")).toBeInTheDocument();
    expect(screen.getAllByTestId("see-it-sources")).toHaveLength(1);
    expect(screen.queryByTestId("see-it-claim-discipline")).toBeNull();
    expect(screen.getByTestId("see-it-chrome-child")).toBeInTheDocument();
  });
});

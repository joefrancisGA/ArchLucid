import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BRAND_CATEGORY, BRAND_CATEGORY_LEGACY, BRAND_PROOF_SCOPE_STATEMENT } from "@/lib/brand-category";
import {
  WHY_CLOSING_PRIMARY_CTA_HREF,
  WHY_CLOSING_PRIMARY_CTA_LABEL,
  WHY_CLOSING_SECONDARY_CTA_HREF,
  WHY_CLOSING_SECONDARY_CTA_LABEL,
  WHY_HERO_PITCH,
  WHY_HERO_PRIMARY_CTA_HREF,
  WHY_MARKETING_PDF_DOWNLOAD_LABEL,
} from "@/lib/why-page-copy";
import { WHY_MARKET_LANDSCAPE_MARKETING_ROWS } from "@/lib/why-market-landscape-comparison";
import { WHY_COMPARISON_ROWS } from "@/lib/why-comparison";

import { WhyArchlucidMarketingView } from "./WhyArchlucidMarketingView";

describe("WhyArchlucidMarketingView", () => {
  it("renders qualitative landscape mini-table aligned with WHY_MARKET_LANDSCAPE_MARKETING_ROWS", () => {
    const { getByTestId, getAllByRole } = render(
      <WhyArchlucidMarketingView frontDoorRows={WHY_COMPARISON_ROWS} showDemoEmbed={false} />,
    );

    const table = getByTestId("why-market-landscape-mini-table");
    const bodyRows = getAllByRole("row").filter((r) => r.closest("tbody") === table.querySelector("tbody"));

    expect(bodyRows).toHaveLength(WHY_MARKET_LANDSCAPE_MARKETING_ROWS.length);
  });

  it("matches snapshot (marketing /why layout + proof pack download)", () => {
    const { container } = render(
      <WhyArchlucidMarketingView frontDoorRows={WHY_COMPARISON_ROWS} showDemoEmbed={false} />,
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders vs chat assistant contrast section (TB-265)", () => {
    const { getByTestId } = render(
      <WhyArchlucidMarketingView frontDoorRows={WHY_COMPARISON_ROWS} showDemoEmbed={false} />,
    );

    expect(getByTestId("why-vs-chat-assistant")).toBeInTheDocument();
  });

  it("renders proof pack download targeting the proxied PDF endpoint", () => {
    const { getByTestId } = render(
      <WhyArchlucidMarketingView frontDoorRows={WHY_COMPARISON_ROWS} showDemoEmbed={false} />,
    );

    const link = getByTestId("why-proof-pack-download");
    expect(link.getAttribute("href")).toBe("/api/proxy/v1/marketing/why-archlucid-pack.pdf");
    expect(link.textContent).toBe(WHY_MARKETING_PDF_DOWNLOAD_LABEL);
    expect(link.textContent?.toLowerCase()).not.toContain("audit evidence bundle");
  });

  it("TB-1305: renders closing conversion CTAs after the comparison table", () => {
    render(<WhyArchlucidMarketingView frontDoorRows={WHY_COMPARISON_ROWS} showDemoEmbed={false} />);

    expect(screen.getByTestId("why-closing-cta")).toBeInTheDocument();
    expect(screen.getByTestId("why-closing-primary-cta")).toHaveAttribute("href", WHY_CLOSING_PRIMARY_CTA_HREF);
    expect(screen.getByTestId("why-closing-primary-cta")).toHaveTextContent(WHY_CLOSING_PRIMARY_CTA_LABEL);
    expect(screen.getByTestId("why-closing-secondary-cta")).toHaveAttribute("href", WHY_CLOSING_SECONDARY_CTA_HREF);
    expect(screen.getByTestId("why-closing-secondary-cta")).toHaveTextContent(WHY_CLOSING_SECONDARY_CTA_LABEL);

    const pageText = document.body.textContent ?? "";
    expect(pageText.toLowerCase()).not.toMatch(/download the audit evidence bundle/);
  });

  it("renders the brand-category paragraph using BRAND_CATEGORY (not the legacy string)", () => {
    const { getByTestId } = render(
      <WhyArchlucidMarketingView frontDoorRows={WHY_COMPARISON_ROWS} showDemoEmbed={false} />,
    );

    const paragraph = getByTestId("why-brand-category-paragraph");
    const text = paragraph.textContent ?? "";

    expect(text).toContain(BRAND_CATEGORY);
    expect(text).not.toContain(BRAND_CATEGORY_LEGACY);
  });

  it("renders the proof-scope statement beneath the brand-category paragraph", () => {
    const { getByTestId } = render(
      <WhyArchlucidMarketingView frontDoorRows={WHY_COMPARISON_ROWS} showDemoEmbed={false} />,
    );

    expect(getByTestId("why-proof-scope-statement").textContent).toBe(BRAND_PROOF_SCOPE_STATEMENT);
  });

  it("TB-1301: hero budget — pitch and primary conversion CTA stay in the hero band", () => {
    render(<WhyArchlucidMarketingView frontDoorRows={WHY_COMPARISON_ROWS} showDemoEmbed={false} />);

    const heroBand = screen.getByTestId("why-hero-band");
    const ctaRow = screen.getByTestId("why-hero-cta-row");

    expect(within(heroBand).getByTestId("why-hero-pitch")).toHaveTextContent(WHY_HERO_PITCH);
    expect(within(heroBand).queryByTestId("why-brand-category-paragraph")).not.toBeInTheDocument();
    expect(within(ctaRow).getByTestId("why-hero-primary-cta")).toHaveAttribute("href", WHY_HERO_PRIMARY_CTA_HREF);
    expect(within(ctaRow).getByTestId("why-hero-primary-cta")).toHaveTextContent(WHY_CLOSING_PRIMARY_CTA_LABEL);
    expect(within(ctaRow).getByTestId("why-hero-secondary-cta")).toHaveAttribute("href", WHY_CLOSING_SECONDARY_CTA_HREF);
    expect(within(ctaRow).getByTestId("why-hero-secondary-cta")).toHaveTextContent(WHY_CLOSING_SECONDARY_CTA_LABEL);

    const hardCompare = screen.getByTestId("why-hard-comparison-table");
    expect(heroBand.compareDocumentPosition(hardCompare) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

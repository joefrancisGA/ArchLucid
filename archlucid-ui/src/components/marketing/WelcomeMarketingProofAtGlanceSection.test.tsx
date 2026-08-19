import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WelcomeMarketingProofAtGlanceSection } from "@/components/marketing/WelcomeMarketingProofAtGlanceSection";
import {
  WELCOME_SEE_IT_CTA_LABEL,
  WELCOME_SEE_IT_HREF,
} from "@/components/marketing/welcome-marketing-copy";

describe("WelcomeMarketingProofAtGlanceSection (TB-1298)", () => {
  it("uses honest see-it label in proof-at-a-glance and first-time visitor path", () => {
    render(<WelcomeMarketingProofAtGlanceSection />);

    const seeItLinks = screen.getAllByRole("link", { name: WELCOME_SEE_IT_CTA_LABEL });

    expect(seeItLinks.length).toBeGreaterThanOrEqual(2);

    for (const link of seeItLinks) {
      expect(link).toHaveAttribute("href", WELCOME_SEE_IT_HREF);
    }

    const sectionText = document.body.textContent ?? "";

    expect(sectionText.toLowerCase()).not.toMatch(/see it in 30 seconds/);
    expect(sectionText.toLowerCase()).not.toMatch(/see it \(30s\)/);
  });
});

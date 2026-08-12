import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PrivacyPolicyTableOfContents } from "@/components/marketing/privacy-policy/PrivacyPolicyTableOfContents";
import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";

const SAMPLE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { id: "1-who-we-are", title: "1. Who we are", level: 2 },
  { id: "2-what-personal-information-we-collect", title: "2. What personal information we collect", level: 2 },
  { id: "3-how-we-use-personal-information", title: "3. How we use personal information", level: 2 },
  { id: "4-how-we-share-personal-information", title: "4. How we share personal information", level: 2 },
  { id: "5-data-retention", title: "5. Data retention", level: 2 },
];

describe("PrivacyPolicyTableOfContents", () => {
  it("renders on-this-page navigation with anchor links", () => {
    render(<PrivacyPolicyTableOfContents headings={SAMPLE_HEADINGS} variant="desktop" />);

    const desktopToc = screen.getByTestId("privacy-policy-toc");
    expect(within(desktopToc).getByTestId("privacy-policy-toc-heading")).toHaveTextContent("On this page");

    for (const item of SAMPLE_HEADINGS) {
      expect(within(desktopToc).getByRole("link", { name: item.title })).toHaveAttribute("href", `#${item.id}`);
    }
  });

  it("marks the hash-matched section as current location", () => {
    window.location.hash = "#5-data-retention";

    render(<PrivacyPolicyTableOfContents headings={SAMPLE_HEADINGS} variant="desktop" />);

    const desktopToc = screen.getByTestId("privacy-policy-toc");
    expect(within(desktopToc).getByRole("link", { name: "5. Data retention" })).toHaveAttribute("aria-current", "location");
  });

  it("updates active section when the location hash changes", () => {
    window.location.hash = "";

    render(<PrivacyPolicyTableOfContents headings={SAMPLE_HEADINGS} variant="desktop" />);

    const desktopToc = screen.getByTestId("privacy-policy-toc");
    const retentionLink = within(desktopToc).getByRole("link", { name: "5. Data retention" });

    window.location.hash = "#5-data-retention";
    fireEvent(window, new HashChangeEvent("hashchange"));

    expect(retentionLink).toHaveAttribute("aria-current", "location");
  });
});

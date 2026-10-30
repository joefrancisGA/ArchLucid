import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WhySecureNowDraftView } from "@/app/(marketing)/why-securenow/WhySecureNowDraftView";
import { metadata } from "@/app/(marketing)/why-securenow/page";
import {
  WHY_SECURENOW_CONVERSATION_LABEL,
  WHY_SECURENOW_DRAFT_BANNER,
  WHY_SECURENOW_DRAFT_PITCH,
  WHY_SECURENOW_REVIEWER_PACK_BODY,
} from "@/lib/marketing/why-securenow-draft-copy";

const marketingResourcesMenuPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../components/marketing/MarketingResourcesMenu.tsx",
);

describe("Why SecureNow draft (SN-MKT-02)", () => {
  it("renders the internal draft banner, pitch, and conversation link", () => {
    render(<WhySecureNowDraftView />);

    expect(screen.getByTestId("why-securenow-draft-banner")).toHaveTextContent(WHY_SECURENOW_DRAFT_BANNER);
    expect(screen.getByTestId("why-securenow-draft-pitch")).toHaveTextContent(WHY_SECURENOW_DRAFT_PITCH);
    expect(screen.getByRole("link", { name: WHY_SECURENOW_CONVERSATION_LABEL })).toHaveAttribute(
      "href",
      "mailto:support@archlucid.net?subject=SecureNow%20conversation",
    );
  });

  it("avoids forbidden commercial and certification wording in rendered copy", () => {
    const { container } = render(<WhySecureNowDraftView />);
    const text = container.textContent ?? "";

    expect(text).not.toMatch(/\$/);
    expect(text).not.toMatch(/\bguaranteed\b/i);
    expect(text).not.toMatch(/\bautonomous\b/i);
    expect(text).not.toMatch(/SOC 2/i);
    expect(text).not.toMatch(/\bcertified\b/i);
  });

  it("exports noindex metadata", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("is not linked from MarketingResourcesMenu", () => {
    const source = readFileSync(marketingResourcesMenuPath, "utf8");

    expect(source).not.toContain('href="/why-securenow"');
  });

  it("renders the reviewer-pack anchor before the conversation link", () => {
    render(<WhySecureNowDraftView />);

    const reviewerSection = document.getElementById("reviewer-pack");
    expect(reviewerSection).not.toBeNull();
    expect(reviewerSection).toHaveTextContent(WHY_SECURENOW_REVIEWER_PACK_BODY);
  });
});

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpSecurityTrustGuideView } from "@/app/(operator)/help/_sections/HelpSecurityTrustGuideView";
import { extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import { buildSecurityTrustTocGroups } from "@/lib/security-trust-help-presentation";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { SECURITY_TRUST_HELP_CLAIM_DISCIPLINE } from "@/lib/security-trust-help-evidence-copy";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";
import { TRUST_CENTER_EVIDENCE_PACK_ZIP_HREF } from "@/lib/trust-center-public-assurance";

const SECURITY_TRUST_SOURCE = "docs/go-to-market/trust-center.md";

const EXPECTED_TOC_LABELS = [
  "Procurement questionnaire accelerator",
  "Healthcare and PHI",
  "Cloud inventory connectivity (Tier 1 default)",
  "Download the evidence pack",
  "Posture summary",
  "Self-asserted controls",
  "Planned controls",
  "Third-party engagements",
  "Customer-facing artifacts",
  "How to request the procurement pack",
] as const;

describe("HelpSecurityTrustGuideView security and trust", () => {
  const loaded = tryLoadProductDocumentation("security-trust");

  it("loads security-trust markdown from the monorepo", () => {
    expect(loaded).not.toBeNull();
  });

  it("uses buyer-safe TOC labels", () => {
    if (loaded === null) {
      throw new Error("Expected security-trust documentation to load.");
    }

    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, SECURITY_TRUST_SOURCE, {
      helpTopicSlug: "security-trust",
    });
    const headings = extractHelpMarkdownHeadings(preparedMarkdown);
    const tocTitles = headings.map((heading) => heading.title);

    for (const label of EXPECTED_TOC_LABELS) {
      expect(tocTitles).toContain(label);
    }

    expect(tocTitles.some((title) => title.includes("Automated freshness posture"))).toBe(false);
  });

  it("does not expose internal CI or enablement copy in rendered output", () => {
    if (loaded === null) {
      throw new Error("Expected security-trust documentation to load.");
    }

    render(<HelpSecurityTrustGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.queryByText(/check_procurement_pack_index/i)).toBeNull();
    expect(screen.queryByText(/Automated freshness posture/i)).toBeNull();
    expect(screen.queryByText(/V1_DEFERRED/i)).toBeNull();
    expect((document.body.textContent ?? "").toLowerCase()).not.toContain("github.com/joefrancisga");
    expect(screen.queryByText(/Last reviewed \(UTC\)/i)).toBeNull();
    expect(screen.queryByTestId("procurement-help-last-reviewed")).toBeNull();
    expect(screen.queryByTestId("help-topic-registry-provenance")).toBeNull();
    expect(screen.queryByText(/Cache-Control:/i)).toBeNull();
    expect(screen.queryByText(/If-None-Match/i)).toBeNull();
    expect((document.body.textContent ?? "")).not.toMatch(/\bV1\b/);
  });

  it("renders orientation strip, evidence-pack primary action, and coherent pen-test disclosure", () => {
    if (loaded === null) {
      throw new Error("Expected security-trust documentation to load.");
    }

    render(<HelpSecurityTrustGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByTestId("security-trust-help-orientation")).toBeInTheDocument();
    expect(screen.getByTestId("help-security-trust-claim-discipline-strip")).toHaveTextContent(
      SECURITY_TRUST_HELP_CLAIM_DISCIPLINE,
    );
    expect(screen.queryByTestId("security-trust-help-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-security-trust-primary-action")).toHaveAttribute(
      "href",
      TRUST_CENTER_EVIDENCE_PACK_ZIP_HREF,
    );
    expect(screen.getByRole("button", { name: /print \/ save as pdf/i })).toBeInTheDocument();

    const body = document.body.textContent ?? "";
    expect(body).toMatch(/awarded third-party penetration-test vendor/i);
    expect(body).toMatch(/owner-conducted/i);
    expect(body).not.toMatch(/\*\*ArchLucid:\*\* There is/i);
  });

  it("renders trust center summary, posture StatusTags, and resolvable evidence links", () => {
    if (loaded === null) {
      throw new Error("Expected security-trust documentation to load.");
    }

    render(<HelpSecurityTrustGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("heading", { name: "Posture summary" })).toBeInTheDocument();
    expect(screen.getAllByText("Self-asserted").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /how to request the procurement pack/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /scalability and load evidence/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /soc 2 self-assessment/i }).length).toBeGreaterThan(0);
    expect(screen.getByTestId("security-trust-help-posture-summary")).toBeInTheDocument();
    expect(screen.getByTestId("security-trust-help-next-steps")).toBeInTheDocument();
    expect(screen.queryByText(/Automated freshness posture/i)).toBeNull();
  });

  it("renders focusable scroll regions with section-based table captions", () => {
    if (loaded === null) {
      throw new Error("Expected security-trust documentation to load.");
    }

    render(<HelpSecurityTrustGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    const scrollRegions = screen.getAllByRole("region").filter((region) => region.getAttribute("tabindex") === "0");
    expect(scrollRegions.length).toBeGreaterThan(0);
    expect(scrollRegions[0]?.getAttribute("aria-label") ?? "").toMatch(/scrollable/i);
  });

  it("renders every right-side TOC item as an anchor link", () => {
    if (loaded === null) {
      throw new Error("Expected security-trust documentation to load.");
    }

    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, SECURITY_TRUST_SOURCE, {
      helpTopicSlug: "security-trust",
    });
    const headings = extractHelpMarkdownHeadings(preparedMarkdown);
    const tocHeadings = buildSecurityTrustTocGroups(headings).flatMap((group) => group.headings);

    render(<HelpSecurityTrustGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    const toc = screen.getByTestId("help-topic-toc");

    for (const heading of tocHeadings) {
      const link = within(toc).getByRole("link", { name: heading.title });

      expect(link).toHaveAttribute("href", `#${heading.id}`);
    }
  });
});

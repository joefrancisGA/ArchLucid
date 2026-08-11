import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/procurement",
}));

import { HelpTopicMarkdownView } from "@/app/(operator)/help/HelpTopicMarkdownView";
import { ProcurementHelpEvidenceOrientationStrip } from "@/components/help/ProcurementHelpEvidenceOrientationStrip";
import { extractHelpMarkdownHeadings } from "@/lib/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import {
  PROCUREMENT_HELP_CUSTOM_POLICY_PACK_QUOTE_HREF,
  PROCUREMENT_HELP_NDA_REQUEST_HREF,
  PROCUREMENT_HELP_SALES_CONTACT_HREF,
} from "@/lib/procurement-help-evidence-copy";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

const PROCUREMENT_SOURCE = "docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md";

const EXPECTED_TOC_LABELS = [
  "Q & A",
  "1. Do you have SOC 2 Type II?",
  "2. Can we see the latest penetration-test report?",
  "3. Where is customer data processed / stored?",
  "4. Can we authenticate with Okta / Ping / Auth0 instead of Microsoft Entra ID?",
  "5. What SLA do you publish?",
  "6. Can we execute the Data Processing Agreement?",
  "7. What subprocessors apply?",
  "8. What happens if ArchLucid ceases trading?",
  "9. Do you maintain cyber insurance?",
  "10. Can we speak with reference customers?",
  "11. How do we get extended audit retention (e.g. 7 years)?",
  "12. Can we commission custom policy packs beyond bundled defaults?",
] as const;

/** TB-1254 — contributor path/CLI/improvement-ID leakage must not appear in `/help/procurement`. */
const PROCUREMENT_HELP_BANNED_SUBSTRINGS = [
  "infra/",
  "V1_SCOPE",
  "CONFIGURATION_REFERENCE",
  "archlucid auth",
  "Improvement archived",
  "PENDING_QUESTIONS",
  "contributor-reference",
  "ArtifactLargePayload",
  "TenantProvisioning",
  "dbo.Tenants",
  "MSA_TEMPLATE.md",
  "ORDER_FORM_TEMPLATE.md",
  "CUSTOM_POLICY_PACK_AUTHORING_SOW_TEMPLATE.md",
  "PRICING_PHILOSOPHY.md",
  "SLA_SUMMARY.md",
  "SECURITY.md",
] as const;

/** TB-1257 — prepared FAQ links must stay on buyer-safe in-app routes. */
const PROCUREMENT_FAQ_BANNED_HREF_FRAGMENTS = [
  "contributor-reference/",
  "architecture/adrs/",
  "scripts/",
  "../runbooks/",
  "runbooks/",
  "../library/",
  "../security/",
  ".md",
] as const;

const PROCUREMENT_FAQ_ALLOWED_HREF_PREFIXES = [
  "/help/",
  "/trust",
  "/security-trust",
  "/pricing",
  "/administration/",
  "mailto:",
  "#",
] as const;

const PROCUREMENT_FAQ_REQUIRED_LINK_PATTERNS = [
  PROCUREMENT_HELP_NDA_REQUEST_HREF,
  PROCUREMENT_HELP_SALES_CONTACT_HREF,
  PROCUREMENT_HELP_CUSTOM_POLICY_PACK_QUOTE_HREF,
  "/help/soc2-self-assessment",
  "/help/dpa-template",
] as const;

const SSO_QUESTION_HEADING =
  "### 4. Can we authenticate with **Okta / Ping / Auth0** instead of Microsoft Entra ID?";

const SSO_ANSWER_BANNED_SUBSTRINGS = [
  "terraform",
  "infra/",
  "archlucid auth",
  "validate-saml",
  "appsettings",
  "hosted samples",
  "generic_oidc",
] as const;

const SSO_ANSWER_MAX_WORDS = 90;

function extractProcurementFaqSection(preparedMarkdown: string): string {
  const start = preparedMarkdown.indexOf("## Q & A");

  if (start < 0) {
    throw new Error("Expected procurement FAQ section.");
  }

  const end = preparedMarkdown.indexOf("\n## Trust progression timeline", start);

  return end >= 0 ? preparedMarkdown.slice(start, end) : preparedMarkdown.slice(start);
}

function extractSsoAnswerSection(preparedMarkdown: string): string {
  const faqSection = extractProcurementFaqSection(preparedMarkdown);
  const start = faqSection.indexOf(SSO_QUESTION_HEADING);

  if (start < 0) {
    throw new Error("Expected SSO FAQ question.");
  }

  const nextHeading = faqSection.indexOf("\n### 5.", start);

  return nextHeading >= 0 ? faqSection.slice(start, nextHeading) : faqSection.slice(start);
}

function extractMarkdownLinkHrefs(markdown: string): string[] {
  const hrefs: string[] = [];
  const pattern = /\[[^\]]+\]\(([^)]+)\)/g;

  for (const match of markdown.matchAll(pattern)) {
    const href = match[1]?.trim();

    if (href !== undefined && href.length > 0) {
      hrefs.push(href);
    }
  }

  return hrefs;
}

function isBuyerSafeProcurementFaqHref(href: string): boolean {
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return false;
  }

  return PROCUREMENT_FAQ_ALLOWED_HREF_PREFIXES.some((prefix) => href.startsWith(prefix));
}

describe("HelpTopicMarkdownView procurement FAQ", () => {
  const loaded = tryLoadProductDocumentation("procurement");

  it("loads procurement FAQ markdown from the monorepo", () => {
    expect(loaded).not.toBeNull();
  });

  it("uses buyer-safe TOC labels without question-mark artifacts in h3 titles", () => {
    if (loaded === null) {
      throw new Error("Expected procurement documentation to load.");
    }

    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, PROCUREMENT_SOURCE);
    const headings = extractHelpMarkdownHeadings(preparedMarkdown);
    const tocTitles = headings.map((heading) => heading.title);

    for (const label of EXPECTED_TOC_LABELS) {
      expect(tocTitles).toContain(label);
    }

    expect(tocTitles.some((title) => title.includes("Trust progression timeline"))).toBe(false);
  });

  it("does not expose internal enablement headings in rendered copy", () => {
    if (loaded === null) {
      throw new Error("Expected procurement documentation to load.");
    }

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.queryByText(/Trust progression timeline/i)).toBeNull();
    expect(screen.queryByText(/Tenant\.DataRegion/i)).toBeNull();
    expect(screen.queryByText(/V1\.1-program/i)).toBeNull();
  });

  it("keeps Q3 residency buyer-safe without appsettings keys (TB-1255)", () => {
    if (loaded === null) {
      throw new Error("Expected procurement documentation to load.");
    }

    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, PROCUREMENT_SOURCE);
    const residencyHeadingIndex = preparedMarkdown.indexOf(
      "### 3. Where is customer **data processed / stored**?",
    );

    expect(residencyHeadingIndex).toBeGreaterThanOrEqual(0);

    const nextHeadingIndex = preparedMarkdown.indexOf("\n### 4.", residencyHeadingIndex);
    const residencySection =
      nextHeadingIndex >= 0
        ? preparedMarkdown.slice(residencyHeadingIndex, nextHeadingIndex)
        : preparedMarkdown.slice(residencyHeadingIndex);

    expect(residencySection).toMatch(/data-handling/i);
    expect(residencySection).toMatch(/Azure regions|contracted Azure regions/i);
    expect(residencySection.toLowerCase()).not.toContain("artifactlargepayload");
    expect(residencySection.toLowerCase()).not.toContain("tenantprovisioning");
    expect(residencySection.toLowerCase()).not.toContain("dbo.tenants");
    expect(residencySection.toLowerCase()).not.toContain("azureblobserviceuribyregion");
    expect(residencySection.toLowerCase()).not.toContain("supporteddataregions");

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("link", { name: /Data handling and tenant isolation/i })).toHaveAttribute(
      "href",
      "/help/data-handling",
    );
  });

  it("purges contributor path/CLI leakage from prepared and rendered procurement help (TB-1254)", () => {
    if (loaded === null) {
      throw new Error("Expected procurement documentation to load.");
    }

    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, PROCUREMENT_SOURCE).toLowerCase();

    for (const banned of PROCUREMENT_HELP_BANNED_SUBSTRINGS) {
      expect(preparedMarkdown, `prepared markdown contains "${banned}"`).not.toContain(banned.toLowerCase());
    }

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    const visible = (document.body.textContent ?? "").toLowerCase();

    for (const banned of PROCUREMENT_HELP_BANNED_SUBSTRINGS) {
      expect(visible, `rendered copy contains "${banned}"`).not.toContain(banned.toLowerCase());
    }
  });

  it("renders procurement FAQ answers for buyers", () => {
    if (loaded === null) {
      throw new Error("Expected procurement documentation to load.");
    }

    render(
      <HelpTopicMarkdownView
        entry={loaded.entry}
        markdown={loaded.markdown}
        showContextualHelp
        evidenceOrientation={<ProcurementHelpEvidenceOrientationStrip />}
        showExportClaimDiscipline
      />,
    );

    expect(screen.queryByTestId("procurement-help-last-reviewed")).toBeNull();
    expect(screen.getByRole("heading", { name: "Q & A" })).toBeInTheDocument();
    expect(screen.getAllByText(/SOC 2/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/penetration/i).length).toBeGreaterThan(0);
    expect(screen.getByTestId("procurement-help-posture-summary")).toBeInTheDocument();
    expect(screen.getByTestId("procurement-help-answer-soc2")).toBeInTheDocument();
    expect(screen.getByTestId("procurement-help-answer-penetration-test")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-export-actions")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-print-pdf")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-breadcrumb")).toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).toBeNull();
  });

  it("keeps Q4 SSO answer questionnaire-length without infra or CLI leakage (TB-1257)", () => {
    if (loaded === null) {
      throw new Error("Expected procurement documentation to load.");
    }

    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, PROCUREMENT_SOURCE);
    const ssoSection = extractSsoAnswerSection(preparedMarkdown);
    const answerBody = ssoSection.replace(SSO_QUESTION_HEADING, "").trim();
    const wordCount = answerBody.split(/\s+/).filter((token) => token.length > 0).length;

    expect(wordCount).toBeLessThanOrEqual(SSO_ANSWER_MAX_WORDS);

    const lower = ssoSection.toLowerCase();

    for (const banned of SSO_ANSWER_BANNED_SUBSTRINGS) {
      expect(lower, `SSO answer contains "${banned}"`).not.toContain(banned);
    }

    expect(ssoSection).toMatch(/users-and-roles/i);
    expect(ssoSection).toMatch(/enterprise-onboarding/i);
    expect(ssoSection).toMatch(/authentication-sign-in/i);

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("link", { name: /Users and roles/i })).toHaveAttribute(
      "href",
      "/help/users-and-roles",
    );
  });

  it("keeps prepared procurement FAQ links on buyer-safe in-app routes (TB-1257)", () => {
    if (loaded === null) {
      throw new Error("Expected procurement documentation to load.");
    }

    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, PROCUREMENT_SOURCE);
    const faqSection = extractProcurementFaqSection(preparedMarkdown);

    for (const banned of PROCUREMENT_FAQ_BANNED_HREF_FRAGMENTS) {
      expect(faqSection, `banned href fragment still present: ${banned}`).not.toContain(`](${banned}`);
      expect(faqSection, `banned href fragment still present: ${banned}`).not.toMatch(
        new RegExp(`\\]\\([^)]*${banned.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i"),
      );
    }

    const hrefs = extractMarkdownLinkHrefs(faqSection);

    expect(hrefs.length).toBeGreaterThan(0);

    for (const href of hrefs) {
      expect(isBuyerSafeProcurementFaqHref(href), `unsafe FAQ href: ${href}`).toBe(true);
    }

    for (const required of PROCUREMENT_FAQ_REQUIRED_LINK_PATTERNS) {
      expect(faqSection, `missing required FAQ link: ${required}`).toContain(`](${required})`);
    }

    expect(faqSection).not.toMatch(/through security \/ sales/i);
    expect(faqSection).not.toMatch(/through legal \/ sales/i);
    expect(faqSection).not.toMatch(/`\/pricing\?/i);
    expect(faqSection).not.toMatch(/\bVendor\b/);
    expect(faqSection.toLowerCase()).toContain("third-party vendor");
  });

  it("does not use standalone Vendor template voice in rendered copy (P0-5)", () => {
    if (loaded === null) {
      throw new Error("Expected procurement documentation to load.");
    }

    render(
      <HelpTopicMarkdownView
        entry={loaded.entry}
        markdown={loaded.markdown}
        evidenceOrientation={<ProcurementHelpEvidenceOrientationStrip />}
      />,
    );

    const visible = document.body.textContent ?? "";

    expect(visible).not.toMatch(/\bVendor\b/);
    expect(visible).toMatch(/ArchLucid-hosted/i);
  });

  it("renders every right-side TOC item as an anchor to an existing section id", () => {
    if (loaded === null) {
      throw new Error("Expected procurement documentation to load.");
    }

    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, PROCUREMENT_SOURCE);
    const headings = extractHelpMarkdownHeadings(preparedMarkdown);

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    const toc = screen.getByTestId("help-topic-toc");

    for (const heading of headings) {
      const link = within(toc).getByRole("link", { name: heading.title });

      expect(link).toHaveAttribute("href", `#${heading.id}`);
    }
  });
});

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/help/MermaidDiagram", () => ({
  MermaidDiagram: ({ source }: { readonly source: string }) => (
    <div data-testid="mermaid-diagram">{source}</div>
  ),
}));

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpTopicMarkdownView } from "@/app/(operator)/help/HelpTopicMarkdownView";
import { extractHelpMarkdownHeadings } from "@/lib/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

const ENTERPRISE_ONBOARDING_SOURCE = "docs/library/HOSTED_ENTERPRISE_ONBOARDING_CHECKLIST.md";

const ONBOARDING_HUB_LINKS: ReadonlyArray<{ readonly label: string; readonly href: string }> = [
  { label: "Configure SSO", href: "#workforce-sso" },
  { label: "Map roles and groups", href: "#saml-claim-mapping-reference" },
  { label: "Assign policy packs", href: "#default-policy-packs" },
  { label: "Enable governance workflow", href: "#governance-enablement" },
  { label: "Configure audit export", href: "#audit-export" },
  { label: "Connect Azure securely", href: "/help/cloud-connections/azure" },
  { label: "Validate first architecture review", href: "/help/pilot-guide" },
  { label: "Prepare procurement/trust review", href: "/help/procurement" },
];

/** TB-1339 — tenant-provisioning is stripped from product presentation (ArchLucid CS theater). */
const TOC_SECTION_IDS = [
  "onboarding-hub",
  "workforce-sso",
  "saml-claim-mapping-reference",
  "scim-provisioning",
  "default-policy-packs",
  "governance-enablement",
  "audit-export",
  "evaluation-success-criteria",
  "integration-bridges",
  "azure-cloud-evidence-connection",
  "sign-off",
] as const;

const ENTERPRISE_ONBOARDING_HELP_BANNED_SUBSTRINGS = [
  "archlucid auth",
  "archlucid saml",
  "sso-preflight",
  "test-config",
  "validate-saml",
  "appsettings",
  "Evidence tier",
  "JwtBearer",
  "ClaimMappingJson",
  "Tenant GUID",
  "DataRegion",
  "CRM / runbook",
] as const;

describe("HelpTopicMarkdownView enterprise onboarding checklist", () => {
  const loaded = tryLoadProductDocumentation("enterprise-onboarding");

  it("loads enterprise onboarding markdown from the monorepo", () => {
    expect(loaded).not.toBeNull();
  });

  it("renders every onboarding hub item as a link with the expected destination", () => {
    if (loaded === null) {
      throw new Error("Expected enterprise onboarding documentation to load.");
    }

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    for (const item of ONBOARDING_HUB_LINKS) {
      const links = screen.getAllByRole("link", { name: item.label });

      expect(links.some((link) => link.getAttribute("href") === item.href)).toBe(true);
    }
  });

  it("renders every right-side TOC item as an anchor to an existing section id", () => {
    if (loaded === null) {
      throw new Error("Expected enterprise onboarding documentation to load.");
    }

    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, ENTERPRISE_ONBOARDING_SOURCE);
    const headings = extractHelpMarkdownHeadings(preparedMarkdown);

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    const toc = screen.getByTestId("help-topic-toc");

    for (const heading of headings) {
      const link = within(toc).getByRole("link", { name: heading.title });

      expect(link).toHaveAttribute("href", `#${heading.id}`);
      expect(document.getElementById(heading.id)).not.toBeNull();
    }

    for (const sectionId of TOC_SECTION_IDS) {
      expect(document.getElementById(sectionId)).not.toBeNull();
    }
  });

  it("does not show raw markdown anchor syntax in visible headings", () => {
    if (loaded === null) {
      throw new Error("Expected enterprise onboarding documentation to load.");
    }

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.queryByText(/\{#[a-z0-9-]+\}/i)).toBeNull();
  });

  it("links Connect Azure securely to the dedicated Azure help route", () => {
    if (loaded === null) {
      throw new Error("Expected enterprise onboarding documentation to load.");
    }

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    const azureHelpLinks = screen.getAllByRole("link", { name: "Connect Azure securely" });

    expect(azureHelpLinks.some((link) => link.getAttribute("href") === "/help/cloud-connections/azure")).toBe(true);
    expect(azureHelpLinks.some((link) => link.getAttribute("href") === "/help")).toBe(false);
  });

  it("presentation strip removes ArchLucid-internal + eng CLI leakage (TB-1339)", () => {
    if (loaded === null) {
      throw new Error("Expected enterprise onboarding documentation to load.");
    }

    const prepared = prepareHelpMarkdownForPresentation(loaded.markdown, ENTERPRISE_ONBOARDING_SOURCE);
    const lower = prepared.toLowerCase();

    expect(lower).not.toContain("tenant provisioning");

    for (const banned of ENTERPRISE_ONBOARDING_HELP_BANNED_SUBSTRINGS) {
      expect(prepared, `banned substring still present: ${banned}`).not.toContain(banned);
    }
  });

  it("rendered help body stays free of eng CLI and Evidence-tier leakage (TB-1339)", () => {
    if (loaded === null) {
      throw new Error("Expected enterprise onboarding documentation to load.");
    }

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("article")).toBeInTheDocument();

    const visible = document.body.textContent ?? "";

    for (const banned of ENTERPRISE_ONBOARDING_HELP_BANNED_SUBSTRINGS) {
      expect(visible, `banned substring still rendered: ${banned}`).not.toContain(banned);
    }

    expect(visible.toLowerCase()).not.toContain("tenant provisioning");
  });
});

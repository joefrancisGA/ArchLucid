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

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/enterprise-onboarding",
}));

import { HelpTopicMarkdownView } from "@/app/(operator)/help/HelpTopicMarkdownView";
import { EnterpriseOnboardingHelpEvidenceOrientationStrip } from "@/components/help/EnterpriseOnboardingHelpEvidenceOrientationStrip";
import {
  ENTERPRISE_ONBOARDING_HELP_CLAIM_DISCIPLINE,
  ENTERPRISE_ONBOARDING_HELP_SOURCES,
} from "@/lib/enterprise-onboarding-help-evidence-copy";
import {
  ENTERPRISE_ONBOARDING_HELP_PAGE_TITLE,
  ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTION,
} from "@/lib/enterprise-onboarding-help-copy";
import { ENTERPRISE_ONBOARDING_HUB_STEPS } from "@/lib/enterprise-onboarding-hub-steps";
import { getHelpCenterDisplay, getHelpCenterTier } from "@/lib/help-center-catalog";
import { extractHelpMarkdownHeadings } from "@/lib/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

const ENTERPRISE_ONBOARDING_SOURCE = "docs/library/HOSTED_ENTERPRISE_ONBOARDING_CHECKLIST.md";

const HUB_STEP_LABELS = ENTERPRISE_ONBOARDING_HUB_STEPS.flatMap((step) => [
  step.primaryLink.label,
  ...(step.secondaryLinks?.map((link) => link.label) ?? []),
]);

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

function renderEnterpriseOnboardingView(): void {
  const loaded = tryLoadProductDocumentation("enterprise-onboarding");

  if (loaded === null) {
    throw new Error("Expected enterprise onboarding documentation to load.");
  }

  render(
    <HelpTopicMarkdownView
      entry={loaded.entry}
      markdown={loaded.markdown}
      showContextualHelp
      evidenceOrientation={<EnterpriseOnboardingHelpEvidenceOrientationStrip />}
    />,
  );
}

function linksBeforeHeading(heading: HTMLElement): readonly HTMLAnchorElement[] {
  const content = screen.getByTestId("help-topic-content");

  return Array.from(content.querySelectorAll("a")).filter(
    (link) => (heading.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_PRECEDING) !== 0,
  );
}

describe("HelpTopicMarkdownView enterprise onboarding checklist", () => {
  const loaded = tryLoadProductDocumentation("enterprise-onboarding");

  it("loads enterprise onboarding markdown from the monorepo", () => {
    expect(loaded).not.toBeNull();
  });

  it("keeps one title across registry, help center, and page chrome (TB-1341)", () => {
    if (loaded === null) {
      throw new Error("Expected enterprise onboarding documentation to load.");
    }

    expect(loaded.entry.title).toBe(ENTERPRISE_ONBOARDING_HELP_PAGE_TITLE);
    expect(getHelpCenterDisplay(loaded.entry).title).toBe(ENTERPRISE_ONBOARDING_HELP_PAGE_TITLE);
    expect(getHelpCenterTier(loaded.entry)).toBe("admin");
    expect(loaded.entry.audience).toBe("operator");

    renderEnterpriseOnboardingView();

    expect(screen.getByTestId("help-topic-page-title")).toHaveTextContent(ENTERPRISE_ONBOARDING_HELP_PAGE_TITLE);
  });

  it("strips duplicate markdown H1 so the article body does not repeat the page title (TB-1341)", () => {
    if (loaded === null) {
      throw new Error("Expected enterprise onboarding documentation to load.");
    }

    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, ENTERPRISE_ONBOARDING_SOURCE, {
      helpTopicSlug: "enterprise-onboarding",
    });

    expect(preparedMarkdown.trimStart().startsWith("# ")).toBe(false);
  });

  it("renders evidence orientation, breadcrumb, provenance, and identity providers CTA", () => {
    renderEnterpriseOnboardingView();

    expect(screen.getByTestId("enterprise-onboarding-help-claim-discipline")).toHaveTextContent(
      ENTERPRISE_ONBOARDING_HELP_CLAIM_DISCIPLINE,
    );

    const sources = screen.getByTestId("enterprise-onboarding-help-sources");

    for (const link of ENTERPRISE_ONBOARDING_HELP_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(screen.getByTestId("help-topic-breadcrumb")).toHaveTextContent("Help");
    expect(screen.getByRole("link", { name: "Help" })).toHaveAttribute("href", "/help");
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Last reviewed 2026-08-09");
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("V1 GA");
    expect(screen.getByTestId(ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTION.testId)).toHaveAttribute(
      "href",
      ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTION.href,
    );
    expect(screen.getByTestId("help-topic-download-pdf")).toBeInTheDocument();
  });

  it("renders every onboarding hub step with owner, status, and deep link", () => {
    renderEnterpriseOnboardingView();

    const hub = screen.getByTestId("enterprise-onboarding-hub-steps");

    for (const [index, step] of ENTERPRISE_ONBOARDING_HUB_STEPS.entries()) {
      const row = within(hub).getByTestId(`enterprise-onboarding-hub-step-${index + 1}`);

      expect(row).toHaveTextContent(step.owner);
      expect(row).toHaveTextContent("Tracked outside ArchLucid");
      expect(within(row).getByRole("link", { name: step.primaryLink.label })).toHaveAttribute(
        "href",
        step.primaryLink.href,
      );
    }
  });

  it("does not duplicate quick links or onboarding hub markdown bullets", () => {
    if (loaded === null) {
      throw new Error("Expected enterprise onboarding documentation to load.");
    }

    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, ENTERPRISE_ONBOARDING_SOURCE, {
      helpTopicSlug: "enterprise-onboarding",
    });

    expect(preparedMarkdown).not.toContain("**Quick links**");
    expect(preparedMarkdown).not.toContain("## Onboarding hub");

    renderEnterpriseOnboardingView();

    const signInModelsHeading = screen.getByRole("heading", { level: 2, name: "Sign-in models" });
    const linksAboveSignInModels = linksBeforeHeading(signInModelsHeading);

    for (const label of HUB_STEP_LABELS) {
      const matches = linksAboveSignInModels.filter((link) => link.textContent?.trim() === label);

      expect(matches.length).toBeLessThanOrEqual(1);
    }

    expect(screen.queryByText(/Quick links/i)).toBeNull();
  });

  it("renders every right-side TOC item as an anchor to an existing section id", () => {
    if (loaded === null) {
      throw new Error("Expected enterprise onboarding documentation to load.");
    }

    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, ENTERPRISE_ONBOARDING_SOURCE, {
      helpTopicSlug: "enterprise-onboarding",
    });
    const headings = [
      { id: "onboarding-hub", title: "Onboarding hub", level: 2 as const },
      ...extractHelpMarkdownHeadings(preparedMarkdown),
    ];

    renderEnterpriseOnboardingView();

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
    renderEnterpriseOnboardingView();

    expect(screen.queryByText(/\{#[a-z0-9-]+\}/i)).toBeNull();
  });

  it("links Connect Azure securely to the dedicated Azure help route", () => {
    renderEnterpriseOnboardingView();

    const hub = screen.getByTestId("enterprise-onboarding-hub-steps");
    const azureHelpLink = within(hub).getByRole("link", { name: "Connect Azure securely" });

    expect(azureHelpLink).toHaveAttribute("href", "/help/cloud-connections/azure");
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
    renderEnterpriseOnboardingView();

    expect(screen.getByRole("article")).toBeInTheDocument();

    const visible = document.body.textContent ?? "";

    for (const banned of ENTERPRISE_ONBOARDING_HELP_BANNED_SUBSTRINGS) {
      expect(visible, `banned substring still rendered: ${banned}`).not.toContain(banned);
    }

    expect(visible.toLowerCase()).not.toContain("tenant provisioning");
  });
});

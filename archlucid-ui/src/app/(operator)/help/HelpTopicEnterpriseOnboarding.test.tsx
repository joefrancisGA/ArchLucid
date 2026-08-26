import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";

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

import { HelpEnterpriseOnboardingGuideView } from "@/app/(operator)/help/_sections/HelpEnterpriseOnboardingGuideView";
import {
  ENTERPRISE_ONBOARDING_HELP_CLAIM_DISCIPLINE,
  ENTERPRISE_ONBOARDING_HELP_FOLLOW_UPS_TITLE,
  ENTERPRISE_ONBOARDING_HELP_SOURCES,
} from "@/lib/enterprise-onboarding-help-evidence-copy";
import {
  ENTERPRISE_ONBOARDING_HELP_PAGE_TITLE,
  ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTION,
} from "@/lib/enterprise-onboarding-help-copy";
import { FIRST_ARCHITECTURE_REVIEW_HELP_PATH } from "@/lib/first-architecture-review-help-route";
import { ENTERPRISE_ONBOARDING_HUB_STEPS } from "@/lib/enterprise-onboarding-hub-steps";
import { canonicalizeLegacyOperatorRoutePath } from "@/lib/canonicalize-legacy-operator-route-path";
import { getHelpCenterDisplay, getHelpCenterTier } from "@/lib/help/help-center-catalog";
import { extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
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
    <HelpEnterpriseOnboardingGuideView entry={loaded.entry} markdown={loaded.markdown} />,
  );
}

function linksBeforeHeading(heading: HTMLElement): readonly HTMLAnchorElement[] {
  const content = screen.getByTestId("help-topic-content");

  return Array.from(content.querySelectorAll("a")).filter(
    (link) => (heading.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_PRECEDING) !== 0,
  );
}

function contentOrderIndex(testId: string): number {
  const content = screen.getByTestId("help-topic-content");
  const nodes = Array.from(content.children);

  return nodes.findIndex((node) => node.getAttribute("data-testid") === testId);
}

describe("HelpEnterpriseOnboardingGuideView enterprise onboarding checklist", () => {
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

  it("renders specialty checklist guide chrome with Configure SSO in the first viewport (TB-1338)", () => {
    renderEnterpriseOnboardingView();

    expect(screen.getByTestId("help-enterprise-onboarding-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-enterprise-onboarding-action-panel")).toBeInTheDocument();
    expect(screen.getByTestId("help-enterprise-onboarding-first-viewport")).toBeInTheDocument();

    const actionPanel = screen.getByTestId("help-enterprise-onboarding-action-panel");
    const firstReviewHeading = screen.getByRole("heading", { level: 2, name: "Sign-in models" });

    expect(
      (firstReviewHeading.compareDocumentPosition(actionPanel) & Node.DOCUMENT_POSITION_PRECEDING) !== 0,
    ).toBe(true);

    expect(within(actionPanel).getByRole("link", { name: "Configure SSO" })).toHaveAttribute(
      "href",
      "/administration/identity/sso-wizard",
    );
  });

  it("repoints Validate first architecture review to first-architecture-review, not pilot-guide (TB-1342)", () => {
    renderEnterpriseOnboardingView();

    const hub = screen.getByTestId("enterprise-onboarding-hub-steps");
    const firstReviewLink = within(hub).getByRole("link", { name: "Your first architecture review" });

    expect(firstReviewLink).toHaveAttribute("href", FIRST_ARCHITECTURE_REVIEW_HELP_PATH);
    expect(within(hub).queryByRole("link", { name: /pilot guide/i })).toBeNull();
    expect(hub.textContent ?? "").not.toContain("/help/pilot-guide");
  });

  it("renders evidence orientation after the hub with related setup pages title", () => {
    renderEnterpriseOnboardingView();

    expect(contentOrderIndex("enterprise-onboarding-hub-steps")).toBeGreaterThanOrEqual(0);
    expect(contentOrderIndex("enterprise-onboarding-help-orientation")).toBeGreaterThan(
      contentOrderIndex("enterprise-onboarding-hub-steps"),
    );

    expect(screen.getByTestId("enterprise-onboarding-help-claim-discipline")).toHaveTextContent(
      ENTERPRISE_ONBOARDING_HELP_CLAIM_DISCIPLINE,
    );
    expect(screen.queryByText(/Sources package/i)).toBeNull();
    expect(screen.queryByText(/Diligence artifact/i)).toBeNull();
    expect(screen.getByTestId("enterprise-onboarding-help-sources")).toHaveTextContent(
      ENTERPRISE_ONBOARDING_HELP_FOLLOW_UPS_TITLE,
    );

    const sources = screen.getByTestId("enterprise-onboarding-help-sources");

    for (const link of ENTERPRISE_ONBOARDING_HELP_SOURCES) {
      expectFollowUpLink(within(sources), link);
    }

    expect(screen.getByTestId("help-topic-page-title")).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-registry-provenance")).toBeNull();
    expect(screen.getByTestId(ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTION.testId)).toHaveAttribute(
      "href",
      ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTION.href,
    );
    expect(screen.getByTestId("help-topic-print-pdf")).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-download-pdf")).toBeNull();
  });

  it("renders every onboarding hub step with owner and deep link", () => {
    renderEnterpriseOnboardingView();

    const hub = screen.getByTestId("enterprise-onboarding-hub-steps");

    expect(screen.queryByTestId("enterprise-onboarding-hub-progress")).toBeNull();
    expect(within(hub).getByTestId("enterprise-onboarding-hub-recommended-next")).toHaveTextContent(
      "Recommended next",
    );

    for (const [index, step] of ENTERPRISE_ONBOARDING_HUB_STEPS.entries()) {
      const row = within(hub).getByTestId(`enterprise-onboarding-hub-step-${index + 1}`);

      expect(row).toHaveTextContent(step.owner);
      expect(row).not.toHaveTextContent("Tracked outside ArchLucid");

      if (!(step.primaryLink.href.startsWith("#") && step.primaryLink.label === step.title)) {
        expect(within(row).getByRole("link", { name: step.primaryLink.label })).toHaveAttribute(
          "href",
          step.primaryLink.href,
        );
      }
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
    const linksAboveSignInModels = linksBeforeHeading(signInModelsHeading).filter(
      (link) => link.closest('[data-testid="enterprise-onboarding-help-orientation"]') === null,
    );

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

  it("omits blank sign-off table from on-screen checklist body", () => {
    renderEnterpriseOnboardingView();

    expect(screen.queryByRole("heading", { name: "Sign-off" })).toBeNull();
    expect(screen.queryByText("Customer technical owner")).toBeNull();
  });

  it("rewrites legacy identity and cloud settings links to canonical operator routes", () => {
    renderEnterpriseOnboardingView();

    const content = screen.getByTestId("help-topic-content");
    const hrefs = Array.from(content.querySelectorAll("a"))
      .map((link) => link.getAttribute("href"))
      .filter((href): href is string => href !== null);

    for (const href of hrefs) {
      expect(href).not.toMatch(/\/settings\/identity/i);
      expect(href).not.toBe("/settings/cloud-connections");
    }

    const identityProviderLinks = within(content).getAllByRole("link", { name: "Identity providers" });

    expect(identityProviderLinks.some((link) => link.getAttribute("href") === "/administration/identity-providers")).toBe(
      true,
    );
    expect(within(content).getByRole("link", { name: "SSO wizard" })).toHaveAttribute(
      "href",
      "/administration/identity/sso-wizard",
    );
    const cloudConnectionLinks = within(content).getAllByRole("link", { name: "Cloud connections" });

    expect(cloudConnectionLinks.some((link) => link.getAttribute("href") === "/integrations/cloud-connections")).toBe(
      true,
    );

    for (const href of hrefs) {
      if (!href.startsWith("#") && !href.startsWith("http")) {
        expect(canonicalizeLegacyOperatorRoutePath(href.split("#")[0] ?? href)).toBe(href.split("#")[0] ?? href);
      }
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

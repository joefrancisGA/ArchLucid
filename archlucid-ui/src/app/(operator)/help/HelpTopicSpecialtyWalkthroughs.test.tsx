import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useSearchParams = vi.fn();
const replace = vi.fn();
const mockIsAuthorityLoading = vi.hoisted(() => vi.fn(() => false));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    useSearchParams: () => useSearchParams(),
    usePathname: () => "/help/specialty-walkthroughs",
    useRouter: () => ({ replace }),
  };
});

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => ({
    isAuthorityLoading: mockIsAuthorityLoading(),
  }),
}));

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: vi.fn(() => true),
}));

vi.mock("@/hooks/use-review-intake-navigation", () => ({
  useReviewIntakeNavigation: () => ({
    navigate: vi.fn(),
    isNavigating: false,
    loadingLabel: "Preparing architecture review…",
    showStagedPanel: false,
    activeStageId: null,
    stages: [],
    error: null,
  }),
}));

import { HelpSpecialtyWalkthroughTemplatesView } from "@/app/(operator)/help/_sections/HelpSpecialtyWalkthroughTemplatesView";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  SPECIALTY_REVIEW_TEMPLATES_PAGE_TITLE,
  SPECIALTY_REVIEW_TEMPLATES_AUTHORITY_LOADING_LABEL,
  SPECIALTY_REVIEW_TEMPLATES_USE_STANDARD_REVIEW_LABEL,
  specialtyReviewTemplatesCompareHref,
} from "@/lib/specialty-review-templates";

const BANNED_INTERNAL_COPY = [
  "first commit",
  "core pilot",
  "v1.1",
  "pilot operators",
  "canonical workflow",
  "buyer-job",
  "proof packet",
  "accelerator acceptance",
  "product packaging",
  "why pilot",
  "shipped sequence",
  "operator walkthrough",
  "sponsor artifact",
  "azure saas readiness review",
] as const;

describe("HelpSpecialtyWalkthroughTemplatesView", () => {
  const entry = getProductDocumentationEntry("specialty-walkthroughs");
  let searchParams = new URLSearchParams();

  beforeEach(() => {
    searchParams = new URLSearchParams();
    useSearchParams.mockImplementation(() => searchParams);
    replace.mockImplementation((href: string) => {
      const url = new URL(href, "http://localhost");

      searchParams = new URLSearchParams(url.search);
    });
    mockIsAuthorityLoading.mockReturnValue(false);
    vi.mocked(useOperateCapability).mockReturnValue(true);
  });

  it("registers customer-facing registry metadata", () => {
    expect(entry?.title).toBe("Specialty review templates");
    expect(entry?.slug).toBe("specialty-walkthroughs");
  });

  it("renders template cards and standard review path without internal rollout language", () => {
    if (entry === undefined) {
      throw new Error("Expected specialty-walkthroughs documentation entry.");
    }

    render(<HelpSpecialtyWalkthroughTemplatesView entry={entry} />);

    expect(screen.getByRole("heading", { level: 1, name: SPECIALTY_REVIEW_TEMPLATES_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Guide last reviewed 2026-05-01");
    expect(screen.getByTestId("help-topic-toc")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: SPECIALTY_REVIEW_TEMPLATES_USE_STANDARD_REVIEW_LABEL })).toHaveAttribute(
      "href",
      "/architecture/reviews/new",
    );

    const grid = screen.getByTestId("specialty-template-card-grid");
    expect(within(grid).getByText("SaaS readiness")).toBeInTheDocument();
    expect(within(grid).getByText("AI policy")).toBeInTheDocument();
    expect(within(grid).getByText("Healthcare claims")).toBeInTheDocument();

    const visibleText = document.body.textContent?.toLowerCase() ?? "";

    for (const banned of BANNED_INTERNAL_COPY) {
      expect(visibleText, `should not contain "${banned}"`).not.toContain(banned);
    }
  });

  it("shows inline selection footer with continue CTA after choosing a template", () => {
    if (entry === undefined) {
      throw new Error("Expected specialty-walkthroughs documentation entry.");
    }

    render(<HelpSpecialtyWalkthroughTemplatesView entry={entry} />);

    fireEvent.click(screen.getByTestId("specialty-template-use-ai-governance"));

    const selectedCard = screen.getByTestId("specialty-template-card-ai-governance");
    expect(selectedCard.className).not.toMatch(/ring-teal|border-teal|bg-teal/);
    const selectionFooter = within(selectedCard).getByTestId("specialty-template-card-selection-footer");
    expect(selectionFooter.className).not.toMatch(/border-teal|bg-teal/);
    expect(selectionFooter).toHaveAttribute("role", "status");
    expect(selectionFooter).toHaveTextContent(/continue to review setup/i);
    expect(within(selectedCard).getByRole("button", { name: "Remove template" })).toBeInTheDocument();
    expect(within(selectedCard).getByTestId("specialty-template-continue-setup")).toHaveFocus();
  });

  it("renders policy pack provenance on every template card", () => {
    if (entry === undefined) {
      throw new Error("Expected specialty-walkthroughs documentation entry.");
    }

    render(<HelpSpecialtyWalkthroughTemplatesView entry={entry} />);

    for (const templateId of ["saas-readiness", "ai-governance", "healthcare-claims"] as const) {
      const card = screen.getByTestId(`specialty-template-card-${templateId}`);
      const provenance = within(card).getByTestId(`specialty-template-policy-packs-${templateId}`);
      expect(within(provenance).getByText(/Backed by/i)).toBeInTheDocument();
      expect(within(provenance).getAllByRole("link").length).toBeGreaterThanOrEqual(1);
      expect(within(card).getByRole("heading", { level: 3, name: new RegExp(templateId === "saas-readiness" ? "SaaS readiness" : templateId === "ai-governance" ? "AI policy" : "Healthcare claims", "i") })).toBeInTheDocument();
      expect(within(card).getByTestId("specialty-template-sample-review-" + templateId)).toHaveAttribute("href");
    }

    const healthcareCard = screen.getByTestId("specialty-template-card-healthcare-claims");
    expect(
      within(healthcareCard).getByRole("link", { name: /Healthcare Claims Policy Pack v3\.4\.1/i }),
    ).toHaveAttribute("href", "/governance/policy-packs/demo-enterprise-privacy-pack");
  });

  it("links compare templates to the comparison section", () => {
    if (entry === undefined) {
      throw new Error("Expected specialty-walkthroughs documentation entry.");
    }

    render(<HelpSpecialtyWalkthroughTemplatesView entry={entry} />);

    const compareLinks = screen.getAllByRole("link", { name: "Compare templates" });
    expect(compareLinks.some((link) => link.getAttribute("href") === specialtyReviewTemplatesCompareHref())).toBe(true);
    expect(screen.getByTestId("specialty-template-comparison-table")).toBeInTheDocument();
    expect(document.getElementById("specialty-template-comparison")).not.toBeNull();
  });

  it("opens a preview dialog without internal policy identifiers", () => {
    if (entry === undefined) {
      throw new Error("Expected specialty-walkthroughs documentation entry.");
    }

    render(<HelpSpecialtyWalkthroughTemplatesView entry={entry} />);

    fireEvent.click(screen.getByTestId("specialty-template-preview-healthcare-claims"));

    const dialog = screen.getByTestId("specialty-template-preview-dialog");
    expect(within(dialog).getByRole("heading", { name: "Healthcare claims preview" })).toBeInTheDocument();
    expect(within(dialog).getByText("Sample review questions")).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: /Healthcare Claims Policy Pack v3\.4\.1/i })).toHaveAttribute(
      "href",
      "/governance/policy-packs/demo-enterprise-privacy-pack",
    );
    expect(dialog.textContent?.toLowerCase() ?? "").not.toContain("healthcare-claims-v3");
  });

  it("shows authority loading instead of read-only hint while permissions resolve", () => {
    if (entry === undefined) {
      throw new Error("Expected specialty-walkthroughs documentation entry.");
    }

    mockIsAuthorityLoading.mockReturnValue(true);
    vi.mocked(useOperateCapability).mockReturnValue(false);

    render(<HelpSpecialtyWalkthroughTemplatesView entry={entry} />);

    expect(screen.getByTestId("specialty-template-authority-loading")).toHaveTextContent(
      SPECIALTY_REVIEW_TEMPLATES_AUTHORITY_LOADING_LABEL,
    );
    expect(screen.queryByTestId("specialty-template-permission-hint")).not.toBeInTheDocument();
    expect(screen.getByTestId("specialty-template-use-saas-readiness")).toHaveTextContent("Checking permission…");
    expect(screen.getAllByTestId("specialty-template-policy-pack-provenance-loading")).toHaveLength(3);
  });

  it("disables use-template actions for read-only users with an explanation", () => {
    if (entry === undefined) {
      throw new Error("Expected specialty-walkthroughs documentation entry.");
    }

    vi.mocked(useOperateCapability).mockReturnValue(false);

    render(<HelpSpecialtyWalkthroughTemplatesView entry={entry} />);

    expect(screen.getByTestId("specialty-template-permission-hint")).toHaveTextContent(/review creation permission/i);
    expect(screen.getByText("Preview only")).toBeInTheDocument();
    expect(screen.getByTestId("specialty-template-use-saas-readiness")).toBeDisabled();
    expect(screen.getByTestId("specialty-template-preview-saas-readiness")).toBeEnabled();
  });
});

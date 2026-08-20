import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/app/(operator)/help/_sections/HelpAzurePermissionsVerificationPanel", () => ({
  HelpAzurePermissionsVerificationPanel: (props: { readonly returnHref: string }) => (
    <div data-testid="azure-permissions-verify-section" data-return-href={props.returnHref} />
  ),
}));

vi.mock("@/app/(operator)/help/_sections/HelpAzurePermissionsConnectionContext", () => ({
  HelpAzurePermissionsConnectionContext: () => <div data-testid="azure-permissions-connection-context" />,
}));

import { HelpAzurePermissionsGuideView } from "@/app/(operator)/help/_sections/HelpAzurePermissionsGuideView";
import {
  AZURE_CLOUD_CONNECTION_ROLE_ROWS,
  AZURE_CLOUD_CONNECTION_TROUBLESHOOTING_ITEMS,
  formatAzurePermissionRequirementLabel,
} from "@/lib/azure-cloud-connection-permissions-manifest";
import {
  AZURE_PERMISSIONS_CONNECTION_CONTEXT_HEADING,
  AZURE_PERMISSIONS_MATRIX_HEADING,
  AZURE_PERMISSIONS_PAGE_SUBTITLE,
  AZURE_PERMISSIONS_PAGE_TITLE,
  AZURE_PERMISSIONS_REQUIRED_ROLES_SUMMARY_HEADING,
  AZURE_PERMISSIONS_SETUP_HEADING,
} from "@/lib/azure-cloud-connection-permissions-copy";
import {
  AZURE_PERMISSIONS_HELP_BANNED_PRIMARY_CHROME_COPY,
  AZURE_PERMISSIONS_HELP_CLAIM_DISCIPLINE,
  AZURE_PERMISSIONS_HELP_DEFERRED_CUSTOM_ROLE_DISCLOSURE_TEST_ID,
  AZURE_PERMISSIONS_HELP_DEFERRED_MATRIX_DISCLOSURE_TEST_ID,
  AZURE_PERMISSIONS_HELP_FIRST_VIEWPORT_TEST_ID,
  AZURE_PERMISSIONS_HELP_HEADER_TEST_ID,
  AZURE_PERMISSIONS_HELP_JOB_MATRIX_TEST_ID,
  AZURE_PERMISSIONS_HELP_PRIMARY_SETUP_ACTION,
  AZURE_PERMISSIONS_HELP_REQUIREMENTS_REVIEWED_DISCLOSURE_TEST_ID,
  formatAzurePermissionsHelpRequirementsReviewedLine,
} from "@/lib/azure-permissions-help-evidence-copy";
import { CONNECT_AZURE_SECURELY_PAGE_TITLE } from "@/lib/connect-azure-securely-help-content";
import { shouldOmitClaimDisciplineBand } from "@/lib/claim-discipline-policy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpAzurePermissionsGuideView", () => {
  const entry = getProductDocumentationEntry("azure-permissions");

  it("registers the azure permissions help guide entry", () => {
    expect(entry?.slug).toBe("azure-permissions");
    expect(entry?.title).toBe(AZURE_PERMISSIONS_PAGE_TITLE);
    expect(entry?.summary).toContain("read-only");
    expect(entry?.lastReviewed).toBe("2026-08-09");
    expect(entry?.releaseApplicability).toBeTruthy();
  });

  it("exposes IA dual with Connect Azure securely and mutual help links (TB-1629)", () => {
    if (entry === undefined) {
      throw new Error("Expected azure-permissions documentation entry.");
    }

    render(<HelpAzurePermissionsGuideView entry={entry} />);

    const firstViewport = screen.getByTestId(AZURE_PERMISSIONS_HELP_FIRST_VIEWPORT_TEST_ID);

    expect(within(firstViewport).getByTestId(AZURE_PERMISSIONS_HELP_JOB_MATRIX_TEST_ID)).toBeInTheDocument();
    expect(
      within(firstViewport).getByRole("link", { name: CONNECT_AZURE_SECURELY_PAGE_TITLE }),
    ).toHaveAttribute("href", "/help/cloud-connections/azure");
    expect(within(firstViewport).getByTestId("help-azure-permissions-job-matrix-current")).toHaveTextContent(
      "This Azure permissions guide",
    );
  });

  it("keeps the first viewport to required-role summary and trust panel before setup (TB-1627)", () => {
    if (entry === undefined) {
      throw new Error("Expected azure-permissions documentation entry.");
    }

    render(<HelpAzurePermissionsGuideView entry={entry} />);

    const firstViewport = screen.getByTestId(AZURE_PERMISSIONS_HELP_FIRST_VIEWPORT_TEST_ID);

    expect(within(firstViewport).getByTestId("azure-permissions-required-roles-summary")).toBeInTheDocument();
    expect(within(firstViewport).getByTestId("azure-permissions-trust-panel")).toBeInTheDocument();
    expect(within(firstViewport).queryByTestId("azure-permissions-matrix-table")).toBeNull();
    expect(within(firstViewport).queryByTestId("azure-permissions-custom-role-table")).toBeNull();
    expect(within(firstViewport).queryByTestId(AZURE_PERMISSIONS_HELP_DEFERRED_MATRIX_DISCLOSURE_TEST_ID)).toBeNull();
    expect(within(firstViewport).queryByTestId(AZURE_PERMISSIONS_HELP_DEFERRED_CUSTOM_ROLE_DISCLOSURE_TEST_ID)).toBeNull();
    expect(within(firstViewport).queryByTestId("azure-permissions-setup-section")).toBeNull();
    expect(within(firstViewport).queryByTestId("azure-permissions-verify-section")).toBeNull();
  });

  it("places setup and verify before deferred IAM tables (TB-1627)", () => {
    if (entry === undefined) {
      throw new Error("Expected azure-permissions documentation entry.");
    }

    render(<HelpAzurePermissionsGuideView entry={entry} subscriptionId="00000000-0000-0000-0000-000000000001" />);

    const primary = screen.getByTestId("help-azure-permissions-primary");
    const sectionNodes = Array.from(
      primary.querySelectorAll(
        '[data-testid="azure-permissions-setup-section"], [data-testid="azure-permissions-verify-section"], [data-testid="azure-permissions-matrix-disclosure"], [data-testid="azure-permissions-custom-role-disclosure"]',
      ),
    ).map((node) => node.getAttribute("data-testid"));

    expect(sectionNodes).toEqual([
      "azure-permissions-setup-section",
      "azure-permissions-verify-section",
      "azure-permissions-matrix-disclosure",
      "azure-permissions-custom-role-disclosure",
    ]);
    expect(screen.getByTestId(AZURE_PERMISSIONS_HELP_DEFERRED_MATRIX_DISCLOSURE_TEST_ID)).not.toHaveAttribute("open");
    expect(screen.getByTestId(AZURE_PERMISSIONS_HELP_DEFERRED_CUSTOM_ROLE_DISCLOSURE_TEST_ID)).not.toHaveAttribute("open");
  });

  it("exposes a first-viewport primary setup CTA in the header (TB-1626)", () => {
    if (entry === undefined) {
      throw new Error("Expected azure-permissions documentation entry.");
    }

    render(<HelpAzurePermissionsGuideView entry={entry} />);

    const primary = screen.getByTestId(AZURE_PERMISSIONS_HELP_PRIMARY_SETUP_ACTION.testId);

    expect(primary).toHaveAttribute("href", AZURE_PERMISSIONS_HELP_PRIMARY_SETUP_ACTION.defaultHref);
    expect(primary).toHaveTextContent(AZURE_PERMISSIONS_HELP_PRIMARY_SETUP_ACTION.label);
    expect(primary.closest("header")).not.toBeNull();
    expect(primary.compareDocumentPosition(screen.getByTestId("azure-permissions-trust-panel")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("renders trust panel, permissions matrix, and provider links", () => {
    if (entry === undefined) {
      throw new Error("Expected azure-permissions documentation entry.");
    }

    render(<HelpAzurePermissionsGuideView entry={entry} returnHref="/integrations/cloud-connections/azure" />);

    expect(screen.getByRole("heading", { level: 1, name: AZURE_PERMISSIONS_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByText(AZURE_PERMISSIONS_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-registry-provenance")).toBeNull();
    expect(screen.queryByTestId("help-topic-registry-provenance")).toBeNull();
    if (!shouldOmitClaimDisciplineBand("azure-permissions-help")) {
      expect(screen.getByTestId("azure-permissions-help-claim-discipline")).toHaveTextContent(
        AZURE_PERMISSIONS_HELP_CLAIM_DISCIPLINE,
      );
    }
    expect(screen.queryByTestId("azure-permissions-help-sources")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: AZURE_PERMISSIONS_HELP_PRIMARY_SETUP_ACTION.label })).toHaveAttribute(
      "href",
      "/integrations/cloud-connections/azure",
    );
    expect(screen.getByTestId("help-azure-permissions-header-actions")).toBeInTheDocument();
    expect(screen.getByTestId("azure-permissions-trust-panel")).toBeInTheDocument();
    expect(screen.getByTestId("azure-permissions-trust-panel").className).not.toMatch(/bg-teal|border-teal/);

    const matrix = screen.getByTestId("azure-permissions-matrix-table");
    expect(within(matrix).getByText("Reader")).toBeInTheDocument();
    expect(within(matrix).getByText(formatAzurePermissionRequirementLabel("required"))).toBeInTheDocument();
    expect(within(matrix).getByText(formatAzurePermissionRequirementLabel("conditional"))).toBeInTheDocument();
    for (const row of AZURE_CLOUD_CONNECTION_ROLE_ROWS) {
      expect(within(matrix).getByText(row.azureRole)).toBeInTheDocument();
    }

    expect(screen.getByRole("link", { name: /Back to cloud connections/i })).toHaveAttribute(
      "href",
      "/integrations/cloud-connections/azure",
    );
    expect(screen.getByRole("link", { name: "Fix a failed permission check" })).toHaveAttribute("href", "#troubleshoot");
    expect(screen.getByRole("link", { name: "AWS connection permissions" })).toHaveAttribute(
      "href",
      "/help/cloud-connections/aws",
    );
    expect(screen.getByRole("link", { name: "Google Cloud connection permissions" })).toHaveAttribute(
      "href",
      "/help/cloud-connections/gcp",
    );
  });

  it("sends the verify action to Azure setup when no return context is supplied", () => {
    if (entry === undefined) {
      throw new Error("Expected azure-permissions documentation entry.");
    }

    render(<HelpAzurePermissionsGuideView entry={entry} />);

    expect(screen.getByRole("link", { name: /Back to cloud connections/i })).toHaveAttribute(
      "href",
      "/integrations/cloud-connections",
    );
    expect(screen.getByTestId("azure-permissions-verify-section")).toHaveAttribute(
      "data-return-href",
      "/integrations/cloud-connections/azure",
    );
  });

  it("preserves a caller-supplied return path for the verify action", () => {
    if (entry === undefined) {
      throw new Error("Expected azure-permissions documentation entry.");
    }

    render(
      <HelpAzurePermissionsGuideView entry={entry} returnHref="/integrations/cloud-connections/azure?step=permissions" />,
    );

    expect(screen.getByTestId("azure-permissions-verify-section")).toHaveAttribute(
      "data-return-href",
      "/integrations/cloud-connections/azure?step=permissions",
    );
  });

  it("lists troubleshooting causes without a disclosure control", () => {
    if (entry === undefined) {
      throw new Error("Expected azure-permissions documentation entry.");
    }

    render(<HelpAzurePermissionsGuideView entry={entry} />);

    const troubleshootList = screen.getByTestId("azure-permissions-troubleshoot-list");
    for (const item of AZURE_CLOUD_CONNECTION_TROUBLESHOOTING_ITEMS) {
      expect(within(troubleshootList).getByText(item)).toBeInTheDocument();
    }
    expect(screen.queryByText("Common permission check issues")).not.toBeInTheDocument();
  });

  it("keeps eng tier and release-contract jargon out of primary chrome (TB-1628)", () => {
    if (entry === undefined) {
      throw new Error("Expected azure-permissions documentation entry.");
    }

    render(<HelpAzurePermissionsGuideView entry={entry} />);

    const header = screen.getByTestId(AZURE_PERMISSIONS_HELP_HEADER_TEST_ID);
    const firstViewport = screen.getByTestId(AZURE_PERMISSIONS_HELP_FIRST_VIEWPORT_TEST_ID);
    const primaryChromeText = `${header.textContent ?? ""} ${firstViewport.textContent ?? ""}`;

    for (const banned of AZURE_PERMISSIONS_HELP_BANNED_PRIMARY_CHROME_COPY) {
      expect(primaryChromeText).not.toContain(banned);
    }

    expect(screen.getByTestId(AZURE_PERMISSIONS_HELP_REQUIREMENTS_REVIEWED_DISCLOSURE_TEST_ID)).not.toHaveAttribute("open");
    expect(screen.getByTestId(AZURE_PERMISSIONS_HELP_REQUIREMENTS_REVIEWED_DISCLOSURE_TEST_ID)).toHaveTextContent(
      formatAzurePermissionsHelpRequirementsReviewedLine("2026-07-13"),
    );
  });

  it("does not surface Tier 1 or Tier 2 vocabulary in customer copy", () => {
    if (entry === undefined) {
      throw new Error("Expected azure-permissions documentation entry.");
    }

    const { container } = render(<HelpAzurePermissionsGuideView entry={entry} />);

    expect(container.textContent).not.toMatch(/Tier 1|Tier 2/);
  });

  it("uses a centered reading width", () => {
    if (entry === undefined) {
      throw new Error("Expected azure-permissions documentation entry.");
    }

    const { container } = render(<HelpAzurePermissionsGuideView entry={entry} />);

    expect(container.querySelector('[data-testid="help-azure-permissions-guide"]')).toHaveClass("max-w-[68rem]");
  });

  it("places verify immediately after assign roles in the document", () => {
    if (entry === undefined) {
      throw new Error("Expected azure-permissions documentation entry.");
    }

    render(<HelpAzurePermissionsGuideView entry={entry} subscriptionId="00000000-0000-0000-0000-000000000001" />);

    const primary = screen.getByTestId("help-azure-permissions-primary");
    const sectionNodes = Array.from(
      primary.querySelectorAll(
        '[data-testid="azure-permissions-setup-section"], [data-testid="azure-permissions-verify-section"], [data-testid="azure-permissions-collected-section"]',
      ),
    ).map((node) => node.getAttribute("data-testid"));

    expect(sectionNodes).toEqual([
      "azure-permissions-setup-section",
      "azure-permissions-verify-section",
      "azure-permissions-collected-section",
    ]);
  });

  it("renders setup tabs and custom role actions", () => {
    if (entry === undefined) {
      throw new Error("Expected azure-permissions documentation entry.");
    }

    render(<HelpAzurePermissionsGuideView entry={entry} subscriptionId="00000000-0000-0000-0000-000000000001" />);

    expect(screen.getByRole("heading", { level: 2, name: AZURE_PERMISSIONS_REQUIRED_ROLES_SUMMARY_HEADING })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: AZURE_PERMISSIONS_SETUP_HEADING })).toBeInTheDocument();
    expect(screen.getByTestId("azure-permissions-setup-tabs")).toBeInTheDocument();
    expect(screen.getByTestId("azure-permissions-custom-role-table")).toBeInTheDocument();
    expect(screen.getByTestId("azure-permissions-verify-section")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: AZURE_PERMISSIONS_CONNECTION_CONTEXT_HEADING })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 2, name: AZURE_PERMISSIONS_CONNECTION_CONTEXT_HEADING })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 2, name: AZURE_PERMISSIONS_MATRIX_HEADING })).toBeInTheDocument();
  });
});

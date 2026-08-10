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
} from "@/lib/azure-cloud-connection-permissions-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpAzurePermissionsGuideView", () => {
  const entry = getProductDocumentationEntry("azure-permissions");

  it("registers the azure permissions help guide entry", () => {
    expect(entry?.slug).toBe("azure-permissions");
    expect(entry?.title).toBe(AZURE_PERMISSIONS_PAGE_TITLE);
    expect(entry?.summary).toContain("read-only");
  });

  it("renders trust panel, permissions matrix, and provider links", () => {
    if (entry === undefined) {
      throw new Error("Expected azure-permissions documentation entry.");
    }

    render(<HelpAzurePermissionsGuideView entry={entry} returnHref="/integrations/cloud-connections/azure" />);

    expect(screen.getByRole("heading", { level: 1, name: AZURE_PERMISSIONS_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByText(AZURE_PERMISSIONS_PAGE_SUBTITLE)).toBeInTheDocument();
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

  it("renders setup tabs and custom role actions", () => {
    if (entry === undefined) {
      throw new Error("Expected azure-permissions documentation entry.");
    }

    render(<HelpAzurePermissionsGuideView entry={entry} subscriptionId="00000000-0000-0000-0000-000000000001" />);

    expect(screen.getByTestId("azure-permissions-setup-tabs")).toBeInTheDocument();
    expect(screen.getByTestId("azure-permissions-custom-role-table")).toBeInTheDocument();
    expect(screen.getByTestId("azure-permissions-verify-section")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: AZURE_PERMISSIONS_CONNECTION_CONTEXT_HEADING })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 2, name: AZURE_PERMISSIONS_CONNECTION_CONTEXT_HEADING })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 2, name: AZURE_PERMISSIONS_MATRIX_HEADING })).toBeInTheDocument();
  });
});

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/app/(operator)/help/_sections/HelpAzurePermissionsVerificationPanel", () => ({
  HelpAzurePermissionsVerificationPanel: () => <div data-testid="azure-permissions-verify-section" />,
}));

vi.mock("@/app/(operator)/help/_sections/HelpAzurePermissionsConnectionContext", () => ({
  HelpAzurePermissionsConnectionContext: () => <div data-testid="azure-permissions-connection-context" />,
}));

import { HelpAzurePermissionsGuideView } from "@/app/(operator)/help/_sections/HelpAzurePermissionsGuideView";
import {
  AZURE_CLOUD_CONNECTION_ROLE_ROWS,
  formatAzurePermissionRequirementLabel,
} from "@/lib/azure-cloud-connection-permissions-manifest";
import {
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
    expect(screen.getByRole("link", { name: "AWS connection permissions" })).toHaveAttribute(
      "href",
      "/help/cloud-connections/aws",
    );
    expect(screen.getByRole("link", { name: "Google Cloud connection permissions" })).toHaveAttribute(
      "href",
      "/help/cloud-connections/gcp",
    );
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
  });
});

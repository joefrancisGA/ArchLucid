import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpConnectAzureSecurelyGuideView } from "@/app/(operator)/help/_sections/HelpConnectAzureSecurelyGuideView";
import { formatAzurePermissionRequirementLabel } from "@/lib/azure-cloud-connection-permissions-manifest";
import {
  CONNECT_AZURE_SECURELY_CONNECTION_VALUE,
  CONNECT_AZURE_SECURELY_COST_OPTIONAL_NOTE,
  CONNECT_AZURE_SECURELY_FORBIDDEN_ROLES_BODY,
  CONNECT_AZURE_SECURELY_PAGE_INTRO,
  CONNECT_AZURE_SECURELY_PAGE_TITLE,
  CONNECT_AZURE_SECURELY_SECURITY_HEADING,
} from "@/lib/connect-azure-securely-help-content";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

const BANNED_COPY = ["Evidence tier", "hosted pull", "published managed identity", "validation pull"] as const;

describe("HelpConnectAzureSecurelyGuideView", () => {
  const entry = getProductDocumentationEntry("cloud-connections-azure");

  it("registers the connect Azure securely help guide entry", () => {
    expect(entry?.slug).toBe("cloud-connections-azure");
    expect(entry?.title).toBe(CONNECT_AZURE_SECURELY_PAGE_TITLE);
  });

  it("renders one H1 and starts on-page navigation with Security model", () => {
    if (entry === undefined) {
      throw new Error("Expected cloud-connections-azure documentation entry.");
    }

    render(<HelpConnectAzureSecurelyGuideView entry={entry} />);

    expect(screen.getAllByRole("heading", { level: 1, name: CONNECT_AZURE_SECURELY_PAGE_TITLE })).toHaveLength(1);
    expect(screen.queryByRole("heading", { level: 2, name: CONNECT_AZURE_SECURELY_PAGE_TITLE })).toBeNull();
    expect(screen.getByText(CONNECT_AZURE_SECURELY_PAGE_INTRO)).toBeInTheDocument();
    expect(screen.getByText(CONNECT_AZURE_SECURELY_CONNECTION_VALUE)).toBeInTheDocument();

    const toc = screen.getByTestId("help-topic-toc");
    expect(within(toc).getByRole("link", { name: CONNECT_AZURE_SECURELY_SECURITY_HEADING })).toHaveAttribute(
      "href",
      "#security-model",
    );
    expect(within(toc).queryByRole("link", { name: CONNECT_AZURE_SECURELY_PAGE_TITLE })).toBeNull();
  });

  it("shows role requirements, scope, and separated data classifications", () => {
    if (entry === undefined) {
      throw new Error("Expected cloud-connections-azure documentation entry.");
    }

    render(<HelpConnectAzureSecurelyGuideView entry={entry} />);

    const rolesTable = screen.getByTestId("connect-azure-securely-roles-table");
    expect(within(rolesTable).getByText(formatAzurePermissionRequirementLabel("required"))).toBeInTheDocument();
    expect(within(rolesTable).getByText(formatAzurePermissionRequirementLabel("conditional"))).toBeInTheDocument();
    expect(screen.getByText(CONNECT_AZURE_SECURELY_COST_OPTIONAL_NOTE)).toBeInTheDocument();
    expect(screen.getByText(CONNECT_AZURE_SECURELY_FORBIDDEN_ROLES_BODY)).toBeInTheDocument();

    expect(screen.getByRole("heading", { level: 2, name: "Information retained" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Credentials not retained" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Permissions not required" })).toBeInTheDocument();
    expect(screen.queryByText(/Owner or Contributor privileges/i)).toBeNull();
  });

  it("provides workflow navigation actions", () => {
    if (entry === undefined) {
      throw new Error("Expected cloud-connections-azure documentation entry.");
    }

    render(<HelpConnectAzureSecurelyGuideView entry={entry} returnHref="/integrations/cloud-connections/azure" />);

    expect(screen.getByRole("link", { name: /Back to cloud connections/i })).toHaveAttribute(
      "href",
      "/integrations/cloud-connections/azure",
    );
    expect(screen.getAllByRole("link", { name: "Configure Azure connection" })[0]).toHaveAttribute(
      "href",
      "/integrations/cloud-connections/azure",
    );
    expect(screen.getByRole("link", { name: "View detailed Azure setup instructions" })).toHaveAttribute(
      "href",
      "/help/azure-permissions",
    );
  });

  it("avoids internal taxonomy and jargon in primary copy", () => {
    if (entry === undefined) {
      throw new Error("Expected cloud-connections-azure documentation entry.");
    }

    render(<HelpConnectAzureSecurelyGuideView entry={entry} />);

    const primary = screen.getByTestId("help-connect-azure-securely-primary");
    const text = primary.textContent?.toLowerCase() ?? "";

    for (const banned of BANNED_COPY) {
      expect(text).not.toContain(banned.toLowerCase());
    }
  });
});

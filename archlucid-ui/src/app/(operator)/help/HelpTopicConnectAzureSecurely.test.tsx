import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpConnectAzureSecurelyGuideView } from "@/app/(operator)/help/_sections/HelpConnectAzureSecurelyGuideView";
import {
  AZURE_CLOUD_CONNECTION_CANNOT_DO,
  AZURE_CLOUD_CONNECTION_DATA_NOT_COLLECTED,
  AZURE_CLOUD_CONNECTION_TROUBLESHOOTING_ITEMS,
  formatAzurePermissionRequirementLabel,
} from "@/lib/azure-cloud-connection-permissions-manifest";
import { AZURE_PERMISSIONS_TROUBLESHOOT_HEADING } from "@/lib/azure-cloud-connection-permissions-copy";
import {
  CONNECT_AZURE_SECURELY_CLAIM_DISCIPLINE,
  CONNECT_AZURE_SECURELY_CONNECTION_STATUS_HREF,
  CONNECT_AZURE_SECURELY_CONNECTION_STATUS_LINK_LABEL,
  CONNECT_AZURE_SECURELY_DETAILED_SETUP_LINK,
  CONNECT_AZURE_SECURELY_FORBIDDEN_ROLES_BODY,
  CONNECT_AZURE_SECURELY_FORBIDDEN_ROLES_HEADING,
  CONNECT_AZURE_SECURELY_PAGE_LEAD,
  CONNECT_AZURE_SECURELY_PAGE_TITLE,
  CONNECT_AZURE_SECURELY_PERMISSIONS_AUTHORITY_NOTE,
  CONNECT_AZURE_SECURELY_SECURITY_HEADING,
  CONNECT_AZURE_SECURELY_SOURCES,
  CONNECT_AZURE_SECURELY_STEP_AZURE_CONNECTION_SETTINGS_LINK,
  CONNECT_AZURE_SECURELY_VERIFICATION_CHECKS,
  CONNECT_AZURE_SECURELY_VERIFICATION_DOES_NOT_VERIFY,
  CONNECT_AZURE_SECURELY_VERIFICATION_HEADING,
  buildConnectAzureSecurelyVerifyHref,
} from "@/lib/connect-azure-securely-help-content";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

const BANNED_COPY = [
  "Evidence tier",
  "hosted pull",
  "published managed identity",
  "validation pull",
  "POST",
  "hosted collector",
  "hosted path",
  "cost APIs",
] as const;

describe("HelpConnectAzureSecurelyGuideView", () => {
  const entry = getProductDocumentationEntry("cloud-connections-azure");

  it("registers the connect Azure securely help guide entry with provenance metadata", () => {
    expect(entry?.slug).toBe("cloud-connections-azure");
    expect(entry?.title).toBe(CONNECT_AZURE_SECURELY_PAGE_TITLE);
    expect(entry?.lastReviewed).toBe("2026-08-09");
    expect(entry?.releaseApplicability).toBeTruthy();
  });

  it("renders one H1 and starts on-page navigation with Security model", () => {
    if (entry === undefined) {
      throw new Error("Expected cloud-connections-azure documentation entry.");
    }

    render(<HelpConnectAzureSecurelyGuideView entry={entry} />);

    expect(screen.getAllByRole("heading", { level: 1, name: CONNECT_AZURE_SECURELY_PAGE_TITLE })).toHaveLength(1);
    expect(screen.queryByRole("heading", { level: 2, name: CONNECT_AZURE_SECURELY_PAGE_TITLE })).toBeNull();
    expect(screen.getByText(CONNECT_AZURE_SECURELY_PAGE_LEAD)).toBeInTheDocument();
    expect(screen.getByTestId("connect-azure-securely-help-claim-discipline")).toHaveTextContent(
      CONNECT_AZURE_SECURELY_CLAIM_DISCIPLINE,
    );
    expect(screen.queryByTestId("help-topic-registry-provenance")).toBeNull();
    expect(screen.queryByTestId("help-topic-registry-provenance")).toBeNull();

    const toc = screen.getByTestId("help-topic-toc");
    expect(within(toc).getByRole("link", { name: CONNECT_AZURE_SECURELY_SECURITY_HEADING })).toHaveAttribute(
      "href",
      "#security-model",
    );
    expect(within(toc).queryByRole("link", { name: CONNECT_AZURE_SECURELY_PAGE_TITLE })).toBeNull();
  });

  it("shows summary roles, authority pointer, scope guidance, and classification sections", () => {
    if (entry === undefined) {
      throw new Error("Expected cloud-connections-azure documentation entry.");
    }

    render(<HelpConnectAzureSecurelyGuideView entry={entry} />);

    const rolesTable = screen.getByTestId("connect-azure-securely-roles-table");
    expect(within(rolesTable).getByText(formatAzurePermissionRequirementLabel("required"))).toBeInTheDocument();
    expect(within(rolesTable).getByText(formatAzurePermissionRequirementLabel("conditional"))).toBeInTheDocument();
    expect(within(rolesTable).queryByText(/Capabilities enabled/i)).toBeNull();
    expect(screen.getByText(new RegExp(CONNECT_AZURE_SECURELY_PERMISSIONS_AUTHORITY_NOTE))).toBeInTheDocument();
    expect(screen.getByTestId("connect-azure-securely-scope-guidance")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: CONNECT_AZURE_SECURELY_FORBIDDEN_ROLES_HEADING })).toBeInTheDocument();
    expect(screen.getByText(CONNECT_AZURE_SECURELY_FORBIDDEN_ROLES_BODY)).toBeInTheDocument();

    expect(screen.getByRole("heading", { level: 2, name: "Information retained" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Credentials not retained" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Permissions not required" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: "Customer data not collected" })).toBeNull();
    expect(screen.queryByRole("heading", { level: 2, name: "Actions these permissions do not allow" })).toBeNull();

    for (const item of AZURE_CLOUD_CONNECTION_DATA_NOT_COLLECTED) {
      expect(screen.queryByText(item)).toBeNull();
    }

    for (const item of AZURE_CLOUD_CONNECTION_CANNOT_DO) {
      expect(screen.queryByText(item)).toBeNull();
    }
  });

  it("discloses customer-facing verification scope and routes step five to the product validate panel", () => {
    if (entry === undefined) {
      throw new Error("Expected cloud-connections-azure documentation entry.");
    }

    render(<HelpConnectAzureSecurelyGuideView entry={entry} />);

    expect(screen.getByRole("heading", { level: 3, name: CONNECT_AZURE_SECURELY_VERIFICATION_HEADING })).toBeInTheDocument();

    for (const item of CONNECT_AZURE_SECURELY_VERIFICATION_CHECKS) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }

    const doesNotVerify = screen.getByTestId("connect-azure-securely-does-not-verify");

    for (const item of CONNECT_AZURE_SECURELY_VERIFICATION_DOES_NOT_VERIFY) {
      expect(within(doesNotVerify).getByText(item)).toBeInTheDocument();
    }

    expect(within(doesNotVerify).getByText(/Cost Management Reader assignment/i)).toBeInTheDocument();

    // Hub returnHref must still land on the Azure detail validate panel (anchor is not on the hub).
    const verifyHref = buildConnectAzureSecurelyVerifyHref("/integrations/cloud-connections");
    expect(verifyHref).toBe("/integrations/cloud-connections/azure#validate-connection");
    expect(screen.getAllByRole("link", { name: "verify the connection" })[0]).toHaveAttribute("href", verifyHref);
    expect(screen.getByRole("link", { name: CONNECT_AZURE_SECURELY_CONNECTION_STATUS_LINK_LABEL })).toHaveAttribute(
      "href",
      CONNECT_AZURE_SECURELY_CONNECTION_STATUS_HREF,
    );

    for (const link of screen.getAllByRole("link", { name: /verify the connection/i })) {
      expect(link.getAttribute("href")).not.toContain("/help/");
    }
  });

  it("preserves returnTo on verify links and exposes troubleshooting from the header", () => {
    if (entry === undefined) {
      throw new Error("Expected cloud-connections-azure documentation entry.");
    }

    render(<HelpConnectAzureSecurelyGuideView entry={entry} returnHref="/integrations/cloud-connections/azure" />);

    const verifyHref = buildConnectAzureSecurelyVerifyHref("/integrations/cloud-connections/azure");
    expect(screen.getAllByRole("link", { name: "verify the connection" })[0]).toHaveAttribute("href", verifyHref);
    expect(screen.getByRole("link", { name: /Fix a failed permission check/i })).toHaveAttribute("href", "#troubleshoot");
  });

  it("provides workflow navigation actions, diligence links, and troubleshooting in the TOC", () => {
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
    expect(screen.getByTestId("connect-azure-securely-detailed-setup-link")).toHaveAttribute(
      "href",
      "/help/azure-permissions",
    );
    expect(screen.getByTestId("connect-azure-securely-detailed-setup-link")).toHaveTextContent(
      CONNECT_AZURE_SECURELY_DETAILED_SETUP_LINK,
    );
    expect(screen.getAllByRole("link", { name: CONNECT_AZURE_SECURELY_STEP_AZURE_CONNECTION_SETTINGS_LINK })[0]).toHaveAttribute(
      "href",
      "/integrations/cloud-connections/azure",
    );
    expect(screen.queryByRole("button", { name: /contextual help/i })).toBeNull();
    expect(screen.queryByText("Sources for follow-up")).toBeNull();

    const sources = screen.getByTestId("connect-azure-securely-help-sources");

    for (const source of CONNECT_AZURE_SECURELY_SOURCES) {
      expect(within(sources).getByRole("link", { name: source.label })).toHaveAttribute("href", source.href);
    }

    const toc = screen.getByTestId("help-topic-toc");
    expect(within(toc).getByRole("link", { name: AZURE_PERMISSIONS_TROUBLESHOOT_HEADING })).toHaveAttribute(
      "href",
      "#troubleshoot",
    );

    for (const item of AZURE_CLOUD_CONNECTION_TROUBLESHOOTING_ITEMS) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }
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

  it("mentions optional connection only once in the header lead", () => {
    if (entry === undefined) {
      throw new Error("Expected cloud-connections-azure documentation entry.");
    }

    render(<HelpConnectAzureSecurelyGuideView entry={entry} />);

    const leadText = screen.getByText(CONNECT_AZURE_SECURELY_PAGE_LEAD).textContent?.toLowerCase() ?? "";
    const optionalMatches = leadText.match(/optional/g) ?? [];

    expect(optionalMatches).toHaveLength(1);
  });
});

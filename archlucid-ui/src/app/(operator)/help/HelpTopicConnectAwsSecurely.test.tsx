import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpConnectAwsSecurelyGuideView } from "@/app/(operator)/help/_sections/HelpConnectAwsSecurelyGuideView";
import {
  AWS_CLOUD_CONNECTION_TROUBLESHOOTING_ITEMS,
  formatAwsPermissionRequirementLabel,
} from "@/lib/aws-cloud-connection-permissions-manifest";
import { AWS_PERMISSIONS_TROUBLESHOOT_HEADING } from "@/lib/aws-cloud-connection-permissions-copy";
import {
  CONNECT_AWS_SECURELY_BANNED_COPY,
  CONNECT_AWS_SECURELY_CLAIM_DISCIPLINE,
  CONNECT_AWS_SECURELY_SOURCES,
} from "@/lib/connect-aws-securely-help-evidence-copy";
import {
  CONNECT_AWS_SECURELY_CONNECTION_STATUS_HREF,
  CONNECT_AWS_SECURELY_CONNECTION_STATUS_LINK_LABEL,
  CONNECT_AWS_SECURELY_CONFIGURE_ACTION,
  CONNECT_AWS_SECURELY_FORBIDDEN_POLICIES_BODY,
  CONNECT_AWS_SECURELY_PAGE_LEAD,
  CONNECT_AWS_SECURELY_PAGE_TITLE,
  CONNECT_AWS_SECURELY_SECURITY_HEADING,
  CONNECT_AWS_SECURELY_VERIFICATION_CHECKS,
  CONNECT_AWS_SECURELY_VERIFICATION_DOES_NOT_VERIFY,
  CONNECT_AWS_SECURELY_VERIFICATION_HEADING,
  buildConnectAwsSecurelyVerifyHref,
} from "@/lib/connect-aws-securely-help-content";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpConnectAwsSecurelyGuideView", () => {
  const entry = getProductDocumentationEntry("cloud-connections-aws");

  it("registers the connect AWS securely help guide entry with provenance metadata", () => {
    expect(entry?.slug).toBe("cloud-connections-aws");
    expect(entry?.title).toBe(CONNECT_AWS_SECURELY_PAGE_TITLE);
    expect(entry?.lastReviewed).toBe("2026-08-09");
    expect(entry?.releaseApplicability).toBeTruthy();
  });

  it("renders one H1 and starts on-page navigation with Security model", () => {
    if (entry === undefined) {
      throw new Error("Expected cloud-connections-aws documentation entry.");
    }

    render(<HelpConnectAwsSecurelyGuideView entry={entry} />);

    expect(screen.getAllByRole("heading", { level: 1, name: CONNECT_AWS_SECURELY_PAGE_TITLE })).toHaveLength(1);
    expect(screen.queryByRole("heading", { level: 2, name: CONNECT_AWS_SECURELY_PAGE_TITLE })).toBeNull();
    expect(screen.getByText(CONNECT_AWS_SECURELY_PAGE_LEAD)).toBeInTheDocument();

    const toc = screen.getByTestId("help-topic-toc");
    expect(within(toc).getByRole("link", { name: CONNECT_AWS_SECURELY_SECURITY_HEADING })).toHaveAttribute(
      "href",
      "#security-model",
    );
    expect(within(toc).getByRole("link", { name: AWS_PERMISSIONS_TROUBLESHOOT_HEADING })).toHaveAttribute(
      "href",
      "#troubleshoot",
    );
    expect(within(toc).getByRole("link", { name: CONNECT_AWS_SECURELY_VERIFICATION_HEADING })).toHaveAttribute(
      "href",
      "#verification",
    );
    expect(within(toc).queryByRole("link", { name: CONNECT_AWS_SECURELY_PAGE_TITLE })).toBeNull();
  });

  it("shows registry provenance without stub markdown PDF/print chrome", () => {
    if (entry === undefined) {
      throw new Error("Expected cloud-connections-aws documentation entry.");
    }

    render(<HelpConnectAwsSecurelyGuideView entry={entry} />);

    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Guide last reviewed 2026-08-09");
    expect(screen.queryByTestId("help-topic-pdf-download-button")).toBeNull();
    expect(screen.queryByTestId("help-topic-print-button")).toBeNull();
    expect(screen.getByTestId("connect-aws-configure-action")).toBeInTheDocument();
  });

  it("shows evidence orientation strip with claim discipline and Sources links", () => {
    if (entry === undefined) {
      throw new Error("Expected cloud-connections-aws documentation entry.");
    }

    render(<HelpConnectAwsSecurelyGuideView entry={entry} />);

    expect(screen.getByTestId("connect-aws-securely-help-orientation")).toBeInTheDocument();
    expect(screen.getByTestId("connect-aws-securely-help-claim-discipline")).toHaveTextContent(
      CONNECT_AWS_SECURELY_CLAIM_DISCIPLINE,
    );
    expect(screen.getByTestId("connect-aws-securely-help-sources")).toBeInTheDocument();

    const sources = within(screen.getByTestId("connect-aws-securely-help-sources"));

    for (const source of CONNECT_AWS_SECURELY_SOURCES) {
      expect(sources.getByRole("link", { name: source.label })).toHaveAttribute("href", source.href);
    }
  });

  it("shows verification callout, troubleshoot section, and validate deep links", () => {
    if (entry === undefined) {
      throw new Error("Expected cloud-connections-aws documentation entry.");
    }

    render(<HelpConnectAwsSecurelyGuideView entry={entry} />);

    expect(screen.getByRole("heading", { level: 2, name: CONNECT_AWS_SECURELY_VERIFICATION_HEADING })).toBeInTheDocument();

    for (const item of CONNECT_AWS_SECURELY_VERIFICATION_CHECKS) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }

    const doesNotVerify = screen.getByTestId("connect-aws-securely-does-not-verify");

    for (const item of CONNECT_AWS_SECURELY_VERIFICATION_DOES_NOT_VERIFY) {
      expect(within(doesNotVerify).getByText(item)).toBeInTheDocument();
    }

    const verifyHref = buildConnectAwsSecurelyVerifyHref("/integrations/cloud-connections");
    expect(verifyHref).toBe("/integrations/cloud-connections/aws#validate-connection");
    expect(screen.getAllByRole("link", { name: /run Re-poll now/i })[0]).toHaveAttribute("href", verifyHref);
    expect(screen.getByRole("link", { name: CONNECT_AWS_SECURELY_CONNECTION_STATUS_LINK_LABEL })).toHaveAttribute(
      "href",
      CONNECT_AWS_SECURELY_CONNECTION_STATUS_HREF,
    );

    for (const link of screen.getAllByRole("link", { name: /run Re-poll now/i })) {
      expect(link.getAttribute("href")).not.toContain("/help/");
    }

    expect(screen.getByTestId("connect-aws-securely-troubleshoot-section")).toBeInTheDocument();

    for (const item of AWS_CLOUD_CONNECTION_TROUBLESHOOTING_ITEMS) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }

    expect(screen.getByRole("link", { name: /Fix a failed permission check/i })).toHaveAttribute("href", "#troubleshoot");
  });

  it("shows IAM permissions, federation identifiers, and trust-policy template", () => {
    if (entry === undefined) {
      throw new Error("Expected cloud-connections-aws documentation entry.");
    }

    render(<HelpConnectAwsSecurelyGuideView entry={entry} />);

    const permissionsTable = screen.getByTestId("connect-aws-securely-permissions-table");
    expect(within(permissionsTable).getByText("resource-explorer-2:Search")).toBeInTheDocument();
    expect(within(permissionsTable).getByText("AWSResourceExplorerReadOnlyAccess")).toBeInTheDocument();
    expect(within(permissionsTable).getAllByText(formatAwsPermissionRequirementLabel("required"))).toHaveLength(2);
    expect(within(permissionsTable).getByText(formatAwsPermissionRequirementLabel("conditional"))).toBeInTheDocument();
    expect(screen.getByText(CONNECT_AWS_SECURELY_FORBIDDEN_POLICIES_BODY)).toBeInTheDocument();

    expect(screen.getByTestId("connect-aws-securely-federation-identifiers")).toBeInTheDocument();
    expect(screen.getByText("api://AzureADTokenExchange")).toBeInTheDocument();
    const trustPolicyTemplate = screen.getByTestId("connect-aws-securely-trust-policy-template");
    expect(trustPolicyTemplate).toHaveTextContent("sts:AssumeRoleWithWebIdentity");
    expect(trustPolicyTemplate).toHaveTextContent("api://AzureADTokenExchange");
    expect(trustPolicyTemplate).toHaveTextContent("{ArchLucid managed identity object ID}");
    expect(screen.getByTestId("connect-aws-securely-trust-policy-copy")).toBeInTheDocument();
  });

  it("shows separated data classifications", () => {
    if (entry === undefined) {
      throw new Error("Expected cloud-connections-aws documentation entry.");
    }

    render(<HelpConnectAwsSecurelyGuideView entry={entry} />);

    expect(screen.getByRole("heading", { level: 2, name: "Information retained" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Credentials not retained" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Permissions not required" })).toBeInTheDocument();
  });

  it("provides workflow navigation actions", () => {
    if (entry === undefined) {
      throw new Error("Expected cloud-connections-aws documentation entry.");
    }

    render(<HelpConnectAwsSecurelyGuideView entry={entry} returnHref="/integrations/cloud-connections/aws" />);

    expect(screen.getByTestId("connect-aws-back-to-connections")).toHaveAttribute(
      "href",
      "/integrations/cloud-connections/aws",
    );
    expect(screen.getByRole("link", { name: CONNECT_AWS_SECURELY_CONFIGURE_ACTION })).toHaveAttribute(
      "href",
      "/integrations/cloud-connections/aws",
    );
    expect(screen.getByTestId("connect-aws-configure-action-footer")).toHaveAttribute(
      "href",
      "/integrations/cloud-connections/aws",
    );
  });

  it("avoids internal taxonomy and jargon in primary copy", () => {
    if (entry === undefined) {
      throw new Error("Expected cloud-connections-aws documentation entry.");
    }

    render(<HelpConnectAwsSecurelyGuideView entry={entry} />);

    const primary = screen.getByTestId("help-connect-aws-securely-primary");
    const text = primary.textContent?.toLowerCase() ?? "";

    for (const banned of CONNECT_AWS_SECURELY_BANNED_COPY) {
      expect(text).not.toContain(banned.toLowerCase());
    }
  });
});

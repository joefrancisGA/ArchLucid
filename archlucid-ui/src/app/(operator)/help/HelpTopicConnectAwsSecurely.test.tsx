import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpConnectAwsSecurelyGuideView } from "@/app/(operator)/help/_sections/HelpConnectAwsSecurelyGuideView";
import { formatAwsPermissionRequirementLabel } from "@/lib/aws-cloud-connection-permissions-manifest";
import {
  CONNECT_AWS_SECURELY_CLAIM_DISCIPLINE,
  CONNECT_AWS_SECURELY_SOURCES,
} from "@/lib/connect-aws-securely-help-evidence-copy";
import {
  CONNECT_AWS_SECURELY_CONNECTION_VALUE,
  CONNECT_AWS_SECURELY_FORBIDDEN_POLICIES_BODY,
  CONNECT_AWS_SECURELY_PAGE_INTRO,
  CONNECT_AWS_SECURELY_PAGE_TITLE,
  CONNECT_AWS_SECURELY_SECURITY_HEADING,
} from "@/lib/connect-aws-securely-help-content";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

const BANNED_COPY = ["Evidence tier", "hosted pull", "published managed identity", "validation pull"] as const;

describe("HelpConnectAwsSecurelyGuideView", () => {
  const entry = getProductDocumentationEntry("cloud-connections-aws");

  it("registers the connect AWS securely help guide entry", () => {
    expect(entry?.slug).toBe("cloud-connections-aws");
    expect(entry?.title).toBe(CONNECT_AWS_SECURELY_PAGE_TITLE);
  });

  it("renders one H1 and starts on-page navigation with Security model", () => {
    if (entry === undefined) {
      throw new Error("Expected cloud-connections-aws documentation entry.");
    }

    render(<HelpConnectAwsSecurelyGuideView entry={entry} />);

    expect(screen.getAllByRole("heading", { level: 1, name: CONNECT_AWS_SECURELY_PAGE_TITLE })).toHaveLength(1);
    expect(screen.queryByRole("heading", { level: 2, name: CONNECT_AWS_SECURELY_PAGE_TITLE })).toBeNull();
    expect(screen.getByText(CONNECT_AWS_SECURELY_PAGE_INTRO)).toBeInTheDocument();
    expect(screen.getByText(CONNECT_AWS_SECURELY_CONNECTION_VALUE)).toBeInTheDocument();

    const toc = screen.getByTestId("help-topic-toc");
    expect(within(toc).getByRole("link", { name: CONNECT_AWS_SECURELY_SECURITY_HEADING })).toHaveAttribute(
      "href",
      "#security-model",
    );
    expect(within(toc).queryByRole("link", { name: CONNECT_AWS_SECURELY_PAGE_TITLE })).toBeNull();
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

    for (const source of CONNECT_AWS_SECURELY_SOURCES) {
      expect(screen.getByRole("link", { name: source.label })).toHaveAttribute("href", source.href);
    }
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

    expect(screen.getByRole("link", { name: /Back to cloud connections/i })).toHaveAttribute(
      "href",
      "/integrations/cloud-connections/aws",
    );
    expect(screen.getAllByRole("link", { name: "Configure AWS connection" })[0]).toHaveAttribute(
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

    for (const banned of BANNED_COPY) {
      expect(text).not.toContain(banned.toLowerCase());
    }
  });
});

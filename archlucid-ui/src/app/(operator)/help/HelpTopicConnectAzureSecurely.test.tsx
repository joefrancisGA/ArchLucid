import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpConnectAzureSecurelyGuideView } from "@/app/(operator)/help/_sections/HelpConnectAzureSecurelyGuideView";
import {
  AZURE_CLOUD_CONNECTION_CANNOT_DO,
  AZURE_CLOUD_CONNECTION_DATA_NOT_COLLECTED,
  AZURE_CLOUD_CONNECTION_PERMISSIONS_CONTRACT_VERSION,
  AZURE_CLOUD_CONNECTION_VERIFICATION_BEHAVIOR,
  formatAzurePermissionRequirementLabel,
} from "@/lib/azure-cloud-connection-permissions-manifest";
import { AZURE_PERMISSIONS_REVISION_NOTE } from "@/lib/azure-cloud-connection-permissions-copy";
import {
  CONNECT_AZURE_SECURELY_CLAIM_DISCIPLINE,
  CONNECT_AZURE_SECURELY_CONNECTION_VALUE,
  CONNECT_AZURE_SECURELY_COST_OPTIONAL_NOTE,
  CONNECT_AZURE_SECURELY_DATA_NOT_COLLECTED_HEADING,
  CONNECT_AZURE_SECURELY_DETAILED_SETUP_LINK,
  CONNECT_AZURE_SECURELY_FORBIDDEN_ROLES_BODY,
  CONNECT_AZURE_SECURELY_FORBIDDEN_ROLES_HEADING,
  CONNECT_AZURE_SECURELY_PAGE_INTRO,
  CONNECT_AZURE_SECURELY_PAGE_TITLE,
  CONNECT_AZURE_SECURELY_SECURITY_HEADING,
  CONNECT_AZURE_SECURELY_STEP_AZURE_CONNECTION_SETTINGS_LINK,
  CONNECT_AZURE_SECURELY_VERIFICATION_HEADING,
  CONNECT_AZURE_SECURELY_VERIFY_HREF,
  CONNECT_AZURE_SECURELY_VERIFY_STEP_TEXT,
} from "@/lib/connect-azure-securely-help-content";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

const BANNED_COPY = ["Evidence tier", "hosted pull", "published managed identity", "validation pull"] as const;

describe("HelpConnectAzureSecurelyGuideView", () => {
  const entry = getProductDocumentationEntry("cloud-connections-azure");

  it("registers the connect Azure securely help guide entry with provenance metadata", () => {
    expect(entry?.slug).toBe("cloud-connections-azure");
    expect(entry?.title).toBe(CONNECT_AZURE_SECURELY_PAGE_TITLE);
    expect(entry?.lastReviewed).toBe("2026-08-09");
    expect(entry?.releaseApplicability).toContain("V1 GA");
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
    expect(screen.getByTestId("connect-azure-securely-claim-discipline")).toHaveTextContent(
      CONNECT_AZURE_SECURELY_CLAIM_DISCIPLINE,
    );
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Last reviewed 2026-08-09");
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("V1 GA");

    const toc = screen.getByTestId("help-topic-toc");
    expect(within(toc).getByRole("link", { name: CONNECT_AZURE_SECURELY_SECURITY_HEADING })).toHaveAttribute(
      "href",
      "#security-model",
    );
    expect(within(toc).queryByRole("link", { name: CONNECT_AZURE_SECURELY_PAGE_TITLE })).toBeNull();
  });

  it("shows role requirements, contract revision note, scope, and separated data classifications", () => {
    if (entry === undefined) {
      throw new Error("Expected cloud-connections-azure documentation entry.");
    }

    render(<HelpConnectAzureSecurelyGuideView entry={entry} />);

    const rolesTable = screen.getByTestId("connect-azure-securely-roles-table");
    expect(within(rolesTable).getByText(formatAzurePermissionRequirementLabel("required"))).toBeInTheDocument();
    expect(within(rolesTable).getByText(formatAzurePermissionRequirementLabel("conditional"))).toBeInTheDocument();
    expect(
      screen.getByText(AZURE_PERMISSIONS_REVISION_NOTE(AZURE_CLOUD_CONNECTION_PERMISSIONS_CONTRACT_VERSION)),
    ).toBeInTheDocument();
    expect(screen.getByText(CONNECT_AZURE_SECURELY_COST_OPTIONAL_NOTE)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: CONNECT_AZURE_SECURELY_FORBIDDEN_ROLES_HEADING })).toBeInTheDocument();
    expect(screen.getByText(CONNECT_AZURE_SECURELY_FORBIDDEN_ROLES_BODY)).toBeInTheDocument();

    expect(screen.getByRole("heading", { level: 2, name: "Information retained" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Credentials not retained" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Permissions not required" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: CONNECT_AZURE_SECURELY_DATA_NOT_COLLECTED_HEADING }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Actions these permissions do not allow" })).toBeInTheDocument();
    expect(screen.queryByText(/Owner or Contributor privileges/i)).toBeNull();

    for (const item of AZURE_CLOUD_CONNECTION_DATA_NOT_COLLECTED) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }

    for (const item of AZURE_CLOUD_CONNECTION_CANNOT_DO) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }
  });

  it("discloses hosted verification scope and links step five to the verification panel", () => {
    if (entry === undefined) {
      throw new Error("Expected cloud-connections-azure documentation entry.");
    }

    render(<HelpConnectAzureSecurelyGuideView entry={entry} />);

    expect(screen.getByText(CONNECT_AZURE_SECURELY_VERIFICATION_HEADING)).toBeInTheDocument();

    for (const item of AZURE_CLOUD_CONNECTION_VERIFICATION_BEHAVIOR.checks) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }

    const doesNotVerify = screen.getByTestId("connect-azure-securely-does-not-verify");

    for (const item of AZURE_CLOUD_CONNECTION_VERIFICATION_BEHAVIOR.doesNotVerify) {
      expect(within(doesNotVerify).getByText(item)).toBeInTheDocument();
    }

    expect(within(doesNotVerify).getByText(/Cost Management Reader assignment/i)).toBeInTheDocument();

    expect(screen.getByRole("link", { name: CONNECT_AZURE_SECURELY_VERIFY_STEP_TEXT })).toHaveAttribute(
      "href",
      CONNECT_AZURE_SECURELY_VERIFY_HREF,
    );
  });

  it("provides workflow navigation actions without duplicate link labels", () => {
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
    expect(screen.getByRole("link", { name: CONNECT_AZURE_SECURELY_STEP_AZURE_CONNECTION_SETTINGS_LINK })).toHaveAttribute(
      "href",
      "/integrations/cloud-connections/azure",
    );
    expect(screen.queryByRole("button", { name: /contextual help/i })).toBeNull();
    expect(screen.queryByText("Sources for follow-up")).toBeNull();
  });

  it("lists new disclosure sections in the on-page rail", () => {
    if (entry === undefined) {
      throw new Error("Expected cloud-connections-azure documentation entry.");
    }

    render(<HelpConnectAzureSecurelyGuideView entry={entry} />);

    const toc = screen.getByTestId("help-topic-toc");
    expect(within(toc).getByRole("link", { name: CONNECT_AZURE_SECURELY_DATA_NOT_COLLECTED_HEADING })).toHaveAttribute(
      "href",
      "#data-not-collected",
    );
    expect(within(toc).getByRole("link", { name: "Actions these permissions do not allow" })).toHaveAttribute(
      "href",
      "#cannot-do",
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

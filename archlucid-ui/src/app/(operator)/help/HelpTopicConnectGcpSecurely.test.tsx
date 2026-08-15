import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/help/HelpTopicPdfDownloadButton", () => ({
  HelpTopicPdfDownloadButton: () => <div data-testid="help-topic-pdf-download-button" />,
}));

vi.mock("@/components/help/HelpTopicPrintButton", () => ({
  HelpTopicPrintButton: () => <div data-testid="help-topic-print-button" />,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { HelpConnectGcpSecurelyGuideView } from "@/app/(operator)/help/_sections/HelpConnectGcpSecurelyGuideView";
import {
  CONNECT_GCP_SECURELY_CANONICAL_PATH,
  CONNECT_GCP_SECURELY_CLAIM_DISCIPLINE,
  CONNECT_GCP_SECURELY_CONFIGURE_ACTION,
  CONNECT_GCP_SECURELY_SOURCES,
} from "@/lib/connect-gcp-securely-help-evidence-copy";
import {
  CONNECT_GCP_SECURELY_FORBIDDEN_ROLES_BODY,
  CONNECT_GCP_SECURELY_PAGE_LEAD,
  CONNECT_GCP_SECURELY_SECURITY_HEADING,
  CONNECT_GCP_SECURELY_VERIFICATION_CHECKS,
  CONNECT_GCP_SECURELY_VERIFICATION_DOES_NOT_VERIFY,
  CONNECT_GCP_SECURELY_VERIFICATION_HEADING,
} from "@/lib/connect-gcp-securely-help-content";
import { GCP_CLOUD_CONNECTION_BANNED_COPY } from "@/lib/gcp-cloud-connection-copy";
import {
  GCP_CLOUD_CONNECTION_TROUBLESHOOTING_ITEMS,
  formatGcpPermissionRequirementLabel,
} from "@/lib/gcp-cloud-connection-permissions-manifest";
import { GCP_PERMISSIONS_TROUBLESHOOT_HEADING } from "@/lib/gcp-cloud-connection-permissions-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpConnectGcpSecurelyGuideView", () => {
  const entry = getProductDocumentationEntry("cloud-connections-gcp");

  it("registers the connect GCP securely help guide entry with provenance metadata", () => {
    expect(entry?.slug).toBe("cloud-connections-gcp");
    expect(entry?.lastReviewed).toBe("2026-08-09");
    expect(entry?.releaseApplicability).toBeTruthy();
    expect(entry?.releaseApplicability).toContain("GCP Workload Identity Federation");
  });

  it("renders claim discipline, Sources links, and no self-href in Sources", () => {
    if (entry === undefined) {
      throw new Error("Expected cloud-connections-gcp documentation entry.");
    }

    render(<HelpConnectGcpSecurelyGuideView entry={entry} />);

    expect(screen.getByTestId("connect-gcp-securely-help-claim-discipline")).toHaveTextContent(
      CONNECT_GCP_SECURELY_CLAIM_DISCIPLINE,
    );

    const sources = screen.getByTestId("connect-gcp-securely-help-sources");

    for (const link of CONNECT_GCP_SECURELY_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
      expect(link.href).not.toBe(CONNECT_GCP_SECURELY_CANONICAL_PATH);
    }
  });

  it("renders one H1 and starts on-page navigation with Security model", () => {
    if (entry === undefined) {
      throw new Error("Expected cloud-connections-gcp documentation entry.");
    }

    render(<HelpConnectGcpSecurelyGuideView entry={entry} />);

    expect(screen.getAllByRole("heading", { level: 1, name: entry.title })).toHaveLength(1);
    expect(screen.queryByRole("heading", { level: 2, name: entry.title })).toBeNull();
    expect(screen.getByText(CONNECT_GCP_SECURELY_PAGE_LEAD)).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-registry-provenance")).toBeNull();

    const toc = screen.getByTestId("help-topic-toc");
    expect(within(toc).getByRole("link", { name: CONNECT_GCP_SECURELY_SECURITY_HEADING })).toHaveAttribute(
      "href",
      "#security-model",
    );
    expect(within(toc).getByRole("link", { name: CONNECT_GCP_SECURELY_VERIFICATION_HEADING })).toHaveAttribute(
      "href",
      "#verification",
    );
    expect(within(toc).getByRole("link", { name: GCP_PERMISSIONS_TROUBLESHOOT_HEADING })).toHaveAttribute(
      "href",
      "#troubleshoot",
    );
    expect(within(toc).queryByRole("link", { name: entry.title })).toBeNull();
  });

  it("provides sibling guides and workflow navigation actions", () => {
    if (entry === undefined) {
      throw new Error("Expected cloud-connections-gcp documentation entry.");
    }

    render(<HelpConnectGcpSecurelyGuideView entry={entry} />);


    const sources = screen.getByTestId("connect-gcp-securely-help-sources");
    expect(within(sources).getByRole("link", { name: "Connect Azure securely" })).toHaveAttribute(
      "href",
      "/help/cloud-connections/azure",
    );
    expect(within(sources).getByRole("link", { name: "Connect AWS securely" })).toHaveAttribute(
      "href",
      "/help/cloud-connections/aws",
    );

    expect(screen.getAllByRole("link", { name: CONNECT_GCP_SECURELY_CONFIGURE_ACTION })[0]).toHaveAttribute(
      "href",
      "/integrations/cloud-connections/gcp",
    );
    expect(screen.getByTestId("connect-gcp-back-to-connections")).toHaveAttribute(
      "href",
      "/integrations/cloud-connections/gcp",
    );
    expect(screen.getByTestId("connect-gcp-configure-action-footer")).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-pdf-download-button")).toBeNull();
    expect(screen.getByTestId("help-topic-print-button")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
  });

  it("shows roles table, forbidden-roles callout, WIF starter panel, and verification scope", () => {
    if (entry === undefined) {
      throw new Error("Expected cloud-connections-gcp documentation entry.");
    }

    render(<HelpConnectGcpSecurelyGuideView entry={entry} />);

    const rolesTable = screen.getByTestId("connect-gcp-securely-roles-table");
    expect(within(rolesTable).getByText(/Cloud Asset Viewer/i)).toBeInTheDocument();
    expect(within(rolesTable).getByText(/roles\/cloudasset\.viewer/)).toBeInTheDocument();
    expect(within(rolesTable).getByText(/Workload Identity User/i)).toBeInTheDocument();
    expect(within(rolesTable).getByText(/roles\/iam\.workloadIdentityUser/)).toBeInTheDocument();
    expect(within(rolesTable).getAllByText(formatGcpPermissionRequirementLabel("required"))).toHaveLength(2);
    expect(within(rolesTable).getAllByText("No")).toHaveLength(2);

    expect(screen.getByTestId("connect-gcp-securely-prerequisites")).toBeInTheDocument();
    expect(within(screen.getByTestId("connect-gcp-securely-prerequisites")).getByText(/cloudasset\.googleapis\.com/i)).toBeInTheDocument();

    expect(screen.getByTestId("connect-gcp-securely-forbidden-roles-callout")).toBeInTheDocument();
    expect(screen.getByText(CONNECT_GCP_SECURELY_FORBIDDEN_ROLES_BODY)).toBeInTheDocument();

    expect(screen.getByTestId("gcp-wif-starter-panel")).toBeInTheDocument();
    expect(screen.getByTestId("gcp-wif-starter-script-copy")).toBeInTheDocument();
    expect(screen.getByText("api://AzureADTokenExchange")).toBeInTheDocument();
    expect(screen.getByTestId("gcp-wif-starter-identifier-attribute-mapping")).toHaveTextContent(
      /google\.subject=assertion\.sub/i,
    );

    expect(screen.getByTestId("connect-gcp-securely-verification-callout")).toBeInTheDocument();

    for (const item of CONNECT_GCP_SECURELY_VERIFICATION_CHECKS) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }

    const doesNotVerify = screen.getByTestId("connect-gcp-securely-does-not-verify");

    for (const item of CONNECT_GCP_SECURELY_VERIFICATION_DOES_NOT_VERIFY) {
      expect(within(doesNotVerify).getByText(item)).toBeInTheDocument();
    }
  });

  it("preserves returnTo on back and configure links (TB-1243)", () => {
    if (entry === undefined) {
      throw new Error("Expected cloud-connections-gcp documentation entry.");
    }

    render(
      <HelpConnectGcpSecurelyGuideView
        entry={entry}
        returnHref="/integrations/cloud-connections/gcp?step=identity"
      />,
    );

    expect(screen.getByTestId("connect-gcp-back-to-connections")).toHaveAttribute(
      "href",
      "/integrations/cloud-connections/gcp?step=identity",
    );
  });

  it("exposes troubleshooting from the header and lists troubleshooting guidance", () => {
    if (entry === undefined) {
      throw new Error("Expected cloud-connections-gcp documentation entry.");
    }

    render(<HelpConnectGcpSecurelyGuideView entry={entry} />);

    expect(screen.getByRole("link", { name: /Fix a failed permission check/i })).toHaveAttribute("href", "#troubleshoot");

    for (const item of GCP_CLOUD_CONNECTION_TROUBLESHOOTING_ITEMS) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }
  });

  it("shows separated data classifications", () => {
    if (entry === undefined) {
      throw new Error("Expected cloud-connections-gcp documentation entry.");
    }

    render(<HelpConnectGcpSecurelyGuideView entry={entry} />);

    expect(screen.getByRole("heading", { level: 2, name: "Information retained" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Credentials not retained" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Permissions not required" })).toBeInTheDocument();
  });

  it("avoids internal taxonomy and jargon in primary copy", () => {
    if (entry === undefined) {
      throw new Error("Expected cloud-connections-gcp documentation entry.");
    }

    render(<HelpConnectGcpSecurelyGuideView entry={entry} />);

    const primary = screen.getByTestId("help-connect-gcp-securely-primary");
    const text = primary.textContent?.toLowerCase() ?? "";

    for (const banned of GCP_CLOUD_CONNECTION_BANNED_COPY) {
      expect(text).not.toContain(banned.toLowerCase());
    }
  });
});

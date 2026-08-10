import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpConnectGcpSecurelyGuideView } from "@/app/(operator)/help/_sections/HelpConnectGcpSecurelyGuideView";
import {
  CONNECT_GCP_SECURELY_CANONICAL_PATH,
  CONNECT_GCP_SECURELY_CLAIM_DISCIPLINE,
  CONNECT_GCP_SECURELY_CONFIGURE_ACTION,
  CONNECT_GCP_SECURELY_SOURCES,
} from "@/lib/connect-gcp-securely-help-evidence-copy";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpConnectGcpSecurelyGuideView", () => {
  const loaded = tryLoadProductDocumentation("cloud-connections-gcp");

  it("loads connect GCP securely documentation from the monorepo", () => {
    expect(loaded).not.toBeNull();
    expect(loaded?.entry.slug).toBe("cloud-connections-gcp");
  });

  it("renders claim discipline, Sources links, and no self-href in Sources", () => {
    if (loaded === null) {
      throw new Error("Expected cloud-connections-gcp documentation to load.");
    }

    render(<HelpConnectGcpSecurelyGuideView entry={loaded.entry} markdown={loaded.markdown} />);

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
    if (loaded === null) {
      throw new Error("Expected cloud-connections-gcp documentation to load.");
    }

    render(<HelpConnectGcpSecurelyGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getAllByRole("heading", { level: 1, name: loaded.entry.title })).toHaveLength(1);
    expect(screen.queryByRole("heading", { level: 2, name: loaded.entry.title })).toBeNull();

    const toc = screen.getByTestId("help-topic-toc");
    expect(within(toc).getByRole("link", { name: "Security model" })).toHaveAttribute("href", "#security-model");
    expect(within(toc).queryByRole("link", { name: loaded.entry.title })).toBeNull();
  });

  it("provides breadcrumb, sibling guides, and workflow navigation actions", () => {
    if (loaded === null) {
      throw new Error("Expected cloud-connections-gcp documentation to load.");
    }

    render(<HelpConnectGcpSecurelyGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    const breadcrumb = screen.getByTestId("help-connect-gcp-securely-breadcrumb");
    expect(within(breadcrumb).getByRole("link", { name: "Help" })).toHaveAttribute("href", "/help");
    expect(within(breadcrumb).getByRole("link", { name: "Cloud connections" })).toHaveAttribute(
      "href",
      "/help/cloud-connections",
    );

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
    expect(screen.getByTestId("connect-gcp-configure-action-footer")).toBeInTheDocument();
  });

  it("keeps CLI script names and IAM role identifiers behind administrator disclosures", () => {
    if (loaded === null) {
      throw new Error("Expected cloud-connections-gcp documentation to load.");
    }

    const { container } = render(
      <HelpConnectGcpSecurelyGuideView entry={loaded.entry} markdown={loaded.markdown} />,
    );

    const tier1Disclosure = screen.getByText(/Administrator details — Tier 1 package script/i).closest("details");
    const identityDisclosure = screen
      .getByText(/ArchLucid federated identity — values for pool provider binding/i)
      .closest("details");
    const rolesDisclosure = screen.getByText(/Administrator details — IAM role identifiers/i).closest("details");

    expect(tier1Disclosure).not.toBeNull();
    expect(identityDisclosure).not.toBeNull();
    expect(rolesDisclosure).not.toBeNull();
    expect(tier1Disclosure).not.toHaveAttribute("open");
    expect(identityDisclosure).not.toHaveAttribute("open");
    expect(rolesDisclosure).not.toHaveAttribute("open");

    expect(tier1Disclosure?.textContent).toContain("Get-ArchLucidGcpPackage.ps1");
    expect(rolesDisclosure?.textContent).toContain("roles/cloudasset.viewer");

    expect(container.querySelector('a[href="/security-trust"]')).not.toBeNull();
  });
});

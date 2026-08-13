import { render, screen, within } from "@testing-library/react";

import { describe, expect, it, vi } from "vitest";

import { OperatorSecurityTrustPageView } from "./OperatorSecurityTrustPageView";
import { textContainsGitHubBlobOrTreeUrl } from "@/lib/github-blob-url-contains";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import {
  OPERATOR_SECURITY_TRUST_PAGE_HERO_DESCRIPTION,
  OPERATOR_SECURITY_TRUST_PAGE_NAV_HREF,
  OPERATOR_SECURITY_TRUST_PRIMARY_TRUST_CENTER_LABEL,
} from "@/lib/operator/operator-security-trust-page-copy";
import {
  OPERATOR_SECURITY_TRUST_MATURITY_TAG_ROADMAP,
  OPERATOR_SECURITY_TRUST_MATURITY_TAG_UNDER_NDA,
  OPERATOR_SECURITY_TRUST_NDA_REQUEST_LABEL,
  OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_SCOPE_LABEL,
} from "@/lib/operator/operator-security-trust-content";
import {
  TRUST_ASSURANCE_SECURITY_TRUST_ASSURANCE_LINK,
  TRUST_ASSURANCE_SECURITY_TRUST_CENTER_LINK,
  TRUST_ASSURANCE_SECURITY_TRUST_COMPACT_LINE,
} from "@/lib/vocabulary/trust-assurance-security-trust-vocabulary";
import { SECURITY_TRUST_HELP_HUB_COMPACT_LINE, SECURITY_TRUST_HELP_HUB_HELP_LINK } from "@/lib/vocabulary/security-trust-help-hub-vocabulary";
import { SETTINGS_SECURITY_TRUST_PATH } from "@/lib/settings-admin-route-paths";
import { SETTINGS_SECURITY_TRUST_HELP_TOPIC_LABEL } from "@/lib/settings-security-trust-evidence-copy";
import { ROUTE_TITLES } from "@/lib/route-static-titles";
import { resolveNavLinkForPathname } from "@/lib/resolve-nav-link-for-pathname";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";
import { assuranceMaturityBadgeLabel } from "@/lib/security-trust-content";

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    usePathname: () => SETTINGS_SECURITY_TRUST_PATH,
  };
});

vi.mock("@/components/help/HelpTopicPdfDownloadButton", () => ({
  HelpTopicPdfDownloadButton: () => <div data-testid="help-topic-pdf-download-button" />,
}));

describe("OperatorSecurityTrustPageView", () => {
  it("renders procurement-facing sections without GitHub blob links", () => {
    render(<OperatorSecurityTrustPageView />);

    expect(screen.getByText(OPERATOR_SECURITY_TRUST_PAGE_HERO_DESCRIPTION)).toBeInTheDocument();
    expect(screen.queryByText(/Review and evidence trail/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("security-trust-primary-trust-center")).toHaveAttribute("href", "/trust");
    expect(screen.getByText(/SOC 2 Type II readiness and audit engagement planning/i)).toBeInTheDocument();
    expect(screen.queryByText(/Formal SOC 2 Type II audit engagement/i)).not.toBeInTheDocument();
    expect(textContainsGitHubBlobOrTreeUrl(document.body.textContent ?? "")).toBe(false);
  });

  it("does not render vocabulary rails in the primary zone (TB-2302 / TB-2315 placement)", () => {
    render(<OperatorSecurityTrustPageView />);

    expect(screen.queryByTestId("trust-assurance-security-trust-vocabulary")).not.toBeInTheDocument();
    expect(screen.queryByTestId("security-trust-help-hub-vocabulary")).not.toBeInTheDocument();
    expect(screen.queryByText(TRUST_ASSURANCE_SECURITY_TRUST_COMPACT_LINE)).not.toBeInTheDocument();
    expect(screen.queryByText(SECURITY_TRUST_HELP_HUB_COMPACT_LINE)).not.toBeInTheDocument();
    expect(screen.getByTestId("security-trust-primary-trust-center")).toBeInTheDocument();

    const disclosure = screen.getByTestId("security-trust-related-surfaces-disclosure");
    expect(within(disclosure).getByTestId("security-trust-related-surface-trust-center")).toHaveTextContent(
      TRUST_ASSURANCE_SECURITY_TRUST_CENTER_LINK.whenToUse,
    );
    expect(within(disclosure).getByTestId("security-trust-related-surface-assurance-status")).toHaveTextContent(
      TRUST_ASSURANCE_SECURITY_TRUST_ASSURANCE_LINK.whenToUse,
    );
    expect(within(disclosure).getByTestId("security-trust-related-surface-security-trust-help")).toHaveTextContent(
      SECURITY_TRUST_HELP_HUB_HELP_LINK.whenToUse,
    );
  });

  it("renders materials inventory with registry-backed reviewed dates (P0-2)", () => {
    render(<OperatorSecurityTrustPageView />);

    expect(screen.getByTestId("security-trust-materials-table")).toBeInTheDocument();
    expect(screen.getByTestId("security-trust-material-reviewed-subprocessors")).toHaveTextContent("2026-07-25");
    expect(screen.getByTestId("security-trust-material-reviewed-soc2-self-assessment")).toHaveTextContent("2026-05-26");
    expect(screen.getByTestId("security-trust-material-reviewed-dpa-template")).toHaveTextContent("Not recorded");
    expect(screen.getByTestId("security-trust-material-reviewed-caiq-sig-response")).toHaveTextContent("Not recorded");
    expect(screen.getByTestId("security-trust-material-availability-dpa-template")).toHaveTextContent(
      "In-product help topic; PDF publicly available",
    );
    expect(screen.queryByRole("link", { name: /Security policies/i })).not.toBeInTheDocument();
  });

  it("renders soft tenant isolation copy without absolute no-cross-tenant claim (TB-1284)", () => {
    render(<OperatorSecurityTrustPageView />);

    expect(screen.getByRole("heading", { name: "Tenant isolation model" })).toBeInTheDocument();
    expect(screen.getByText(/dedicated database catalog/i)).toBeInTheDocument();
    expect(screen.getByText(/tenant scope that the data layer enforces/i)).toBeInTheDocument();
    expect(screen.getByText(/standard customer path/i)).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_SCOPE_LABEL)).toBeInTheDocument();
    expect(screen.getByTestId("security-trust-tenant-isolation-scope")).toHaveTextContent(
      /not a claim that every staff or platform surface is free of cross-tenant aggregation/i,
    );

    const isolationSection = screen.getByLabelText("Tenant isolation model");
    const visible = (isolationSection.textContent ?? "").toLowerCase();

    expect(visible).not.toContain("no cross-tenant data path");
    expect(within(isolationSection).getByRole("link", { name: /CAIQ \/ SIG pre-fill drafts/i })).toHaveAttribute(
      "href",
      "/help/caiq-sig-response",
    );
    expect(within(isolationSection).getByRole("link", { name: /Audit trail help/i })).toHaveAttribute(
      "href",
      "/help/audit-trail",
    );
  });

  it("renders data retention section with deletion instructions and contractual links", () => {
    render(<OperatorSecurityTrustPageView />);

    const retentionSection = screen.getByLabelText("Data retention");

    expect(within(retentionSection).getByText(/duration of your workspace subscription/i)).toBeInTheDocument();
    expect(within(retentionSection).getByText(/deleted within 90 days/i)).toBeInTheDocument();
    expect(within(retentionSection).getByText(/request workspace data deletion/i)).toBeInTheDocument();
    expect(within(retentionSection).getByRole("link", { name: /DPA template/i })).toHaveAttribute(
      "href",
      "/help/dpa-template",
    );
    expect(within(retentionSection).getByRole("link", { name: /Privacy policy/i })).toHaveAttribute(
      "href",
      "/privacy",
    );
  });

  it("does not use conditional (when available) hedges in NDA section (P0-4)", () => {
    render(<OperatorSecurityTrustPageView />);

    expect(screen.queryByText(/\(when available\)/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Diligence-only assessment summaries are shared under NDA on request/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Redacted penetration-test summaries are released only when approved for distribution/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Use Procurement contact in Available now/i)).not.toBeInTheDocument();
  });

  it("collapses related trust surfaces and badge legend by default", () => {
    render(<OperatorSecurityTrustPageView />);

    const disclosure = screen.getByText("Related trust surfaces");

    expect(disclosure.tagName).toBe("SUMMARY");
    expect(screen.queryByText("Need security review support?")).not.toBeInTheDocument();
  });

  it("uses StatusTag maturity badges with canonical labels and inline meanings (TB-1285 / TB-1286)", () => {
    render(<OperatorSecurityTrustPageView />);

    const page = screen.getByTestId("operator-security-trust-page");

    expect(page.className).toContain("space-y-4");

    expect(screen.getByTestId("security-trust-maturity-Available now")).toHaveTextContent("Available now");
    expect(screen.getByTestId(`security-trust-maturity-${assuranceMaturityBadgeLabel("during_diligence")}`)).toHaveTextContent(
      assuranceMaturityBadgeLabel("during_diligence"),
    );
    expect(screen.getByTestId(`security-trust-maturity-${assuranceMaturityBadgeLabel("planned_next")}`)).toHaveTextContent(
      assuranceMaturityBadgeLabel("planned_next"),
    );

    expect(
      within(screen.getByLabelText("Diligence-only materials")).getByText(
        OPERATOR_SECURITY_TRUST_MATURITY_TAG_UNDER_NDA.legendMeaning,
      ),
    ).toBeVisible();
    expect(
      within(screen.getByLabelText("Planned security maturity")).getByText(
        OPERATOR_SECURITY_TRUST_MATURITY_TAG_ROADMAP.legendMeaning,
      ),
    ).toBeVisible();

    expect(document.querySelector(".rounded-full")).toBeNull();
    expect(document.querySelector('[class*="bg-violet-100"]')).toBeNull();
    expect(document.querySelector('ul[class*="text-sky-950"]')).toBeNull();
    expect(document.querySelector('ul[class*="text-violet-950"]')).toBeNull();
  });

  it("wires section regions with aria-labelledby matching visible headings", () => {
    render(<OperatorSecurityTrustPageView />);

    expect(screen.getByLabelText("Public and procurement-ready materials")).toBeInTheDocument();
    expect(screen.getByLabelText("Tenant isolation model")).toBeInTheDocument();
    expect(screen.getByLabelText("Data retention")).toBeInTheDocument();
    expect(screen.getByLabelText("Diligence-only materials")).toBeInTheDocument();
    expect(screen.getByLabelText("Planned security maturity")).toBeInTheDocument();
  });
});

describe("OperatorSecurityTrustPageView (TB-1223–TB-1227)", () => {
  it("aligns nav href and document title (TB-1223)", () => {
    expect(SETTINGS_SECURITY_TRUST_PATH).toBe(OPERATOR_SECURITY_TRUST_PAGE_NAV_HREF);
    expect(ROUTE_TITLES[SETTINGS_SECURITY_TRUST_PATH]).toBe(OPERATOR_NAV_LINK_LABELS.securityTrust);
    expect(resolveNavLinkForPathname(SETTINGS_SECURITY_TRUST_PATH)?.label).toBe(
      OPERATOR_NAV_LINK_LABELS.securityTrust,
    );

    render(<OperatorSecurityTrustPageView />);

    expect(screen.queryByTestId("operator-security-trust-page-breadcrumb")).toBeNull();
    expect(screen.getByRole("heading", { level: 1, name: OPERATOR_NAV_LINK_LABELS.securityTrust })).toBeInTheDocument();
  });

  it("renders one hero description without LayerHeader triple intro (TB-1224)", () => {
    render(<OperatorSecurityTrustPageView />);

    expect(screen.getByText(OPERATOR_SECURITY_TRUST_PAGE_HERO_DESCRIPTION)).toBeInTheDocument();
    expect(screen.queryByText(/Share procurement-ready security materials, trust-center links/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Security posture is documented through policies, self-assessments, and procurement materials/i),
    ).not.toBeInTheDocument();
  });

  it("exposes PageHeading icon and captioned contextual help (TB-1225)", () => {
    render(<OperatorSecurityTrustPageView />);

    expect(screen.getByTestId("page-heading-icon")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(pageHelpTopicForPathname(SETTINGS_SECURITY_TRUST_PATH)?.label).toBe(
      SETTINGS_SECURITY_TRUST_HELP_TOPIC_LABEL,
    );
  });

  it("elevates Trust Center as the primary CTA with secondary materials inventory (TB-1226)", () => {
    render(<OperatorSecurityTrustPageView />);

    const primary = screen.getByTestId("security-trust-primary-trust-center");

    expect(primary).toHaveAttribute("href", "/trust");
    expect(primary).toHaveTextContent(OPERATOR_SECURITY_TRUST_PRIMARY_TRUST_CENTER_LABEL);

    const materialsTable = screen.getByTestId("security-trust-materials-table");

    expect(within(materialsTable).queryByRole("link", { name: /^Trust Center$/i })).not.toBeInTheDocument();
    expect(within(materialsTable).queryByRole("link", { name: /Security policies/i })).not.toBeInTheDocument();
    expect(within(materialsTable).getByRole("link", { name: /DPA template/i })).toBeInTheDocument();
  });

  it("keeps a single prominent security@ mailto in the default composition (TB-1227)", () => {
    render(<OperatorSecurityTrustPageView />);

    const mailtoLinks = screen.getAllByRole("link").filter((link) => link.getAttribute("href")?.startsWith("mailto:security@"));

    expect(mailtoLinks).toHaveLength(1);
    expect(mailtoLinks[0]).toHaveAccessibleName(OPERATOR_SECURITY_TRUST_NDA_REQUEST_LABEL);
  });
});

import { render, screen, within } from "@testing-library/react";

import { describe, expect, it, vi } from "vitest";



import { OperatorSecurityTrustPageView } from "./OperatorSecurityTrustPageView";

import { textContainsGitHubBlobOrTreeUrl } from "@/lib/github-blob-url-contains";

import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

import {

  OPERATOR_SECURITY_TRUST_BREADCRUMB_ADMINISTRATION_HREF,

  OPERATOR_SECURITY_TRUST_PAGE_HERO_DESCRIPTION,

  OPERATOR_SECURITY_TRUST_PAGE_NAV_HREF,

  OPERATOR_SECURITY_TRUST_PRIMARY_TRUST_CENTER_LABEL,

} from "@/lib/operator-security-trust-page-copy";

import { SETTINGS_SECURITY_TRUST_PATH } from "@/lib/settings-admin-route-paths";

import { ROUTE_TITLES } from "@/lib/route-static-titles";

import { resolveNavLinkForPathname } from "@/lib/resolve-nav-link-for-pathname";

import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";



vi.mock("next/navigation", async (importOriginal) => {

  const actual = await importOriginal<typeof import("next/navigation")>();



  return {

    ...actual,

    usePathname: () => SETTINGS_SECURITY_TRUST_PATH,

  };

});



describe("OperatorSecurityTrustPageView", () => {

  it("renders procurement-facing sections without GitHub blob links", () => {

    render(<OperatorSecurityTrustPageView />);



    expect(screen.getByText(OPERATOR_SECURITY_TRUST_PAGE_HERO_DESCRIPTION)).toBeInTheDocument();

    expect(screen.queryByText(/Review and evidence trail/i)).not.toBeInTheDocument();

    expect(screen.getByTestId("security-trust-primary-trust-center")).toHaveAttribute("href", "/trust");

    expect(screen.getByRole("link", { name: /Procurement contact/i })).toHaveAttribute(

      "href",

      expect.stringContaining("mailto:security@archlucid.net"),

    );

    expect(screen.getByText(/SOC 2 Type II readiness and audit engagement planning/i)).toBeInTheDocument();

    expect(screen.queryByText(/Formal SOC 2 Type II audit engagement/i)).not.toBeInTheDocument();

    expect(textContainsGitHubBlobOrTreeUrl(document.body.textContent ?? "")).toBe(false);

  });



  it("renders soft tenant isolation copy without absolute no-cross-tenant claim (TB-1284)", () => {

    render(<OperatorSecurityTrustPageView />);



    expect(screen.getByRole("heading", { name: "Tenant isolation model" })).toBeInTheDocument();

    expect(screen.getByText(/dedicated database catalog/i)).toBeInTheDocument();

    expect(screen.getByText(/tenant scope that the data layer enforces/i)).toBeInTheDocument();

    expect(screen.getByText(/standard customer path/i)).toBeInTheDocument();



    const isolationSection = screen.getByLabelText("Tenant isolation model");

    const visible = (isolationSection.textContent ?? "").toLowerCase();



    expect(visible).not.toContain("no cross-tenant data path");

    expect(within(isolationSection).getByRole("link", { name: /CAIQ \/ SIG response/i })).toHaveAttribute(

      "href",

      "/help/caiq-sig-response",

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



  it("collapses badge legend by default", () => {

    render(<OperatorSecurityTrustPageView />);



    const legend = screen.getByText("Badge legend");



    expect(legend.tagName).toBe("SUMMARY");

    expect(screen.queryByText("Need security review support?")).not.toBeInTheDocument();

  });



  it("uses StatusTag maturity badges on sections and legend (TB-1285 / TB-1286)", () => {

    render(<OperatorSecurityTrustPageView />);



    const page = screen.getByTestId("operator-security-trust-page");



    expect(page.className).toContain("space-y-4");



    expect(screen.getByTestId("security-trust-maturity-Available now")).toHaveTextContent("Available now");

    expect(screen.getByTestId("security-trust-maturity-Under NDA")).toHaveTextContent("Under NDA");

    expect(screen.getByTestId("security-trust-maturity-Roadmap")).toHaveTextContent("Roadmap");



    expect(screen.getByTestId("security-trust-legend-Available now")).toHaveTextContent("Available now");

    expect(screen.getByTestId("security-trust-legend-Under NDA")).toHaveTextContent("Under NDA");

    expect(screen.getByTestId("security-trust-legend-Roadmap")).toHaveTextContent("Roadmap");



    expect(document.querySelector(".rounded-full")).toBeNull();

    expect(document.querySelector('[class*="bg-violet-100"]')).toBeNull();

  });

});



describe("OperatorSecurityTrustPageView (TB-1223–TB-1227)", () => {

  it("aligns Administration breadcrumb, nav href, and document title (TB-1223)", () => {

    expect(SETTINGS_SECURITY_TRUST_PATH).toBe(OPERATOR_SECURITY_TRUST_PAGE_NAV_HREF);

    expect(ROUTE_TITLES[SETTINGS_SECURITY_TRUST_PATH]).toBe(OPERATOR_NAV_LINK_LABELS.securityTrust);

    expect(resolveNavLinkForPathname(SETTINGS_SECURITY_TRUST_PATH)?.label).toBe(

      OPERATOR_NAV_LINK_LABELS.securityTrust,

    );



    render(<OperatorSecurityTrustPageView />);



    expect(screen.getByTestId("operator-security-trust-page-breadcrumb")).toHaveTextContent("Administration");

    expect(screen.getByTestId("operator-security-trust-page-breadcrumb")).toHaveTextContent(

      OPERATOR_NAV_LINK_LABELS.securityTrust,

    );

    expect(screen.getByRole("link", { name: "Administration" })).toHaveAttribute(

      "href",

      OPERATOR_SECURITY_TRUST_BREADCRUMB_ADMINISTRATION_HREF,

    );

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

      `${OPERATOR_NAV_LINK_LABELS.securityTrust} help`,

    );

  });



  it("elevates Trust Center as the primary CTA with secondary materials list (TB-1226)", () => {

    render(<OperatorSecurityTrustPageView />);



    const primary = screen.getByTestId("security-trust-primary-trust-center");



    expect(primary).toHaveAttribute("href", "/trust");

    expect(primary).toHaveTextContent(OPERATOR_SECURITY_TRUST_PRIMARY_TRUST_CENTER_LABEL);



    const secondaryList = screen.getByTestId("security-trust-secondary-materials-list");



    expect(within(secondaryList).queryByRole("link", { name: /^Trust Center$/i })).not.toBeInTheDocument();

    expect(within(secondaryList).getByRole("link", { name: /Security policies/i })).toBeInTheDocument();

  });



  it("keeps a single prominent security@ mailto in the default composition (TB-1227)", () => {

    render(<OperatorSecurityTrustPageView />);



    const mailtoLinks = screen.getAllByRole("link").filter((link) => link.getAttribute("href")?.startsWith("mailto:security@"));



    expect(mailtoLinks).toHaveLength(1);

    expect(mailtoLinks[0]).toHaveAccessibleName(/Procurement contact/i);

  });

});



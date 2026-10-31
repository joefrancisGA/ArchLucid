import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "security" }),
}));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: (): boolean => false,
  useProductionDeskChrome: (): boolean => true,
}));

vi.mock("@/components/usability/PageContextualHelpButton", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/usability/PageContextualHelpButton")>();

  return {
    ...actual,
    PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
  };
});

vi.mock("@/components/product-line/SecureNowHomeEnvironmentContext", () => ({
  SecureNowHomeEnvironmentContext: () => <div data-testid="securenow-home-environment-context" />,
}));

vi.mock("@/components/product-line/SecureNowHomeWorkSummary", () => ({
  SecureNowHomeWorkSummary: () => <div data-testid="securenow-home-work-summary" />,
}));

import {
  SECURENOW_FINDINGS_PATH,
  SECURENOW_POLICY_PACKS_PATH,
} from "@/lib/governance/governance-route-paths";
import { SECURENOW_EDITION_ENV_NAME } from "@/lib/product-line/resolve-securenow-edition-id";
import { INFRASTRUCTURE_WORKBENCH_ROWS } from "@/lib/governance/governance-infrastructure-copy";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { SECURENOW_COMPLIANCE_HOME_SECTION_HEADING } from "@/lib/product-line/securenow-compliance-home-copy";
import {
  SECURENOW_INFRASTRUCTURE_HOME_ROWS,
  SECURENOW_INFRASTRUCTURE_HOME_SECTION_HEADING,
} from "@/lib/product-line/securenow-infrastructure-home-copy";
import {
  SECURENOW_SPONSOR_HOME_ROWS,
  SECURENOW_SPONSOR_HOME_SECTION_HEADING,
} from "@/lib/product-line/securenow-sponsor-home-copy";
import { SECURENOW_FIRST_HOUR_OPERATOR_PATH } from "@/lib/product-line/securenow-first-hour-home-copy";
import { SECURENOW_RETURN_HOME_ROWS } from "@/lib/product-line/securenow-return-home-copy";
import { InfrastructureOverviewClient } from "./InfrastructureOverviewClient";

describe("InfrastructureOverviewClient SecureNow grouped home sections", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders Home sections in SecureNow sidebar order", () => {
    render(<InfrastructureOverviewClient secureNowHome />);

    expect(screen.getByTestId("governance-infrastructure-overview-page-title")).toHaveTextContent(
      OPERATOR_NAV_LINK_LABELS.home,
    );

    const groupedSections = screen.getByTestId("securenow-grouped-home-sections");
    const sectionTestIds = Array.from(groupedSections.children).map(
      (element) => (element as HTMLElement).dataset.testid,
    );

    expect(sectionTestIds).toEqual([
      "securenow-home-environment-context",
      "securenow-first-hour-home-section",
      "securenow-home-work-summary",
      "securenow-return-home-section",
      "securenow-reviewer-home-section",
      "securenow-sponsor-home-section",
      "securenow-findings-home-section",
      "securenow-infrastructure-home-section",
      "securenow-remediation-home-section",
      "securenow-compliance-home-section",
      "securenow-data-sources-home-section",
    ]);
    expect(screen.getByTestId("securenow-compliance-home-section")).toBeInTheDocument();
    expect(screen.getByTestId("securenow-infrastructure-home-section")).toBeInTheDocument();
    expect(screen.getByTestId("securenow-findings-home-section")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Findings" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Remediation" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Data sources" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: SECURENOW_COMPLIANCE_HOME_SECTION_HEADING })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: SECURENOW_INFRASTRUCTURE_HOME_SECTION_HEADING })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: SECURENOW_SPONSOR_HOME_SECTION_HEADING })).toBeInTheDocument();
    expect(screen.getByTestId(`securenow-compliance-home-link-${SECURENOW_POLICY_PACKS_PATH}`)).toHaveAttribute(
      "href",
      SECURENOW_POLICY_PACKS_PATH,
    );
    expect(screen.getByTestId("securenow-infrastructure-home-link-/infrastructure/resources")).toHaveAttribute(
      "href",
      "/infrastructure/resources",
    );
    expect(screen.getByTestId(`securenow-findings-home-link-${SECURENOW_FINDINGS_PATH}`)).toHaveAttribute(
      "href",
      SECURENOW_FINDINGS_PATH,
    );
    expect(screen.queryByTestId("securenow-findings-home-link-/security/assigned-to-me")).not.toBeInTheDocument();
    expect(screen.getByTestId("securenow-data-sources-home-link-/integrations/cloud-connections")).toBeInTheDocument();
    expect(
      screen.getByTestId(`securenow-sponsor-home-link-${SECURENOW_SPONSOR_HOME_ROWS[0]?.href}`),
    ).toHaveAttribute("href", SECURENOW_SPONSOR_HOME_ROWS[0]?.href);
    expect(
      screen.getByTestId(`securenow-return-home-link-${SECURENOW_RETURN_HOME_ROWS[0]?.href}`),
    ).toHaveAttribute("href", SECURENOW_RETURN_HOME_ROWS[0]?.href);
    expect(
      screen.getByTestId(`securenow-first-hour-home-link-${SECURENOW_FIRST_HOUR_OPERATOR_PATH}`),
    ).toHaveAttribute("href", SECURENOW_FIRST_HOUR_OPERATOR_PATH);
    expect(screen.queryByTestId("securenow-security-home-link-/integrations/jira")).not.toBeInTheDocument();
    expect(screen.queryByTestId("securenow-security-home-link-/integrations/servicenow")).not.toBeInTheDocument();
    expect(screen.queryByTestId("securenow-security-home-link-/integrations/teams")).not.toBeInTheDocument();
    expect(screen.queryByText(/\bAWS\b/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\bGCP\b/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Google Cloud/i)).not.toBeInTheDocument();
  });

  it("uses the short SecureNow lead and does not claim seven destinations", () => {
    vi.stubEnv(SECURENOW_EDITION_ENV_NAME, "generic");

    render(<InfrastructureOverviewClient secureNowHome />);

    const primaryContent = screen.getByTestId("governance-infrastructure-overview-primary-content");

    expect(primaryContent).not.toHaveTextContent(/Findings, environment, remediation, compliance, and data sources are grouped below/i);
    expect(primaryContent).not.toHaveTextContent(/All seven destinations/i);
    expect(screen.getByText(/Review security findings, explore your Azure environment, and verify remediation/i)).toBeInTheDocument();
    expect(screen.getByText(/Advice and inventory evidence on this page are not an official compliance report/i)).toBeInTheDocument();
    expect(primaryContent).not.toHaveTextContent(/Azure inventory evidence workbenches for snapshots/i);
    expect(INFRASTRUCTURE_WORKBENCH_ROWS).toHaveLength(7);
    expect(INFRASTRUCTURE_WORKBENCH_ROWS[0]?.href).toBe("/governance/infrastructure/resources");
    expect(SECURENOW_INFRASTRUCTURE_HOME_ROWS.map((row) => row.href)).toEqual([
      "/infrastructure/resources",
      "/infrastructure/diagrams",
      "/infrastructure/diagram-reconcile",
      "/infrastructure/snapshots-drift",
      "/infrastructure/ask",
      "/infrastructure/terraform",
    ]);

    const infrastructureSection = screen.getByTestId("securenow-infrastructure-home-section");
    const renderedHrefs = Array.from(
      infrastructureSection.querySelectorAll<HTMLAnchorElement>("[data-testid^='securenow-infrastructure-home-link-']"),
    ).map((link) => link.getAttribute("href"));

    expect(renderedHrefs).toEqual(SECURENOW_INFRASTRUCTURE_HOME_ROWS.map((row) => row.href));
    expect(renderedHrefs.at(-1)).toBe("/infrastructure/terraform");
  });

  it("omits SecureNow home claim discipline on the uhg edition", () => {
    vi.stubEnv(SECURENOW_EDITION_ENV_NAME, "uhg");

    render(<InfrastructureOverviewClient secureNowHome />);

    expect(
      screen.queryByText(/Advice and inventory evidence on this page are not an official compliance report/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("governance-infrastructure-overview-claim-discipline")).not.toBeInTheDocument();
  });
});

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { operatorNavOutsideProviderPrincipal } from "@/lib/current-principal";

const mockFetchHealth = vi.fn();
const mockFetchSettings = vi.fn();
const mockCallerAuthorityRank = vi.fn(() => 3);

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => mockCallerAuthorityRank(),
  useOperatorNavAuthority: () => ({
    currentPrincipal: {
      ...operatorNavOutsideProviderPrincipal,
      authorityRank: mockCallerAuthorityRank,
      hasCommittedArchitectureReview: false,
    },
    callerAuthorityRank: mockCallerAuthorityRank,
    isAuthorityLoading: false,
  }),
}));

vi.mock("@/lib/api/itsm-outbound-api", () => ({
  fetchItsmIntegrationHealth: (...args: unknown[]) => mockFetchHealth(...args),
  fetchTenantItsmOutboundSettings: (...args: unknown[]) => mockFetchSettings(...args),
  upsertTenantItsmOutboundSettings: vi.fn(),
}));

import { ItsmProductIntegrationPageClient } from "./ItsmProductIntegrationPageClient";
import {
  ITSM_CONNECTION_TEST_UNAVAILABLE_UNTIL_CONFIGURED,
  ITSM_PRODUCT_PAGE_COPY,
  sanitizeItsmCustomerFacingProbeSummary,
  type ItsmProductId,
} from "@/lib/itsm-product-integration-page-copy";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { ITSM_CONNECTORS_ADMIN_PATH } from "@/lib/itsm-connectors-admin-scope";
import { INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";

const BANNED_PATTERNS = [
  /Integrations:ItsmOutbound/i,
  /host configuration/i,
  /Key Vault materialization/i,
  /tenant SQL/i,
  /vendor probes?/i,
  /smoke checklist/i,
  /single-tenant pilot fallback/i,
  /\bAzure\b/,
];

function baseHealth(product: ItsmProductId) {
  const internalSummary =
    product === "jira"
      ? "Integrations:ItsmOutbound:Jira:CloudBaseUrl is missing from host configuration."
      : "Integrations:ItsmOutbound:ServiceNow:InstanceUrl requires Key Vault materialization.";

  return {
    nativeEnabled: false,
    jira: {
      locallyConfigured: false,
      reachable: null,
      summary: product === "jira" ? internalSummary : "Jira credentials are not configured.",
    },
    serviceNow: {
      locallyConfigured: false,
      reachable: null,
      summary:
        product === "servicenow"
          ? internalSummary
          : "ServiceNow credentials are not configured.",
    },
  };
}

function baseSettings() {
  return {
    nativeEnabled: false,
    deploymentCredentials: {
      jiraConfigured: false,
      serviceNowConfigured: false,
    },
  };
}

describe("ItsmProductIntegrationPageClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCallerAuthorityRank.mockReturnValue(AUTHORITY_RANK.AdminAuthority);
    mockFetchHealth.mockImplementation(async () => baseHealth("jira"));
    mockFetchSettings.mockResolvedValue(baseSettings());
  });

  it.each<ItsmProductId>(["jira", "servicenow"])(
    "renders buyer-safe copy for %s without deployment-operator leakage",
    async (product) => {
      mockFetchHealth.mockResolvedValue(baseHealth(product));

      render(<ItsmProductIntegrationPageClient product={product} />);

      const copy = ITSM_PRODUCT_PAGE_COPY[product];
      expect(await screen.findByRole("heading", { name: copy.pageTitle })).toBeInTheDocument();
      expect(screen.getByText(copy.summary)).toBeInTheDocument();
      expect(screen.getByText(/cloud connections/i)).toBeInTheDocument();
      expect(screen.getByText(copy.connectionTestLead)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: copy.smokeHelpLabel })).toHaveAttribute(
        "href",
        INTEGRATIONS_READINESS_PATH,
      );

      const page = screen.getByTestId(`integrations-${product}-page`);
      const text = page.textContent ?? "";

      for (const pattern of BANNED_PATTERNS) {
        expect(text, `expected no match for ${pattern}`).not.toMatch(pattern);
      }
    },
  );

  it.each<ItsmProductId>(["jira", "servicenow"])(
    "offers admin ITSM configure CTA when %s is not configured (TB-1146)",
    async (product) => {
      mockFetchHealth.mockResolvedValue(baseHealth(product));
      mockCallerAuthorityRank.mockReturnValue(AUTHORITY_RANK.AdminAuthority);

      render(<ItsmProductIntegrationPageClient product={product} />);

      expect(await screen.findByTestId(`integrations-${product}-not-configured-next-step`)).toBeInTheDocument();
      const configureLink = screen.getByTestId(`integrations-${product}-configure-admin-cta`);
      expect(configureLink).toHaveAttribute("href", ITSM_CONNECTORS_ADMIN_PATH);
      expect(configureLink).toHaveTextContent("Configure ITSM connectors");
      await waitFor(() => {
        expect(screen.getByTestId(`integrations-${product}-operator-notes`)).toHaveAttribute("open");
      });
    },
  );

  it.each<ItsmProductId>(["jira", "servicenow"])(
    "offers Integration readiness CTA when %s is not configured for non-admin (TB-1146)",
    async (product) => {
      mockFetchHealth.mockResolvedValue(baseHealth(product));
      mockCallerAuthorityRank.mockReturnValue(AUTHORITY_RANK.ExecuteAuthority);

      render(<ItsmProductIntegrationPageClient product={product} />);

      expect(await screen.findByTestId(`integrations-${product}-not-configured-next-step`)).toBeInTheDocument();
      const readinessLink = screen.getByTestId(`integrations-${product}-readiness-cta`);
      expect(readinessLink).toHaveAttribute("href", INTEGRATIONS_READINESS_PATH);
      expect(screen.queryByTestId(`integrations-${product}-configure-admin-cta`)).not.toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByTestId(`integrations-${product}-operator-notes`)).toHaveAttribute("open");
      });
    },
  );

  it.each<ItsmProductId>(["jira", "servicenow"])(
    "page summary does not claim operators set connection credentials on this route (TB-1147)",
    async (product) => {
      mockFetchHealth.mockResolvedValue(baseHealth(product));

      render(<ItsmProductIntegrationPageClient product={product} />);

      const copy = ITSM_PRODUCT_PAGE_COPY[product];
      expect(await screen.findByText(copy.summary)).toBeInTheDocument();
      expect(copy.summary).not.toMatch(/set connection details/i);
    },
  );

  it.each<ItsmProductId>(["jira", "servicenow"])(
    "does not repeat the not-configured probe summary under Connection test (TB-1148)",
    async (product) => {
      const health = baseHealth(product);
      mockFetchHealth.mockResolvedValue(health);

      render(<ItsmProductIntegrationPageClient product={product} />);

      const probeSummary = sanitizeItsmCustomerFacingProbeSummary(
        product === "jira" ? health.jira.summary : health.serviceNow.summary,
        product,
      );

      expect(await screen.findByText(probeSummary)).toBeInTheDocument();
      expect(screen.getByText(ITSM_CONNECTION_TEST_UNAVAILABLE_UNTIL_CONFIGURED)).toBeInTheDocument();

      const connectionTest = screen.getByTestId(`integrations-${product}-connection-test`);
      expect(connectionTest.textContent ?? "").not.toContain(probeSummary);
    },
  );

  it("shows a distinct connection-test result after Run without duplicating the probe summary (TB-1148)", async () => {
    const health = baseHealth("jira");
    mockFetchHealth.mockResolvedValue(health);

    render(<ItsmProductIntegrationPageClient product="jira" />);

    const probeSummary = sanitizeItsmCustomerFacingProbeSummary(health.jira.summary, "jira");
    expect(await screen.findByText(probeSummary)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Run connection test" }));

    const connectionTest = screen.getByTestId("integrations-jira-connection-test");
    expect(
      await within(connectionTest).findByText(
        /Connection test could not complete — configure Jira credentials in ITSM administration/i,
      ),
    ).toBeInTheDocument();
    expect(connectionTest.textContent ?? "").not.toContain(probeSummary);
  });

  it("hides the not-configured next step when the connector is locally configured", async () => {
    mockFetchHealth.mockResolvedValue({
      nativeEnabled: true,
      jira: { locallyConfigured: true, reachable: true, summary: "ready" },
      serviceNow: { locallyConfigured: false, summary: "skip" },
    });

    render(<ItsmProductIntegrationPageClient product="jira" />);

    expect(await screen.findByTestId("integrations-jira-health")).toBeInTheDocument();
    expect(screen.queryByTestId("integrations-jira-not-configured-next-step")).not.toBeInTheDocument();
    expect(screen.getByTestId("integrations-jira-operator-notes")).not.toHaveAttribute("open");
  });

  it("does not claim not-configured when health load fails (TB-1146)", async () => {
    mockFetchHealth.mockRejectedValue(new Error("network down"));

    render(<ItsmProductIntegrationPageClient product="jira" />);

    expect(await screen.findByRole("alert")).toHaveTextContent(/network down|Could not load/i);
    expect(screen.queryByTestId("integrations-jira-not-configured-next-step")).not.toBeInTheDocument();
  });
});
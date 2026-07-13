import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFetchHealth = vi.fn();
const mockFetchSettings = vi.fn();

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/lib/api/itsm-outbound-api", () => ({
  fetchItsmIntegrationHealth: (...args: unknown[]) => mockFetchHealth(...args),
  fetchTenantItsmOutboundSettings: (...args: unknown[]) => mockFetchSettings(...args),
  upsertTenantItsmOutboundSettings: vi.fn(),
}));

import { ItsmProductIntegrationPageClient } from "./ItsmProductIntegrationPageClient";
import {
  ITSM_PRODUCT_PAGE_COPY,
  type ItsmProductId,
} from "@/lib/itsm-product-integration-page-copy";

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
      expect(screen.getByRole("link", { name: copy.smokeHelpLabel })).toBeInTheDocument();

      const page = screen.getByTestId(`integrations-${product}-page`);
      const text = page.textContent ?? "";

      for (const pattern of BANNED_PATTERNS) {
        expect(text, `expected no match for ${pattern}`).not.toMatch(pattern);
      }
    },
  );
});

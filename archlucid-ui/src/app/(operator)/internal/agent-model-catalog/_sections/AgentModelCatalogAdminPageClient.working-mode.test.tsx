import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { operatorNavOutsideProviderPrincipal } from "@/lib/current-principal";

const nav = vi.hoisted(() => ({ callerAuthorityRank: 3 }));
const fetchAdminAgentModelCatalog = vi.hoisted(() => vi.fn());

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => ({
    currentPrincipal: {
      ...operatorNavOutsideProviderPrincipal,
      authorityRank: nav.callerAuthorityRank,
      hasCommittedArchitectureReview: false,
    },
    callerAuthorityRank: nav.callerAuthorityRank,
    isAuthorityLoading: false,
  }),
}));

vi.mock("@/lib/agent-model-catalog-ops", () => ({
  fetchAdminAgentModelCatalog: (...args: unknown[]) => fetchAdminAgentModelCatalog(...args),
  recordAdminAgentModelCatalogEvaluation: vi.fn(),
  importAdminAgentModelCatalogFaithfulnessHarness: vi.fn(),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import {
  AGENT_MODEL_CATALOG_CLAIM_DISCIPLINE,
  AGENT_MODEL_CATALOG_PRIMARY_CONTENT_ID,
  AGENT_MODEL_CATALOG_SKIP_LINK_LABEL,
} from "@/lib/agent-model-catalog-evidence-copy";
import { AgentModelCatalogAdminPageClient } from "./AgentModelCatalogAdminPageClient";

describe("AgentModelCatalogAdminPageClient working mode", () => {
  beforeEach(() => {
    nav.callerAuthorityRank = 3;
    fetchAdminAgentModelCatalog.mockResolvedValue([
      {
        aliasId: "architect-desk-default",
        providerConnectionKind: "AzureOpenAI",
        deploymentName: "gpt-4o",
        tierBinding: "standard",
        capabilityTags: [],
        approvedTaskTypes: ["ArchitectureReview"],
        structuredOutputLevel: "JsonSchema",
        dataBoundary: "TenantIsolated",
        lifecycleStatus: "Active",
        evaluations: [],
      },
    ]);
  });

  it("renders skip link, claim discipline, breadcrumb, and catalog table", async () => {
    render(<AgentModelCatalogAdminPageClient />);

    expect(screen.getByRole("link", { name: AGENT_MODEL_CATALOG_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${AGENT_MODEL_CATALOG_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("agent-model-catalog-claim-discipline")).toHaveTextContent(
      AGENT_MODEL_CATALOG_CLAIM_DISCIPLINE,
    );
    await waitFor(() => {
      expect(screen.getByTestId("agent-model-catalog-primary-content")).toBeInTheDocument();
    });
    expect(screen.getByTestId("agent-model-catalog-sources")).toBeInTheDocument();
  });
});

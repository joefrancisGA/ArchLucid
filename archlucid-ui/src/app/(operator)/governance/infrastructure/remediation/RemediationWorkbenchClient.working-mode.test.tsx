import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

let searchParams = new URLSearchParams("");

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/security/remediation-instances",
  useSearchParams: () => searchParams,
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "security" }),
}));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: (): boolean => false,
  useProductionDeskChrome: (): boolean => true,
}));

vi.mock("@/hooks/use-infra-evidence-resource-hub-audit-lineage", () => ({
  useInfraEvidenceResourceHubAuditLineage: () => ({ hub: null, loading: false, loadError: null }),
}));

vi.mock("@/hooks/use-operator-relative-freshness-now-ms", () => ({
  useOperatorRelativeFreshnessNowMs: () => Date.now(),
}));

vi.mock("@/lib/infra-evidence/infra-evidence-drift-api", () => ({
  fetchInfraEvidenceSnapshots: vi.fn(async () => ({
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 20,
    hasMore: false,
  })),
  formatInfraEvidenceApiError: (error: unknown) => String(error),
}));

vi.mock("@/lib/infra-evidence/infra-evidence-remediation-api", () => ({
  fetchRemediationInstances: vi.fn(async () => []),
  fetchRemediationFactorySummary: vi.fn(async () => ({
    factoryMetrics: {
      openFindings: 0,
      remediatedThisWeek: 0,
      verificationFailureCount: 0,
      businessBlockedCount: 0,
    },
    openInstancesByStatus: {},
    waves: [],
  })),
  fetchRemediationPrioritizedFindings: vi.fn(async () => []),
  fetchRemediationWaves: vi.fn(async () => []),
  fetchRemediationInstanceDetail: vi.fn(),
  matchOperationalFinding: vi.fn(),
  createRemediationInstance: vi.fn(),
  runRemediationPreflight: vi.fn(),
  approveRemediationInstance: vi.fn(),
  assignRemediationWave: vi.fn(),
  executeRemediationInstance: vi.fn(),
  verifyRemediationInstance: vi.fn(),
  closeRemediationInstance: vi.fn(),
  formatInfraEvidenceRemediationApiError: (error: unknown) => String(error),
}));

vi.mock("@/lib/use-nav-surface", () => ({
  useNavSurface: () => ({
    layerGuidance: null,
    contextHints: { layerHeaderEnterpriseRankCue: null },
  }),
}));

vi.mock("@/components/usability/PageContextualHelpButton", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/usability/PageContextualHelpButton")>();

  return {
    ...actual,
    PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
  };
});

import {
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_CLAIM_DISCIPLINE,
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PRIMARY_CONTENT_ID,
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_SKIP_LINK_LABEL,
} from "@/lib/governance/governance-infrastructure-copy";
import { RemediationWorkbenchClient } from "./RemediationWorkbenchClient";

describe("RemediationWorkbenchClient working mode", () => {
  beforeEach(() => {
    searchParams = new URLSearchParams("");
  });

  it("renders skip link, claim discipline, scope status, shortcuts, and context strip", async () => {
    render(<RemediationWorkbenchClient />);

    expect(screen.getByRole("link", { name: GOVERNANCE_INFRASTRUCTURE_REMEDIATION_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("infra-remediation-claim-discipline")).toHaveTextContent(
      GOVERNANCE_INFRASTRUCTURE_REMEDIATION_CLAIM_DISCIPLINE,
    );
    expect(screen.getByTestId("infra-remediation-scope-status")).toHaveTextContent("Not scoped");
    expect(screen.getByTestId("infra-remediation-page-shortcuts")).toBeInTheDocument();
    expect(screen.getByTestId("remediation-workbench-context-strip")).toBeInTheDocument();
    expect(screen.getByTestId("infra-remediation-refresh-button")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("remediation-workbench-context-freshness")).toBeInTheDocument();
    });
  });
});

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import GovernanceFindingsQueueClient from "@/app/(operator)/governance/findings/GovernanceFindingsQueueClient";
import { OperatorQueryProvider } from "@/components/operator/OperatorQueryProvider";
import * as api from "@/lib/api";
import * as architectureSealDeltaApi from "@/lib/api/architecture-seal-delta-api";
import * as governanceApi from "@/lib/api/governance-stickiness-api";
import {
  SECURENOW_FINDINGS_HELP_PAGE_SUBTITLE,
} from "@/lib/findings/findings-help-guide-content";
import {
  SECURENOW_GOVERNANCE_FINDINGS_CLAIM_DISCIPLINE,
} from "@/lib/product-line/securenow-governance-assigned-to-me-copy";
import {
  SECURENOW_GOVERNANCE_FINDINGS_EMPTY_BODY,
  SECURENOW_GOVERNANCE_FINDINGS_LAYER_GUIDANCE,
  SECURENOW_GOVERNANCE_FINDINGS_PAGE_TITLE,
} from "@/lib/product-line/securenow-governance-findings-copy";
import { resetOperatorQueryClientForTests } from "@/lib/query/operator-query-client";

const searchParamsState = vi.hoisted(() => ({ query: "architectureId=customer-intake" }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/compliance/findings",
  useSearchParams: () => new URLSearchParams(searchParamsState.query),
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "security" }),
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({ isWorkingMode: true, mode: "working" }),
}));

vi.mock("@/lib/api", () => ({
  getRunExplanationSummary: vi.fn().mockResolvedValue({ traces: [] }),
  listRunsByProjectPaged: vi.fn().mockResolvedValue({ items: [{ runId: "run-fallback" }] }),
}));

vi.mock("@/lib/api/architecture-seal-delta-api", () => ({
  getArchitectureSealDelta: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/api/governance-stickiness-api", () => ({
  getArchitectureDecisionRegister: vi.fn().mockResolvedValue({ decisions: [] }),
  getArchitectureRiskRegister: vi.fn().mockResolvedValue({ entries: [] }),
  getGovernancePosture: vi.fn().mockResolvedValue({
    pillars: [],
    reviewIntegrity: {
      criticalCount: 0,
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
      dispositionedCount: 0,
      mutedCount: 0,
    },
    uncategorizedCount: 0,
    primaryPillarKey: null,
    latestSnapshotCreatedUtc: null,
    isDegraded: false,
  }),
  fetchGovernanceFindingsRegistersBundle: vi.fn(async () => ({
    riskRegister: await governanceApi.getArchitectureRiskRegister(),
    decisionRegister: await governanceApi.getArchitectureDecisionRegister(),
  })),
}));

vi.mock("@/lib/buyer/buyer-demo-content-gating", () => ({
  shouldUseGovernanceCuratedDemoSpine: () => false,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => false,
  };
});

vi.mock("@/lib/use-nav-surface", () => ({
  useNavSurface: () => ({
    links: [],
    mutationCapability: false,
    layerGuidance: {
      layerBadge: "Findings",
      headline: "Track architecture risks created from accepted findings, waivers, exceptions, and approval decisions.",
      useWhen: "Start with open risks, expiring exceptions, or risks without owners.",
      firstPilotNote: null,
      enterpriseFootnote: "Each row should trace back to its source review, evidence trail, and finalized review record.",
      omitReviewPackageScopeHelp: true,
    },
    contextHints: {
      enterpriseNavGroupHint: "",
      enterpriseExecutePageHint: null,
      layerHeaderEnterpriseRankCue: null,
      governanceResolutionRank: "",
      alertsInboxRank: "",
      auditLogRank: "",
      alertOperatorToolingRank: "",
      governanceDashboardReaderAction: null,
    },
    callerAuthorityRank: 0,
    showExtended: true,
    showAdvanced: true,
    mounted: true,
  }),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PAGE_HELP_SHORT_TRIGGER_TEXT: "Help",
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/operator/OperatorNavAuthorityProvider")>();

  return {
    ...actual,
    useOperatorNavAuthority: () => ({
      currentPrincipal: {
        name: "Jordan Lee",
        roleClaimValues: [],
        authorityRank: 2,
        primaryAppRole: "Architect",
        hasCommittedArchitectureReview: true,
      },
      callerAuthorityRank: 2,
      isAuthorityLoading: false,
    }),
    useNavCallerAuthorityRank: () => 2,
  };
});

vi.mock("@/components/usability/ItsmOutboundQuickActions", () => ({
  ItsmOutboundQuickActions: () => null,
}));

const pathInspectFindingIdRef = vi.hoisted(() => ({ current: null as string | null }));

vi.mock("@/components/security/SecurityEvidencePathInspectPanel", () => ({
  SecurityEvidencePathInspectPanel: (props: {
    findingId: string | null;
    panelRef?: React.Ref<HTMLElement>;
  }) => {
    pathInspectFindingIdRef.current = props.findingId;

    return (
      <section
        ref={props.panelRef}
        tabIndex={-1}
        data-testid="security-evidence-path-inspect-panel"
      />
    );
  },
}));

/** SN-FQ-04 — 2026-09-24 screenshot regression: Security must not render architecture desk copy. */
const SN_FQ_04_FORBIDDEN_DESK_COPY: readonly string[] = [
  "Afternoon document for this architecture",
  "You inhabit this architecture on the desk",
  "Open architecture desk",
  "live Working recovery",
  "Insight density demotes low-signal engines",
  "Could not load changes since last seal",
  "Track architecture risks",
  "approved architecture reviews",
];

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe(): void {}

    unobserve(): void {}

    disconnect(): void {}
  } as unknown as typeof ResizeObserver;
});

const complianceQueueRiskRow = {
  runId: "run-compliance-1",
  runLabel: "Intake review",
  manifestId: "manifest-1",
  findingId: "finding-compliance-1",
  title: "Public storage exposure",
  severity: "High",
  category: "Network",
  statusLabel: "Open",
  ownerUserId: "owner@contoso.com",
  latestDisposition: null,
  agingDays: 2,
  waiverExpiresAtUtc: null,
  lastReviewedUtc: null,
  revisitDueUtc: "2026-09-01T00:00:00.000Z",
  isStale: false,
  evidenceHref: "/graph?runId=run-compliance-1",
  humanReviewStatus: null,
  itsmLinkedTicketsSummary: null,
  systemName: "Intake",
  resourceId: "storage-1",
};

describe("GovernanceFindingsQueueClient SecureNow /compliance/findings working mode", () => {
  beforeEach(() => {
    searchParamsState.query = "architectureId=customer-intake";
    pathInspectFindingIdRef.current = null;
    resetOperatorQueryClientForTests();
    vi.mocked(governanceApi.getArchitectureRiskRegister).mockResolvedValue({ entries: [] });
    vi.mocked(governanceApi.getArchitectureDecisionRegister).mockResolvedValue({ decisions: [] });
  });

  it("SN-FQ-04: locks SecureNow findings queue against architecture desk chrome", async () => {
    render(
      <OperatorQueryProvider>
        <GovernanceFindingsQueueClient />
      </OperatorQueryProvider>,
    );

    const pageTitle = await screen.findByTestId("architecture-risk-register-page-title");

    expect(pageTitle).toHaveTextContent(SECURENOW_GOVERNANCE_FINDINGS_PAGE_TITLE);
    expect(pageTitle).not.toHaveTextContent(/^Architecture$/i);
    expect(screen.getByText(SECURENOW_FINDINGS_HELP_PAGE_SUBTITLE)).toBeInTheDocument();
    const visibleText = document.body.textContent ?? "";

    for (const forbidden of SN_FQ_04_FORBIDDEN_DESK_COPY) {
      expect(visibleText).not.toContain(forbidden);
    }
    expect(screen.getByTestId("governance-findings-claim-discipline")).toHaveTextContent(
      SECURENOW_GOVERNANCE_FINDINGS_CLAIM_DISCIPLINE,
    );
    expect(screen.getByText(SECURENOW_GOVERNANCE_FINDINGS_LAYER_GUIDANCE.headline)).toBeInTheDocument();
    expect(screen.queryByTestId("inhabited-findings-document-chrome")).not.toBeInTheDocument();
    expect(screen.queryByTestId("inhabited-findings-live-recovery")).not.toBeInTheDocument();
    expect(screen.queryByText(/open architecture desk/i)).not.toBeInTheDocument();
    expect(await screen.findByTestId("governance-findings-empty-state")).toHaveTextContent(
      SECURENOW_GOVERNANCE_FINDINGS_EMPTY_BODY,
    );
    await waitFor(() => {
      expect(api.listRunsByProjectPaged).not.toHaveBeenCalled();
      expect(api.getRunExplanationSummary).not.toHaveBeenCalled();
      expect(architectureSealDeltaApi.getArchitectureSealDelta).not.toHaveBeenCalled();
    });
  });

  it("renders path inspect on the SecureNow findings queue", async () => {
    vi.mocked(governanceApi.getArchitectureRiskRegister).mockResolvedValue({
      entries: [complianceQueueRiskRow],
    });

    render(
      <OperatorQueryProvider>
        <GovernanceFindingsQueueClient />
      </OperatorQueryProvider>,
    );

    expect(await screen.findByTestId("security-evidence-path-inspect-panel")).toBeInTheDocument();
    expect(pathInspectFindingIdRef.current).toBeNull();
  });

  it("focuses path inspect on Alt+I", async () => {
    vi.mocked(governanceApi.getArchitectureRiskRegister).mockResolvedValue({
      entries: [complianceQueueRiskRow],
    });

    render(
      <OperatorQueryProvider>
        <GovernanceFindingsQueueClient />
      </OperatorQueryProvider>,
    );

    const panel = await screen.findByTestId("security-evidence-path-inspect-panel");
    fireEvent.keyDown(document, { key: "i", altKey: true, code: "KeyI" });

    expect(panel).toHaveFocus();
  });

  it("loads path inspect when findingId is on the compliance findings URL", async () => {
    searchParamsState.query = "architectureId=customer-intake&findingId=finding-compliance-1";
    vi.mocked(governanceApi.getArchitectureRiskRegister).mockResolvedValue({
      entries: [complianceQueueRiskRow],
    });

    render(
      <OperatorQueryProvider>
        <GovernanceFindingsQueueClient />
      </OperatorQueryProvider>,
    );

    expect(await screen.findByTestId("security-evidence-path-inspect-panel")).toBeInTheDocument();
    await waitFor(() => {
      expect(pathInspectFindingIdRef.current).toBe("finding-compliance-1");
    });
  });

  it("renders context strip, refresh control, and keyboard affordance without posture during load failure", async () => {
    vi.mocked(governanceApi.getArchitectureRiskRegister).mockRejectedValue(new Error("network"));

    render(
      <OperatorQueryProvider>
        <GovernanceFindingsQueueClient />
      </OperatorQueryProvider>,
    );

    expect(await screen.findByTestId("governance-findings-queue-context-strip")).toBeInTheDocument();
    expect(screen.getByTestId("governance-findings-queue-refresh-button")).toBeInTheDocument();
    expect(screen.getByTestId("governance-findings-queue-keyboard-affordance")).toHaveTextContent(/page help/i);
    expect(await screen.findByTestId("governance-findings-load-failed")).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-posture-pillar-overview")).not.toBeInTheDocument();
  });
});

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  const searchParams = new URLSearchParams();
  const routerPushMock = vi.fn();
  const routerReplaceMock = vi.fn();
  return {
    ...actual,
    usePathname: () => "/architecture/reviews/run-1",
    useSearchParams: () => searchParams,
    useRouter: (): { push: (path: string) => void; replace: (path: string) => void } => ({
      push: routerPushMock,
      replace: routerReplaceMock,
    }),
    __routerPushMock: routerPushMock,
    redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

vi.mock("@/lib/operator/operator-query-invalidation", () => ({
  invalidateOperatorHomeRunsCaches: vi.fn().mockResolvedValue(undefined),
}));

const pulseOidcSessionKeepaliveMock = vi.hoisted(() => vi.fn(async () => undefined));
const useOidcSessionKeepaliveMock = vi.hoisted(() => vi.fn());
const invalidateTenantTrialStatusCacheMock = vi.hoisted(() => vi.fn(async () => undefined));
const simulatePreCommitSyntheticFindingsMock = vi.hoisted(() => vi.fn(async () => undefined));
const commitArchitectureRunWith401ResumeMock = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/use-oidc-session-keepalive", () => ({
  pulseOidcSessionKeepalive: pulseOidcSessionKeepaliveMock,
  useOidcSessionKeepalive: useOidcSessionKeepaliveMock,
}));

vi.mock("@/lib/api/pre-finalize-synthetic-simulation-api", () => ({
  simulatePreCommitSyntheticFindings: (...args: unknown[]) =>
    simulatePreCommitSyntheticFindingsMock(...args),
}));

vi.mock("@/lib/auth/livelihood-mutation-401-resume-wrappers", () => ({
  commitArchitectureRunWith401Resume: (...args: unknown[]) =>
    commitArchitectureRunWith401ResumeMock(...args),
}));

vi.mock("@/lib/tenant-trial-status-client", () => ({
  invalidateTenantTrialStatusCache: invalidateTenantTrialStatusCacheMock,
}));

vi.mock("@/lib/architecture/architecture-draft-registry-finalize-sync", () => ({
  syncArchitectureDraftRegistryForFinalizedReview: vi.fn(),
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({ isWorkingMode: true, mode: "working" }),
}));

vi.mock("@/components/governance/GovernanceRecordCorrectionDialog", () => ({
  GovernanceRecordCorrectionDialog: () => null,
}));

vi.mock("@/lib/api", () => ({
  getRunSummary: vi.fn(),
}));

import { getRunSummary } from "@/lib/api";
import { syncArchitectureDraftRegistryForFinalizedReview } from "@/lib/architecture/architecture-draft-registry-finalize-sync";
import { ApiRequestError } from "@/lib/api-request-error";
import { invalidateOperatorHomeRunsCaches } from "@/lib/operator/operator-query-invalidation";

import { CommitRunButton } from "./CommitRunButton";

const mockCommit = commitArchitectureRunWith401ResumeMock;
const mockGetRunSummary = vi.mocked(getRunSummary);
const mockInvalidateHomeRuns = vi.mocked(invalidateOperatorHomeRunsCaches);
const mockInvalidateTrialStatus = invalidateTenantTrialStatusCacheMock;
const mockSyncDraftRegistry = vi.mocked(syncArchitectureDraftRegistryForFinalizedReview);

describe("CommitRunButton", () => {
  beforeEach(() => {
    mockCommit.mockReset();
    simulatePreCommitSyntheticFindingsMock.mockReset();
    simulatePreCommitSyntheticFindingsMock.mockResolvedValue(undefined);
  });

  it("renders disabled message when already finalized", () => {
    render(<CommitRunButton runId="abc" disabled />);

    expect(screen.getByText(/already finalized/i)).toBeInTheDocument();
  });

  it("renders commit-blocked coverage message without primary finalize control", () => {
    render(
      <CommitRunButton
        runId="abc"
        disabled={false}
        commitBlockedReason="Finding coverage is commit-blocking. Failed engines: Security."
      />,
    );

    expect(screen.getByTestId("commit-blocked-finding-coverage")).toHaveTextContent("Security");
    expect(screen.queryByRole("button", { name: /^finalize review$/i })).not.toBeInTheDocument();
  });

  it("renders structured readiness blocks without primary finalize control", () => {
    render(
      <CommitRunButton
        runId="abc"
        disabled={false}
        commitBlockedReason="Commit blocked."
        commitBlockedBlocks={[
          {
            layer: "governance",
            code: "pre_commit_gate",
            message: "Policy pack thresholds would block finalize.",
          },
        ]}
      />,
    );

    expect(screen.getByTestId("finalize-readiness-block-pre_commit_gate")).toHaveTextContent(
      "Policy pack thresholds would block finalize.",
    );
    expect(screen.queryByRole("button", { name: /^finalize review$/i })).not.toBeInTheDocument();
  });

  it("surfaces finalize tooltip on the primary control", () => {
    render(<CommitRunButton runId="x" disabled={false} />);

    expect(screen.getByRole("button", { name: /^finalize review$/i })).toHaveAttribute(
      "title",
      "Replay and comparison remain available after finalizing.",
    );
  });

  it("opens confirm dialog and calls commit on confirm", async () => {
    mockCommit.mockResolvedValue({});
    mockGetRunSummary.mockResolvedValue({ findingCount: 4 } as Awaited<ReturnType<typeof getRunSummary>>);

    render(<CommitRunButton runId="run-1" disabled={false} />);

    fireEvent.click(screen.getByRole("button", { name: /^finalize review$/i }));

    const dialog = await screen.findByRole("alertdialog");

    fireEvent.click(within(dialog).getByRole("button", { name: /^finalize review$/i }));

    await waitFor(() => {
      expect(mockCommit).toHaveBeenCalledWith(
        "run-1",
        {
          notifySponsor: false,
          acknowledgedAssumptionIds: [],
        },
        expect.objectContaining({
          returnPath: "/architecture/reviews/run-1",
          idempotencyKey: expect.any(String),
        }),
      );
    });

    expect(pulseOidcSessionKeepaliveMock).toHaveBeenCalled();

    await waitFor(() => {
      expect(mockSyncDraftRegistry).toHaveBeenCalledWith("run-1");
      expect(mockInvalidateHomeRuns).toHaveBeenCalled();
      expect(mockInvalidateTrialStatus).toHaveBeenCalled();
    });

    expect(await screen.findByText(/decisions are now searchable in Ask/i)).toBeInTheDocument();
    expect(screen.getByTestId("commit-run-finalize-record-correction")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ask memory guide/i })).toHaveAttribute(
      "href",
      "/help/prior-manifest-retrieval",
    );
  });

  it("passes notifySponsor when the email checkbox is checked", async () => {
    mockCommit.mockResolvedValue({});

    render(<CommitRunButton runId="run-2" disabled={false} />);

    fireEvent.click(screen.getByRole("button", { name: /^finalize review$/i }));

    const dialog = await screen.findByRole("alertdialog");

    fireEvent.click(within(dialog).getByRole("checkbox", { name: /email tenant admin contact/i }));

    fireEvent.click(within(dialog).getByRole("button", { name: /^finalize review$/i }));

    await waitFor(() => {
      expect(mockCommit).toHaveBeenCalledWith(
        "run-2",
        {
          notifySponsor: true,
          acknowledgedAssumptionIds: [],
        },
        expect.objectContaining({
          returnPath: "/architecture/reviews/run-1",
          idempotencyKey: expect.any(String),
        }),
      );
    });
  });

  it("surfaces structured pre-commit governance block when finalize returns 409", async () => {
    mockCommit.mockRejectedValue(
      new ApiRequestError("Commit blocked by governance policy.", {
        httpStatus: 409,
        correlationId: "cid-409-structured",
        problem: {
          title: "Conflict",
          detail: "Commit blocked by governance policy.",
          errorCode: "GOVERNANCE_PRE_COMMIT_BLOCKED",
          blockingFindingIds: ["finding-blocked"],
          policyPackId: "sec-baseline",
          minimumBlockingSeverity: 3,
          blockExplanation: "Add a private endpoint before finalizing.",
        },
      }),
    );

    render(<CommitRunButton runId="run-blocked-structured" disabled={false} />);

    fireEvent.click(screen.getByRole("button", { name: /^finalize review$/i }));

    const dialog = await screen.findByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /^finalize review$/i }));

    const panel = await screen.findByTestId("pre-commit-governance-block-panel");
    expect(panel).toHaveTextContent(/approval bypass/i);
    expect(screen.getByTestId("pre-commit-governance-block-finding-link-finding-blocked")).toHaveAttribute(
      "href",
      "/architecture/reviews/run-blocked-structured/findings/finding-blocked",
    );
    expect(screen.getByTestId("pre-commit-governance-block-explanation")).toHaveTextContent(
      "Add a private endpoint before finalizing.",
    );
  });

  it("surfaces sealed-manifest blockedReason when finalize returns 409 without governance block", async () => {
    mockCommit.mockRejectedValue(
      new ApiRequestError("Conflict", {
        httpStatus: 409,
        correlationId: "cid-sealed-finalize-409",
        problem: {
          title: "Conflict",
          status: 409,
          detail: "Run 'run-sealed' authority lifecycle must be Complete before finalize.",
        },
      }),
    );

    render(<CommitRunButton runId="run-sealed" disabled={false} />);

    fireEvent.click(screen.getByRole("button", { name: /^finalize review$/i }));

    const dialog = await screen.findByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /^finalize review$/i }));

    expect(
      await screen.findByText("Run 'run-sealed' authority lifecycle must be Complete before finalize."),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("commit-governance-block-explanation")).not.toBeInTheDocument();
    expect(screen.queryByTestId("pre-commit-governance-block-panel")).not.toBeInTheDocument();
  });

  it("surfaces governance blockExplanation when finalize returns 409", async () => {
    mockCommit.mockRejectedValue(
      new ApiRequestError("Commit blocked by governance policy.", {
        httpStatus: 409,
        correlationId: "cid-409",
        problem: {
          title: "Conflict",
          detail: "Commit blocked by governance policy.",
          blockExplanation: "Add a private endpoint before finalizing.",
        },
      }),
    );

    render(<CommitRunButton runId="run-blocked" disabled={false} />);

    fireEvent.click(screen.getByRole("button", { name: /^finalize review$/i }));

    const dialog = await screen.findByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /^finalize review$/i }));

    const explanation = await screen.findByTestId("commit-governance-block-explanation");
    expect(explanation).toHaveTextContent(/AI-assisted/i);
    expect(explanation).toHaveTextContent(
      "Add a private endpoint before finalizing.",
    );
  });
  it("shows finalize consequence preview in the confirm dialog (TB-2224)", async () => {
    render(<CommitRunButton runId="run-1" disabled={false} />);

    fireEvent.click(screen.getByRole("button", { name: /^finalize review$/i }));

    const dialog = await screen.findByRole("alertdialog");

    expect(within(dialog).getByTestId("finalize-consequence-preview")).toBeInTheDocument();
    expect(within(dialog).getByTestId("finalize-consequence-preview-locks")).toBeInTheDocument();
    expect(within(dialog).getAllByText(/finalized review record/i).length).toBeGreaterThan(0);
    expect(within(dialog).queryByText(/decision engine/i)).not.toBeInTheDocument();
  });
});

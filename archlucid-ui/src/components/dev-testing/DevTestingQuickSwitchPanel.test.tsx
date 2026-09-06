import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import { DevTestingQuickSwitchPanel } from "@/components/dev-testing/DevTestingQuickSwitchPanel";
import {
  DEV_AGENT_EXECUTION_MODE_COOKIE,
  DEV_ROLE_OVERRIDE_COOKIE,
  DEV_SHELL_EXPERIENCE_COOKIE,
  reloadAfterDevTestingOverrideChange,
} from "@/lib/dev-testing-overrides";

vi.mock("@/lib/dev-testing-overrides", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/dev-testing-overrides")>();

  return {
    ...actual,
    reloadAfterDevTestingOverrideChange: vi.fn(),
  };
});

vi.mock("@/lib/load-dev-testing-quick-jump-snapshot", () => ({
  DEV_TESTING_QUICK_JUMP_MAX_ITEMS: 8,
  DEV_TESTING_QUICK_JUMP_MANIFEST_PROBE_RUNS: 4,
  DEV_TESTING_QUICK_JUMP_ARTIFACT_PROBE_MANIFESTS: 2,
  buildEmptyDevTestingQuickJumpSnapshot: (runIds: readonly string[]) => ({
    plans: [],
    runs: runIds.map((runId) => ({ runId })),
    approvalRequests: [],
    manifests: [],
    artifacts: [],
  }),
  loadDevTestingQuickJumpSnapshot: vi.fn(async () => ({
    plans: [],
    runs: [],
    approvalRequests: [],
    manifests: [],
    artifacts: [],
  })),
}));

import { loadDevTestingQuickJumpSnapshot } from "@/lib/load-dev-testing-quick-jump-snapshot";

describe("DevTestingQuickSwitchPanel", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
    vi.mocked(loadDevTestingQuickJumpSnapshot).mockResolvedValue({
      plans: [{ planId: "11111111-aaaa-bbbb-cccc-dddddddddddd" }],
      runs: [{ runId: "22222222-aaaa-bbbb-cccc-dddddddddddd" }],
      approvalRequests: [{ approvalRequestId: "33333333-aaaa-bbbb-cccc-dddddddddddd" }],
      manifests: [{ manifestId: "44444444-aaaa-bbbb-cccc-dddddddddddd" }],
      artifacts: [
        {
          manifestId: "44444444-aaaa-bbbb-cccc-dddddddddddd",
          artifactId: "55555555-aaaa-bbbb-cccc-dddddddddddd",
        },
      ],
    });
  });

  afterEach(() => {
    document.cookie = `${DEV_SHELL_EXPERIENCE_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
    document.cookie = `${DEV_ROLE_OVERRIDE_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
    document.cookie = `${DEV_AGENT_EXECUTION_MODE_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
    vi.mocked(reloadAfterDevTestingOverrideChange).mockClear();
    vi.mocked(loadDevTestingQuickJumpSnapshot).mockReset();
  });

  it("renders shell and role override controls inside a collapsed disclosure in development", async () => {
    render(<DevTestingQuickSwitchPanel />);

    const panel = await screen.findByTestId("dev-testing-quick-switch");
    expect(panel).toBeInTheDocument();
    expect(panel).not.toHaveAttribute("open");

    fireEvent.click(screen.getByText("Dev testing quick switch"));

    expect(await screen.findByTestId("dev-shell-option-buyer-polished")).toBeInTheDocument();
    expect(screen.getByTestId("dev-role-option-Employee")).toBeInTheDocument();
    expect(screen.getByTestId("dev-role-option-Reader")).toBeInTheDocument();
    expect(screen.getByTestId("dev-agent-execution-option-real")).toBeInTheDocument();
    expect(screen.getByTestId("dev-agent-execution-option-simulator")).toBeInTheDocument();
    expect(screen.getByTestId("dev-reset-database-button")).toBeInTheDocument();
  });

  it("persists a shell override and reloads", async () => {
    render(<DevTestingQuickSwitchPanel />);

    await screen.findByTestId("dev-testing-quick-switch");
    fireEvent.click(screen.getByTestId("dev-shell-option-full-operator"));

    expect(reloadAfterDevTestingOverrideChange).toHaveBeenCalledTimes(1);
  });

  it("persists a simulator execution override and reloads", async () => {
    render(<DevTestingQuickSwitchPanel />);

    await screen.findByTestId("dev-testing-quick-switch");
    fireEvent.click(screen.getByTestId("dev-agent-execution-option-simulator"));

    expect(reloadAfterDevTestingOverrideChange).toHaveBeenCalledTimes(1);
  });

  it("renders quick-jump link chips for each entity cluster", async () => {
    render(<DevTestingQuickSwitchPanel runIds={["22222222-aaaa-bbbb-cccc-dddddddddddd"]} />);

    fireEvent.click(screen.getByText("Dev testing quick switch"));

    expect(await screen.findByTestId("dev-testing-quick-jump-links")).toBeInTheDocument();

    await waitFor(() => {
      expect(loadDevTestingQuickJumpSnapshot).toHaveBeenCalledWith(["22222222-aaaa-bbbb-cccc-dddddddddddd"]);
    });

    const planLink = await screen.findByTestId("dev-quick-jump-plan-11111111-aaaa-bbbb-cccc-dddddddddddd");
    const runLink = screen.getByTestId("dev-quick-jump-run-22222222-aaaa-bbbb-cccc-dddddddddddd");
    const approvalLink = screen.getByTestId("dev-quick-jump-approval-33333333-aaaa-bbbb-cccc-dddddddddddd");
    const manifestLink = screen.getByTestId("dev-quick-jump-manifest-44444444-aaaa-bbbb-cccc-dddddddddddd");
    const artifactLink = screen.getByTestId("dev-quick-jump-artifact-55555555-aaaa-bbbb-cccc-dddddddddddd");

    expect(planLink).toHaveAttribute("href", "/insights/improvement-planning/plans/11111111-aaaa-bbbb-cccc-dddddddddddd");
    expect(runLink).toHaveAttribute("href", "/architecture/reviews/22222222-aaaa-bbbb-cccc-dddddddddddd");
    expect(approvalLink).toHaveAttribute(
      "href",
      "/governance/approval-requests/33333333-aaaa-bbbb-cccc-dddddddddddd/lineage",
    );
    expect(manifestLink).toHaveAttribute("href", "/governance/sealed-records/44444444-aaaa-bbbb-cccc-dddddddddddd");
    expect(artifactLink).toHaveAttribute(
      "href",
      "/governance/sealed-records/44444444-aaaa-bbbb-cccc-dddddddddddd/artifacts/55555555-aaaa-bbbb-cccc-dddddddddddd",
    );
  });

  it("is hidden outside development", () => {
    vi.stubEnv("NODE_ENV", "production");

    const { container } = render(<DevTestingQuickSwitchPanel runIds={["run-a"]} />);

    expect(container).toBeEmptyDOMElement();
  });
});

import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const DEV_TENANT = "11111111-1111-1111-1111-111111111111";
const DEV_WORKSPACE = "22222222-2222-2222-2222-222222222222";
const DEV_PROJECT = "33333333-3333-3333-3333-333333333333";

vi.mock("@/hooks/use-operator-scope-query-key", () => ({
  useOperatorScopeQueryKey: () => ({
    tenantId: DEV_TENANT,
    workspaceId: DEV_WORKSPACE,
    projectId: DEV_PROJECT,
  }),
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => false,
  };
});

vi.mock("@/lib/operator/operator-scope-storage", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/operator/operator-scope-storage")>();

  return {
    ...mod,
    readOperatorScopeFromStorage: vi.fn(() => null),
  };
});

import { ScopeHelpCurrentScopePanel } from "@/components/help/ScopeHelpCurrentScopePanel";
import { renderWithOperatorQuery, useOperatorQueryTestLifecycle } from "@/testing/operator-query-test-helpers";
import {
  BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL,
  BUYER_SCOPE_SAMPLE_WORKSPACE_DEMO_HINT,
} from "@/lib/buyer/buyer-polish-copy";
import {
  formatScopeSwitcherTriggerLabel,
  isEffectiveDevDefaultScope,
} from "@/lib/scope-switcher-display";

describe("ScopeHelpCurrentScopePanel", () => {
  useOperatorQueryTestLifecycle();

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ workspaces: [] }), { status: 200 })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("shows sample scope labels and switching state for the dev default scope", async () => {
    renderWithOperatorQuery(<ScopeHelpCurrentScopePanel />);

    expect(isEffectiveDevDefaultScope(DEV_WORKSPACE, DEV_PROJECT)).toBe(true);

    await waitFor(() => {
      expect(screen.getByTestId("scope-help-current-scope-status")).toHaveTextContent("Sample");
    });

    expect(screen.getByTestId("scope-help-current-workspace")).toHaveTextContent("Claims Intake Workspace");
    expect(screen.getByTestId("scope-help-current-project")).toHaveTextContent("Primary project");
    expect(screen.getByTestId("scope-help-current-switcher-label")).toHaveTextContent(
      formatScopeSwitcherTriggerLabel({
        workspaceLabel: "Claims Intake Workspace",
        projectLabel: "Primary project",
        isSampleWorkspaceSession: true,
        includeProject: false,
      }),
    );
    expect(screen.getByTestId("scope-help-current-switcher-label")).toHaveTextContent(
      BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL,
    );
    expect(screen.getByTestId("scope-help-switching-state")).toHaveTextContent(/disabled for this session/i);
    expect(screen.queryByText(BUYER_SCOPE_SAMPLE_WORKSPACE_DEMO_HINT)).not.toBeInTheDocument();
  });
});

import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  listAlertRoutingSubscriptions: vi.fn(),
}));

vi.mock("@/lib/active-workspace-scope-label", () => ({
  readActiveWorkspaceScopeLabel: () => "Claims Intake Demo",
}));

import { listAlertRoutingSubscriptions } from "@/lib/api";
import { useSlackIntegrationHelpWorkspaceReadiness } from "@/lib/use-slack-integration-help-workspace-readiness";

describe("useSlackIntegrationHelpWorkspaceReadiness", () => {
  it("maps enabled Slack destinations to ready status", async () => {
    vi.mocked(listAlertRoutingSubscriptions).mockResolvedValue([
      {
        subscriptionId: "sub-1",
        channelType: "SlackWebhook",
        isEnabled: true,
        name: "Ops",
        destination: "https://hooks.slack.com/example",
        createdUtc: "2026-01-01T00:00:00Z",
        updatedUtc: "2026-01-01T00:00:00Z",
      },
    ]);

    const { result } = renderHook(() => useSlackIntegrationHelpWorkspaceReadiness());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.activeDestinationCount).toBe(1);
    expect(result.current.workspaceScopeLabel).toBe("Claims Intake Demo");
    expect(result.current.configurationStatusKind).toBe("ready");
  });

  it("does not set state after unmount when the request settles late", async () => {
    let rejectLate: ((error: unknown) => void) | undefined;

    vi.mocked(listAlertRoutingSubscriptions).mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectLate = reject;
        }),
    );

    const { unmount } = renderHook(() => useSlackIntegrationHelpWorkspaceReadiness());

    unmount();

    rejectLate?.(new Error("network down"));

    await Promise.resolve();
  });
});

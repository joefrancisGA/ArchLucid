import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  listAlertRules: vi.fn(),
  listCompositeAlertRules: vi.fn(),
  listAlertRoutingSubscriptions: vi.fn(),
  listAlertsPaged: vi.fn(),
}));

import {
  listAlertRules,
  listAlertRoutingSubscriptions,
  listAlertsPaged,
  listCompositeAlertRules,
} from "@/lib/api";
import { ApiRequestError } from "@/lib/api-request-error";
import {
  ALERTS_HELP_MOST_RECENT_ALERT_ACTIVITY_NONE,
  ALERTS_HELP_MOST_RECENT_ALERT_ACTIVITY_NO_RULES,
} from "@/lib/alerts-help-guide-content";
import {
  ALERTS_HELP_WORKSPACE_SCOPE_FALLBACK_LABEL,
  useAlertsHelpWorkspaceReadiness,
} from "@/lib/use-alerts-help-workspace-readiness";

describe("useAlertsHelpWorkspaceReadiness", () => {
  it("formats live workspace readiness from alert APIs", async () => {
    vi.mocked(listAlertRules).mockResolvedValue([
      {
        ruleId: "r1",
        name: "Critical findings",
        ruleType: "SeverityThreshold",
        severity: "Critical",
        thresholdValue: 1,
        isEnabled: true,
        targetChannelType: "DigestOnly",
        metadataJson: "{}",
      },
    ]);
    vi.mocked(listCompositeAlertRules).mockResolvedValue([]);
    vi.mocked(listAlertRoutingSubscriptions).mockResolvedValue([
      {
        routingSubscriptionId: "sub-1",
        tenantId: "t1",
        workspaceId: "w1",
        projectId: "default",
        name: "Email",
        channelType: "Email",
        destination: "ops@example.com",
        minimumSeverity: "High",
        isEnabled: true,
        createdUtc: "2026-07-01T00:00:00Z",
        metadataJson: "{}",
      },
    ]);
    vi.mocked(listAlertsPaged).mockImplementation(async (status) => {
      if (status === "Open") {
        return { items: [], totalCount: 0, page: 1, pageSize: 1 };
      }

      return {
        items: [
          {
            alertId: "a1",
            status: "Open",
            severity: "High",
            createdUtc: "2026-07-10T12:00:00Z",
            lastUpdatedUtc: "2026-07-10T12:00:00Z",
          },
        ],
        totalCount: 1,
        page: 1,
        pageSize: 1,
      };
    });

    const { result } = renderHook(() => useAlertsHelpWorkspaceReadiness());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.enabledRulesCount).toBe(1);
    expect(result.current.enabledRulesLabel).toBe("1 enabled rule");
    expect(result.current.enabledRulesStatusKind).toBe("ready");
    expect(result.current.openAlertsLabel).toBe("No open alerts");
    expect(result.current.openAlertsStatusKind).toBe("neutral");
    expect(result.current.routingDestinationsLabel).toBe("1 routing destination");
    expect(result.current.routingDestinationsStatusKind).toBe("ready");
    expect(result.current.lastEvaluationLabel).not.toBe("…");
    expect(result.current.lastEvaluationLabel).not.toBe(ALERTS_HELP_MOST_RECENT_ALERT_ACTIVITY_NONE);
    expect(result.current.workspaceScopeLabel).toBe(ALERTS_HELP_WORKSPACE_SCOPE_FALLBACK_LABEL);
    expect(result.current.loadedAtUtc).not.toBeNull();
    expect(typeof result.current.reload).toBe("function");
  });

  it("does not show activity time when rules exist but no alert records are returned", async () => {
    vi.mocked(listAlertRules).mockResolvedValue([
      {
        ruleId: "r1",
        name: "Critical findings",
        ruleType: "SeverityThreshold",
        severity: "Critical",
        thresholdValue: 1,
        isEnabled: true,
        targetChannelType: "DigestOnly",
        metadataJson: "{}",
      },
    ]);
    vi.mocked(listCompositeAlertRules).mockResolvedValue([]);
    vi.mocked(listAlertRoutingSubscriptions).mockResolvedValue([]);
    vi.mocked(listAlertsPaged).mockResolvedValue({ items: [], totalCount: 0, page: 1, pageSize: 1 });

    const { result } = renderHook(() => useAlertsHelpWorkspaceReadiness());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.enabledRulesCount).toBe(1);
    expect(result.current.lastEvaluationLabel).toBe(ALERTS_HELP_MOST_RECENT_ALERT_ACTIVITY_NONE);
    expect(result.current.lastEvaluationLabel).not.toMatch(/ago|never evaluated|last evaluation/i);
  });

  it("warns when no enabled rules or routing are configured", async () => {
    vi.mocked(listAlertRules).mockResolvedValue([]);
    vi.mocked(listCompositeAlertRules).mockResolvedValue([]);
    vi.mocked(listAlertRoutingSubscriptions).mockResolvedValue([]);
    vi.mocked(listAlertsPaged).mockResolvedValue({ items: [], totalCount: 0, page: 1, pageSize: 1 });

    const { result } = renderHook(() => useAlertsHelpWorkspaceReadiness());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.enabledRulesCount).toBe(0);
    expect(result.current.enabledRulesStatusKind).toBe("needs-attention");
    expect(result.current.routingDestinationsStatusKind).toBe("needs-attention");
    expect(result.current.openAlertsStatusKind).toBe("neutral");
    expect(result.current.lastEvaluationLabel).toBe(ALERTS_HELP_MOST_RECENT_ALERT_ACTIVITY_NO_RULES);
  });

  it("marks network failure labels unavailable and exposes reload", async () => {
    vi.mocked(listAlertRules).mockRejectedValue(new Error("network"));

    const { result } = renderHook(() => useAlertsHelpWorkspaceReadiness());

    await waitFor(() => {
      expect(result.current.loadFailed).toBe(true);
    });

    expect(result.current.loadForbidden).toBe(false);
    expect(result.current.lastEvaluationLabel).toBe("Unavailable");
    expect(result.current.lastEvaluationStatusKind).toBe("blocked");
    expect(result.current.workspaceScopeLabel).toBeNull();
    expect(typeof result.current.reload).toBe("function");
  });

  it("treats authorization failures as forbidden without blocked readiness tags", async () => {
    vi.mocked(listAlertRules).mockRejectedValue(
      new ApiRequestError("Forbidden", { httpStatus: 403, correlationId: null, problem: null }),
    );

    const { result } = renderHook(() => useAlertsHelpWorkspaceReadiness());

    await waitFor(() => {
      expect(result.current.loadForbidden).toBe(true);
    });

    expect(result.current.loadFailed).toBe(false);
    expect(result.current.enabledRulesLabel).toBe("");
    expect(result.current.lastEvaluationLabel).toBe("");
    expect(result.current.lastEvaluationStatusKind).toBe("neutral");
    expect(result.current.workspaceScopeLabel).toBeNull();
  });
});

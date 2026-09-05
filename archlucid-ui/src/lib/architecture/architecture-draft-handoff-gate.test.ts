import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  acknowledgeArchitectureDraftHandoff,
  architectureDraftSpawnedRunId,
  buildArchitectureDraftHandoffBannerTitle,
  clearArchitectureDraftHandoffAcknowledgment,
  isArchitectureDraftHandoffAcknowledged,
  trackArchitectureDraftHandoffAcknowledged,
  trackArchitectureDraftPostSpawnEdit,
} from "@/lib/architecture/architecture-draft-handoff-gate";
import { ensureAppInsights } from "@/lib/telemetry";
import type { DraftRequestResponse } from "@/types/draft-intake";

vi.mock("@/lib/telemetry", () => ({
  ensureAppInsights: vi.fn(),
}));

const draftFixture = {
  draftId: "arch-001",
  tenantId: "tenant",
  workspaceId: "ws",
  projectId: "default",
  status: "RunSpawned",
  document: {
    freeTextIntent: "Claims intake",
    actorSet: { actors: [] },
  },
  spawnedRunId: "run-001",
  createdUtc: "2026-01-01T00:00:00.000Z",
  updatedUtc: "2026-01-02T00:00:00.000Z",
} satisfies DraftRequestResponse;

afterEach(() => {
  clearArchitectureDraftHandoffAcknowledgment("arch-001");
  vi.mocked(ensureAppInsights).mockReset();
});

beforeEach(() => {
  vi.mocked(ensureAppInsights).mockResolvedValue(null);
});

describe("architecture-draft-handoff-gate", () => {
  it("detects spawned review linkage on drafts", () => {
    expect(architectureDraftSpawnedRunId(draftFixture)).toBe("run-001");
    expect(architectureDraftSpawnedRunId({ ...draftFixture, spawnedRunId: "  " })).toBeNull();
  });

  it("clears legacy localStorage ack and keeps spawned drafts locked (RS-04)", () => {
    window.localStorage.setItem("archlucid.architecture_draft_handoff_ack.v1.arch-001", "1");

    acknowledgeArchitectureDraftHandoff("arch-001", "run-001");

    expect(isArchitectureDraftHandoffAcknowledged("arch-001")).toBe(false);
    expect(window.localStorage.getItem("archlucid.architecture_draft_handoff_ack.v1.arch-001")).toBeNull();

    clearArchitectureDraftHandoffAcknowledgment("arch-001");

    expect(isArchitectureDraftHandoffAcknowledged("arch-001")).toBe(false);
  });

  it("builds hand-off banner title with review name", () => {
    expect(buildArchitectureDraftHandoffBannerTitle("Claims intake modernization")).toBe(
      "This draft became review “Claims intake modernization” — continue editing there.",
    );
    expect(buildArchitectureDraftHandoffBannerTitle("   ")).toBe(
      "This draft became a review — continue editing there.",
    );
  });

  it("emits hand-off telemetry events", async () => {
    const trackEvent = vi.fn();
    vi.mocked(ensureAppInsights).mockResolvedValue({ trackEvent } as never);

    trackArchitectureDraftHandoffAcknowledged("arch-001", "run-001");
    trackArchitectureDraftPostSpawnEdit("arch-001", "run-001");

    await vi.waitFor(() => {
      expect(trackEvent).toHaveBeenCalledTimes(2);
    });

    expect(trackEvent.mock.calls[0]?.[0]).toEqual({ name: "ArchitectureDraftHandoffAcknowledged" });
    expect(trackEvent.mock.calls[1]?.[0]).toEqual({ name: "ArchitectureDraftPostSpawnEdit" });
  });
});

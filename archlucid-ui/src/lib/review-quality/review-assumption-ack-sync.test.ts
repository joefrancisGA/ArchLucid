import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getReviewAssumptionAcknowledgement,
  putReviewAssumptionAcknowledgement,
} from "@/lib/api/review-assumption-acknowledgement-api";

import { readAcknowledgedAssumptionIds, writeAcknowledgedAssumptionIds } from "./review-assumption-ack-store";
import {
  hydrateAcknowledgedAssumptionIdsFromServer,
  isServerBackedAssumptionAckRun,
  mergeAcknowledgedAssumptionIds,
  pushAcknowledgedAssumptionIdsToServer,
} from "./review-assumption-ack-sync";

vi.mock("@/lib/api/review-assumption-acknowledgement-api", () => ({
  getReviewAssumptionAcknowledgement: vi.fn(),
  putReviewAssumptionAcknowledgement: vi.fn(),
}));

vi.mock("./finalize-readiness-refresh-notify", () => ({
  notifyFinalizeReadinessRefresh: vi.fn(),
}));

import { notifyFinalizeReadinessRefresh } from "./finalize-readiness-refresh-notify";

const RUN_ID = "0b0f7d2e-5b3d-4c8a-9d2f-1a2b3c4d5e6f";

function stubWindowStorage(): void {
  const storage = new Map<string, string>();

  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
    },
    dispatchEvent: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
}

describe("review-assumption-ack-sync", () => {
  beforeEach(() => {
    stubWindowStorage();
    vi.mocked(getReviewAssumptionAcknowledgement).mockReset();
    vi.mocked(putReviewAssumptionAcknowledgement).mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("treats only uuid-like run ids as server-backed", () => {
    expect(isServerBackedAssumptionAckRun(RUN_ID)).toBe(true);
    expect(isServerBackedAssumptionAckRun("run-1")).toBe(false);
    expect(isServerBackedAssumptionAckRun("")).toBe(false);
  });

  it("merges server ids into the local set and drops blanks", () => {
    const merged = mergeAcknowledgedAssumptionIds(new Set(["a"]), ["b", " ", "a"]);

    expect(merged).toEqual(new Set(["a", "b"]));
  });

  it("hydrates by unioning server ids with the local cache and writes the merged set back", async () => {
    writeAcknowledgedAssumptionIds(RUN_ID, new Set(["local-only"]));
    vi.mocked(getReviewAssumptionAcknowledgement).mockResolvedValue({
      evaluationVersion: "assumption-acknowledgement-v1",
      acknowledgedUtc: "2026-09-11T00:00:00Z",
      actorUserId: "user-1",
      acknowledgedAssumptionIds: ["server-only"],
    });

    const merged = await hydrateAcknowledgedAssumptionIdsFromServer(RUN_ID);

    expect(merged).toEqual(new Set(["local-only", "server-only"]));
    expect(readAcknowledgedAssumptionIds(RUN_ID)).toEqual(new Set(["local-only", "server-only"]));
  });

  it("returns null and leaves the cache untouched when the run is not server-backed", async () => {
    writeAcknowledgedAssumptionIds("run-1", new Set(["local-only"]));

    const merged = await hydrateAcknowledgedAssumptionIdsFromServer("run-1");

    expect(merged).toBeNull();
    expect(getReviewAssumptionAcknowledgement).not.toHaveBeenCalled();
    expect(readAcknowledgedAssumptionIds("run-1")).toEqual(new Set(["local-only"]));
  });

  it("returns null and keeps the local cache when the server GET fails", async () => {
    writeAcknowledgedAssumptionIds(RUN_ID, new Set(["local-only"]));
    vi.mocked(getReviewAssumptionAcknowledgement).mockRejectedValue(new Error("boom"));

    const merged = await hydrateAcknowledgedAssumptionIdsFromServer(RUN_ID);

    expect(merged).toBeNull();
    expect(readAcknowledgedAssumptionIds(RUN_ID)).toEqual(new Set(["local-only"]));
  });

  it("pushes the full acknowledged set for server-backed runs", async () => {
    vi.mocked(putReviewAssumptionAcknowledgement).mockResolvedValue({
      evaluationVersion: "assumption-acknowledgement-v1",
      acknowledgedUtc: "2026-09-11T00:00:00Z",
      actorUserId: "user-1",
      acknowledgedAssumptionIds: ["a"],
    });

    const pushed = await pushAcknowledgedAssumptionIdsToServer(RUN_ID, new Set(["a"]));

    expect(pushed).toBe(true);
    expect(putReviewAssumptionAcknowledgement).toHaveBeenCalledWith(RUN_ID, new Set(["a"]));
    expect(notifyFinalizeReadinessRefresh).toHaveBeenCalledWith(RUN_ID);
  });

  it("does not push for non-server-backed runs and tolerates PUT failures", async () => {
    expect(await pushAcknowledgedAssumptionIdsToServer("run-1", new Set(["a"]))).toBe(false);
    expect(putReviewAssumptionAcknowledgement).not.toHaveBeenCalled();

    vi.mocked(putReviewAssumptionAcknowledgement).mockRejectedValue(new Error("409"));

    expect(await pushAcknowledgedAssumptionIdsToServer(RUN_ID, new Set(["a"]))).toBe(false);
  });
});

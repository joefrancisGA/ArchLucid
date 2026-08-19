import { beforeEach, describe, expect, it, vi } from "vitest";

const getRunSummary = vi.fn();
const getRunDetail = vi.fn();

vi.mock("@/lib/api", () => ({
  getRunSummary: (...args: unknown[]) => getRunSummary(...args),
  getRunDetail: (...args: unknown[]) => getRunDetail(...args),
}));

vi.mock("@/lib/demo-run-canonical", () => ({
  isShowcaseStaticDemoRunId: () => false,
}));

import { resolveGoldenManifestIdForRun } from "./resolve-golden-manifest-id-for-run";

beforeEach(() => {
  getRunSummary.mockReset();
  getRunDetail.mockReset();
});

describe("resolveGoldenManifestIdForRun", () => {
  it("prefers goldenManifestId from getRunSummary", async () => {
    getRunSummary.mockResolvedValue({
      runId: "run-1",
      projectId: "default",
      createdUtc: "2026-01-15T12:00:00.000Z",
      goldenManifestId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    });

    await expect(resolveGoldenManifestIdForRun("run-1")).resolves.toBe(
      "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    );
    expect(getRunDetail).not.toHaveBeenCalled();
  });

  it("falls back to getRunDetail when summary omits the id", async () => {
    getRunSummary.mockResolvedValue({
      runId: "run-1",
      projectId: "default",
      createdUtc: "2026-01-15T12:00:00.000Z",
      hasGoldenManifest: true,
      goldenManifestId: null,
    });
    getRunDetail.mockResolvedValue({
      data: {
        run: {
          runId: "run-1",
          projectId: "default",
          createdUtc: "2026-01-15T12:00:00.000Z",
          goldenManifestId: "bbbbbbbb-cccc-dddd-eeee-ffffffffffff",
        },
      },
    });

    await expect(resolveGoldenManifestIdForRun("run-1")).resolves.toBe(
      "bbbbbbbb-cccc-dddd-eeee-ffffffffffff",
    );
  });

  it("returns null for blank run ids", async () => {
    await expect(resolveGoldenManifestIdForRun("   ")).resolves.toBeNull();
    expect(getRunSummary).not.toHaveBeenCalled();
  });
});

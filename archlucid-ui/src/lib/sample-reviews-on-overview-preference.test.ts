import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_SAMPLE_REVIEWS_ON_OVERVIEW_ENABLED,
  persistSampleReviewsOnOverviewEnabled,
  persistSampleReviewsOnOverviewEnabledLocally,
  readSampleReviewsOnOverviewEnabledFromStorage,
  resetSampleReviewsOnOverviewSessionStateForTests,
  syncSampleReviewsOnOverviewEnabledFromServer,
} from "@/lib/sample-reviews-on-overview-preference";

const apiGetMock = vi.hoisted(() => vi.fn());
const apiPutJsonMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/user-preferences", () => ({
  getUserPreferences: (...args: unknown[]) => apiGetMock(...args),
  setUserSampleReviewsOnOverviewEnabled: (...args: unknown[]) => apiPutJsonMock(...args),
}));

describe("sample-reviews-on-overview-preference", () => {
  beforeEach(() => {
    resetSampleReviewsOnOverviewSessionStateForTests();
    apiGetMock.mockReset();
    apiPutJsonMock.mockReset();
  });

  afterEach(() => {
    resetSampleReviewsOnOverviewSessionStateForTests();
  });

  it("defaults to visible when storage is unset", () => {
    expect(readSampleReviewsOnOverviewEnabledFromStorage()).toBe(DEFAULT_SAMPLE_REVIEWS_ON_OVERVIEW_ENABLED);
  });

  it("persists locally and syncs explicit server preference", async () => {
    persistSampleReviewsOnOverviewEnabledLocally(false);

    expect(readSampleReviewsOnOverviewEnabledFromStorage()).toBe(false);

    apiGetMock.mockResolvedValue({
      sampleReviewsOnOverviewEnabled: true,
      sampleReviewsOnOverviewIsExplicit: true,
    });

    const synced = await syncSampleReviewsOnOverviewEnabledFromServer();

    expect(synced).toBe(true);
    expect(readSampleReviewsOnOverviewEnabledFromStorage()).toBe(true);
  });

  it("migrates local opt-out to the server when account has no explicit row", async () => {
    persistSampleReviewsOnOverviewEnabledLocally(false);
    apiGetMock.mockResolvedValue({
      sampleReviewsOnOverviewEnabled: true,
      sampleReviewsOnOverviewIsExplicit: false,
    });
    apiPutJsonMock.mockResolvedValue(undefined);

    const synced = await syncSampleReviewsOnOverviewEnabledFromServer();

    expect(synced).toBe(false);
    expect(apiPutJsonMock).toHaveBeenCalledWith(false);
    expect(readSampleReviewsOnOverviewEnabledFromStorage()).toBe(false);
  });

  it("reports server sync failure from persist without throwing", async () => {
    apiPutJsonMock.mockRejectedValue(new Error("offline"));

    const synced = await persistSampleReviewsOnOverviewEnabled(false);

    expect(synced).toBe(false);
    expect(readSampleReviewsOnOverviewEnabledFromStorage()).toBe(false);
  });
});

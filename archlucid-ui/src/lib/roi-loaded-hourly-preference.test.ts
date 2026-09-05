import { beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_LOADED_HOURLY_USD, ROI_HOURLY_USD_STORAGE_KEY } from "@/lib/roi-assumptions";
import {
  persistRoiLoadedHourlyUsd,
  readRoiLoadedHourlyUsdFromStorage,
  syncRoiLoadedHourlyUsdFromServer,
} from "@/lib/roi-loaded-hourly-preference";

vi.mock("@/lib/api/user-preferences", () => ({
  getUserPreferences: vi.fn(),
}));

vi.mock("@/lib/api/user-preferences-roi", () => ({
  setUserRoiLoadedHourlyCostUsd: vi.fn(async () => undefined),
}));

import { getUserPreferences } from "@/lib/api/user-preferences";
import { setUserRoiLoadedHourlyCostUsd } from "@/lib/api/user-preferences-roi";

describe("roi-loaded-hourly-preference (RS-10)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.mocked(getUserPreferences).mockReset();
    vi.mocked(setUserRoiLoadedHourlyCostUsd).mockReset();
  });

  it("syncs explicit server preference into localStorage", async () => {
    vi.mocked(getUserPreferences).mockResolvedValue({
      appearancePreference: "system",
      appearancePreferenceIsExplicit: false,
      cloudPlatformScope: {
        "evidence-only": true,
        azure: true,
        aws: true,
        gcp: true,
      },
      cloudPlatformScopeIsExplicit: false,
      whereToGoNextEnabled: true,
      whereToGoNextIsExplicit: false,
      sampleReviewsOnOverviewEnabled: true,
      sampleReviewsOnOverviewIsExplicit: false,
      ianaTimeZoneId: "UTC",
      ianaTimeZoneIsExplicit: false,
      workspaceMode: "working",
      workspaceModeIsExplicit: false,
      workspaceModeGraduationOffer: "pending",
      workspaceModeGraduationOfferIsExplicit: false,
      professionalWorkbenchEnabled: true,
      professionalWorkbenchEnabledIsExplicit: false,
      roiLoadedHourlyCostUsd: 225,
      roiLoadedHourlyCostUsdIsExplicit: true,
    });

    const synced = await syncRoiLoadedHourlyUsdFromServer();

    expect(synced).toBe(225);
    expect(readRoiLoadedHourlyUsdFromStorage()).toBe(225);
  });

  it("persists hourly cost to user preferences API", async () => {
    await persistRoiLoadedHourlyUsd(180);

    expect(window.localStorage.getItem(ROI_HOURLY_USD_STORAGE_KEY)).toBe("180");
    expect(setUserRoiLoadedHourlyCostUsd).toHaveBeenCalledWith(180);
  });

  it("falls back to default when storage is empty", () => {
    expect(readRoiLoadedHourlyUsdFromStorage()).toBe(DEFAULT_LOADED_HOURLY_USD);
  });
});

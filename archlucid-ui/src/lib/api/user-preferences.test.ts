import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { resetOperatorQueryClientForTests } from "@/lib/query/operator-query-client";

const apiGetMock = vi.hoisted(() => vi.fn());
const apiPutJsonMock = vi.hoisted(() => vi.fn());

const DEFAULT_CLOUD_PLATFORM_SCOPE = {
  "evidence-only": true,
  azure: true,
  aws: true,
  gcp: true,
} as const;

vi.mock("@/lib/api/http", () => ({
  apiGet: (...args: unknown[]) => apiGetMock(...args),
  apiPutJson: (...args: unknown[]) => apiPutJsonMock(...args),
}));

describe("getUserPreferences", () => {
  let getUserPreferences: typeof import("@/lib/api/user-preferences").getUserPreferences;
  let invalidateUserPreferencesCache: typeof import("@/lib/api/user-preferences").invalidateUserPreferencesCache;
  let resetUserPreferencesCacheForTests: typeof import("@/lib/api/user-preferences").resetUserPreferencesCacheForTests;

  beforeEach(async () => {
    vi.resetModules();
    apiGetMock.mockReset();
    apiPutJsonMock.mockReset();
    resetOperatorQueryClientForTests();
    const mod = await import("@/lib/api/user-preferences");
    getUserPreferences = mod.getUserPreferences;
    invalidateUserPreferencesCache = mod.invalidateUserPreferencesCache;
    resetUserPreferencesCacheForTests = mod.resetUserPreferencesCacheForTests;
    resetUserPreferencesCacheForTests();
  });

  afterEach(() => {
    resetUserPreferencesCacheForTests();
    resetOperatorQueryClientForTests();
  });

  it("returns cloud platform scope from the API", async () => {
    apiGetMock.mockResolvedValue({
      appearancePreference: "dark",
      appearancePreferenceIsExplicit: true,
      cloudPlatformScope: {
        "evidence-only": true,
        azure: false,
        aws: true,
        gcp: false,
      },
      cloudPlatformScopeIsExplicit: true,
      whereToGoNextEnabled: true,
      whereToGoNextIsExplicit: false,
      ianaTimeZoneId: "UTC",
      ianaTimeZoneIsExplicit: false,
    });

    const preferences = await getUserPreferences();

    expect(preferences.cloudPlatformScope.azure).toBe(false);
    expect(preferences.cloudPlatformScopeIsExplicit).toBe(true);
  });

  it("dedupes concurrent reads into one network request via TanStack Query", async () => {
    type UserPreferencesFixture = {
      appearancePreference: "dark";
      appearancePreferenceIsExplicit: true;
      cloudPlatformScope: typeof DEFAULT_CLOUD_PLATFORM_SCOPE;
      cloudPlatformScopeIsExplicit: false;
      whereToGoNextEnabled: true;
      whereToGoNextIsExplicit: false;
      ianaTimeZoneId: "UTC";
      ianaTimeZoneIsExplicit: false;
    };

    let resolveRequest: ((value: UserPreferencesFixture) => void) | undefined;

    apiGetMock.mockImplementation(
      () =>
        new Promise<UserPreferencesFixture>((resolve) => {
          resolveRequest = resolve;
        }),
    );

    const firstPromise = getUserPreferences();
    const secondPromise = getUserPreferences();

    expect(apiGetMock).toHaveBeenCalledTimes(1);

    resolveRequest?.({
      appearancePreference: "dark",
      appearancePreferenceIsExplicit: true,
      cloudPlatformScope: DEFAULT_CLOUD_PLATFORM_SCOPE,
      cloudPlatformScopeIsExplicit: false,
      whereToGoNextEnabled: true,
      whereToGoNextIsExplicit: false,
      ianaTimeZoneId: "UTC",
      ianaTimeZoneIsExplicit: false,
    });

    const [first, second] = await Promise.all([firstPromise, secondPromise]);

    expect(first.appearancePreference).toBe("dark");
    expect(second).toEqual(first);
    expect(apiGetMock).toHaveBeenCalledTimes(1);
  });

  it("returns the staleTime-cached value without a second GET", async () => {
    apiGetMock.mockResolvedValue({
      appearancePreference: "light",
      appearancePreferenceIsExplicit: true,
      cloudPlatformScope: DEFAULT_CLOUD_PLATFORM_SCOPE,
      cloudPlatformScopeIsExplicit: false,
      whereToGoNextEnabled: true,
      whereToGoNextIsExplicit: false,
      ianaTimeZoneId: "UTC",
      ianaTimeZoneIsExplicit: false,
    });

    const first = await getUserPreferences();
    const second = await getUserPreferences();

    expect(first.appearancePreference).toBe("light");
    expect(second).toEqual(first);
    expect(apiGetMock).toHaveBeenCalledTimes(1);
  });

  it("fetches again after invalidateUserPreferencesCache", async () => {
    apiGetMock
      .mockResolvedValueOnce({
        appearancePreference: "light",
        appearancePreferenceIsExplicit: true,
        cloudPlatformScope: DEFAULT_CLOUD_PLATFORM_SCOPE,
        cloudPlatformScopeIsExplicit: false,
        whereToGoNextEnabled: true,
        whereToGoNextIsExplicit: false,
        ianaTimeZoneId: "UTC",
        ianaTimeZoneIsExplicit: false,
      })
      .mockResolvedValueOnce({
        appearancePreference: "dark",
        appearancePreferenceIsExplicit: true,
        cloudPlatformScope: DEFAULT_CLOUD_PLATFORM_SCOPE,
        cloudPlatformScopeIsExplicit: false,
        whereToGoNextEnabled: true,
        whereToGoNextIsExplicit: false,
        ianaTimeZoneId: "UTC",
        ianaTimeZoneIsExplicit: false,
      });

    await getUserPreferences();
    await invalidateUserPreferencesCache();
    const refreshed = await getUserPreferences();

    expect(refreshed.appearancePreference).toBe("dark");
    expect(apiGetMock).toHaveBeenCalledTimes(2);
  });

  it("shares cache between imperative getUserPreferences calls (root vs operator tree)", async () => {
    const { fetchUserPreferencesFromApi } = await import("@/lib/api/user-preferences");

    apiGetMock.mockResolvedValue({
      appearancePreference: "system",
      appearancePreferenceIsExplicit: false,
      cloudPlatformScope: DEFAULT_CLOUD_PLATFORM_SCOPE,
      cloudPlatformScopeIsExplicit: false,
      whereToGoNextEnabled: true,
      whereToGoNextIsExplicit: false,
      ianaTimeZoneId: "UTC",
      ianaTimeZoneIsExplicit: false,
    });

    const { getOperatorQueryClient } = await import("@/lib/query/operator-query-client");
    const queryClient = getOperatorQueryClient();

    await queryClient.fetchQuery({
      queryKey: operatorQueryKeys.userPreferences,
      queryFn: fetchUserPreferencesFromApi,
      staleTime: 30_000,
    });

    const viaImperative = await getUserPreferences();

    expect(viaImperative.appearancePreference).toBe("system");
    expect(apiGetMock).toHaveBeenCalledTimes(1);
  });
});

describe("setUserCloudPlatformScope", () => {
  let getUserPreferences: typeof import("@/lib/api/user-preferences").getUserPreferences;
  let resetUserPreferencesCacheForTests: typeof import("@/lib/api/user-preferences").resetUserPreferencesCacheForTests;
  let setUserCloudPlatformScope: typeof import("@/lib/api/user-preferences").setUserCloudPlatformScope;

  beforeEach(async () => {
    vi.resetModules();
    apiGetMock.mockReset();
    apiPutJsonMock.mockReset();
    resetOperatorQueryClientForTests();
    const mod = await import("@/lib/api/user-preferences");
    getUserPreferences = mod.getUserPreferences;
    resetUserPreferencesCacheForTests = mod.resetUserPreferencesCacheForTests;
    setUserCloudPlatformScope = mod.setUserCloudPlatformScope;
    resetUserPreferencesCacheForTests();
  });

  afterEach(() => {
    resetUserPreferencesCacheForTests();
    resetOperatorQueryClientForTests();
  });

  it("persists scope and seeds cache without a follow-up GET", async () => {
    apiPutJsonMock.mockResolvedValue(undefined);

    await setUserCloudPlatformScope({
      "evidence-only": true,
      azure: false,
      aws: true,
      gcp: false,
    });

    const preferences = await getUserPreferences();

    expect(preferences.cloudPlatformScope).toEqual({
      "evidence-only": true,
      azure: false,
      aws: true,
      gcp: false,
    });
    expect(preferences.cloudPlatformScopeIsExplicit).toBe(true);
    expect(apiGetMock).not.toHaveBeenCalled();
    expect(apiPutJsonMock).toHaveBeenCalledWith("/v1/user/preferences/cloud-platforms", {
      scope: {
        "evidence-only": true,
        azure: false,
        aws: true,
        gcp: false,
      },
    });
  });
});

describe("setUserAppearancePreference", () => {
  let getUserPreferences: typeof import("@/lib/api/user-preferences").getUserPreferences;
  let resetUserPreferencesCacheForTests: typeof import("@/lib/api/user-preferences").resetUserPreferencesCacheForTests;
  let setUserAppearancePreference: typeof import("@/lib/api/user-preferences").setUserAppearancePreference;

  beforeEach(async () => {
    vi.resetModules();
    apiGetMock.mockReset();
    apiPutJsonMock.mockReset();
    resetOperatorQueryClientForTests();
    const mod = await import("@/lib/api/user-preferences");
    getUserPreferences = mod.getUserPreferences;
    resetUserPreferencesCacheForTests = mod.resetUserPreferencesCacheForTests;
    setUserAppearancePreference = mod.setUserAppearancePreference;
    resetUserPreferencesCacheForTests();
  });

  afterEach(() => {
    resetUserPreferencesCacheForTests();
    resetOperatorQueryClientForTests();
  });

  it("seeds the shared TanStack cache so a follow-up get does not hit the network", async () => {
    apiPutJsonMock.mockResolvedValue(undefined);

    await setUserAppearancePreference("system");

    const preferences = await getUserPreferences();

    expect(preferences).toEqual({
      appearancePreference: "system",
      appearancePreferenceIsExplicit: true,
      cloudPlatformScope: DEFAULT_CLOUD_PLATFORM_SCOPE,
      cloudPlatformScopeIsExplicit: false,
      whereToGoNextEnabled: true,
      whereToGoNextIsExplicit: false,
      sampleReviewsOnOverviewEnabled: true,
      sampleReviewsOnOverviewIsExplicit: false,
      ianaTimeZoneId: "UTC",
      ianaTimeZoneIsExplicit: false,
    });
    expect(apiGetMock).not.toHaveBeenCalled();
  });
});

describe("setUserWhereToGoNextEnabled", () => {
  let getUserPreferences: typeof import("@/lib/api/user-preferences").getUserPreferences;
  let resetUserPreferencesCacheForTests: typeof import("@/lib/api/user-preferences").resetUserPreferencesCacheForTests;
  let setUserWhereToGoNextEnabled: typeof import("@/lib/api/user-preferences").setUserWhereToGoNextEnabled;

  beforeEach(async () => {
    vi.resetModules();
    apiGetMock.mockReset();
    apiPutJsonMock.mockReset();
    resetOperatorQueryClientForTests();
    const mod = await import("@/lib/api/user-preferences");
    getUserPreferences = mod.getUserPreferences;
    resetUserPreferencesCacheForTests = mod.resetUserPreferencesCacheForTests;
    setUserWhereToGoNextEnabled = mod.setUserWhereToGoNextEnabled;
    resetUserPreferencesCacheForTests();
  });

  afterEach(() => {
    resetUserPreferencesCacheForTests();
    resetOperatorQueryClientForTests();
  });

  it("persists visibility and seeds cache without a follow-up GET", async () => {
    apiPutJsonMock.mockResolvedValue(undefined);

    await setUserWhereToGoNextEnabled(false);

    const preferences = await getUserPreferences();

    expect(preferences.whereToGoNextEnabled).toBe(false);
    expect(preferences.whereToGoNextIsExplicit).toBe(true);
    expect(apiGetMock).not.toHaveBeenCalled();
    expect(apiPutJsonMock).toHaveBeenCalledWith("/v1/user/preferences/where-to-go-next", {
      enabled: false,
    });
  });
});

describe("setUserSampleReviewsOnOverviewEnabled", () => {
  let getUserPreferences: typeof import("@/lib/api/user-preferences").getUserPreferences;
  let resetUserPreferencesCacheForTests: typeof import("@/lib/api/user-preferences").resetUserPreferencesCacheForTests;
  let setUserSampleReviewsOnOverviewEnabled: typeof import("@/lib/api/user-preferences").setUserSampleReviewsOnOverviewEnabled;

  beforeEach(async () => {
    vi.resetModules();
    apiGetMock.mockReset();
    apiPutJsonMock.mockReset();
    resetOperatorQueryClientForTests();
    const mod = await import("@/lib/api/user-preferences");
    getUserPreferences = mod.getUserPreferences;
    resetUserPreferencesCacheForTests = mod.resetUserPreferencesCacheForTests;
    setUserSampleReviewsOnOverviewEnabled = mod.setUserSampleReviewsOnOverviewEnabled;
    resetUserPreferencesCacheForTests();
  });

  afterEach(() => {
    resetUserPreferencesCacheForTests();
    resetOperatorQueryClientForTests();
  });

  it("persists visibility and seeds cache without a follow-up GET", async () => {
    apiPutJsonMock.mockResolvedValue(undefined);

    await setUserSampleReviewsOnOverviewEnabled(false);

    const preferences = await getUserPreferences();

    expect(preferences.sampleReviewsOnOverviewEnabled).toBe(false);
    expect(preferences.sampleReviewsOnOverviewIsExplicit).toBe(true);
    expect(apiGetMock).not.toHaveBeenCalled();
    expect(apiPutJsonMock).toHaveBeenCalledWith("/v1/user/preferences/sample-reviews-on-overview", {
      enabled: false,
    });
  });
});

describe("setUserIanaTimeZonePreference", () => {
  let getUserPreferences: typeof import("@/lib/api/user-preferences").getUserPreferences;
  let resetUserPreferencesCacheForTests: typeof import("@/lib/api/user-preferences").resetUserPreferencesCacheForTests;
  let setUserIanaTimeZonePreference: typeof import("@/lib/api/user-preferences").setUserIanaTimeZonePreference;

  beforeEach(async () => {
    vi.resetModules();
    apiGetMock.mockReset();
    apiPutJsonMock.mockReset();
    resetOperatorQueryClientForTests();
    const mod = await import("@/lib/api/user-preferences");
    getUserPreferences = mod.getUserPreferences;
    resetUserPreferencesCacheForTests = mod.resetUserPreferencesCacheForTests;
    setUserIanaTimeZonePreference = mod.setUserIanaTimeZonePreference;
    resetUserPreferencesCacheForTests();
  });

  afterEach(() => {
    resetUserPreferencesCacheForTests();
    resetOperatorQueryClientForTests();
  });

  it("persists time zone and seeds cache without a follow-up GET", async () => {
    apiPutJsonMock.mockResolvedValue(undefined);

    await setUserIanaTimeZonePreference("America/Chicago");

    const preferences = await getUserPreferences();

    expect(preferences.ianaTimeZoneId).toBe("America/Chicago");
    expect(preferences.ianaTimeZoneIsExplicit).toBe(true);
    expect(apiGetMock).not.toHaveBeenCalled();
    expect(apiPutJsonMock).toHaveBeenCalledWith("/v1/user/preferences/time-zone", {
      ianaTimeZoneId: "America/Chicago",
    });
  });
});

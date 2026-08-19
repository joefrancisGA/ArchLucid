import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { resetOperatorQueryClientForTests } from "@/lib/query/operator-query-client";

const apiGetMock = vi.hoisted(() => vi.fn());
const apiPutJsonMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/http", () => ({
  apiGet: (...args: unknown[]) => apiGetMock(...args),
  apiPutJson: (...args: unknown[]) => apiPutJsonMock(...args),
}));

describe("getUserPreferences", () => {
  let getUserPreferences: typeof import("@/lib/api/user-preferences").getUserPreferences;
  let invalidateUserPreferencesCache: typeof import("@/lib/api/user-preferences").invalidateUserPreferencesCache;
  let resetUserPreferencesCacheForTests: typeof import("@/lib/api/user-preferences").resetUserPreferencesCacheForTests;
  let setUserAppearancePreference: typeof import("@/lib/api/user-preferences").setUserAppearancePreference;

  beforeEach(async () => {
    vi.resetModules();
    apiGetMock.mockReset();
    apiPutJsonMock.mockReset();
    resetOperatorQueryClientForTests();
    const mod = await import("@/lib/api/user-preferences");
    getUserPreferences = mod.getUserPreferences;
    invalidateUserPreferencesCache = mod.invalidateUserPreferencesCache;
    resetUserPreferencesCacheForTests = mod.resetUserPreferencesCacheForTests;
    setUserAppearancePreference = mod.setUserAppearancePreference;
    resetUserPreferencesCacheForTests();
  });

  afterEach(() => {
    resetUserPreferencesCacheForTests();
    resetOperatorQueryClientForTests();
  });

  it("dedupes concurrent reads into one network request via TanStack Query", async () => {
    let resolveRequest: ((value: { appearancePreference: "dark"; appearancePreferenceIsExplicit: true }) => void) | undefined;

    apiGetMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );

    const firstPromise = getUserPreferences();
    const secondPromise = getUserPreferences();

    expect(apiGetMock).toHaveBeenCalledTimes(1);

    resolveRequest?.({
      appearancePreference: "dark",
      appearancePreferenceIsExplicit: true,
    });

    const [first, second] = await Promise.all([firstPromise, secondPromise]);

    expect(first).toEqual({
      appearancePreference: "dark",
      appearancePreferenceIsExplicit: true,
    });
    expect(second).toEqual(first);
    expect(apiGetMock).toHaveBeenCalledTimes(1);
  });

  it("returns the staleTime-cached value without a second GET", async () => {
    apiGetMock.mockResolvedValue({
      appearancePreference: "light",
      appearancePreferenceIsExplicit: true,
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
      })
      .mockResolvedValueOnce({
        appearancePreference: "dark",
        appearancePreferenceIsExplicit: true,
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
    });
    expect(apiGetMock).not.toHaveBeenCalled();
    expect(apiPutJsonMock).toHaveBeenCalledWith("/v1/user/preferences/appearance", { value: "system" });
  });
});

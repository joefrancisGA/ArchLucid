import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiRequestError } from "@/lib/api-request-error";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { resetOperatorQueryClientForTests } from "@/lib/query/operator-query-client";

const apiGetMock = vi.hoisted(() => vi.fn());
const apiPutJsonMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/http", () => ({
  apiGet: (...args: unknown[]) => apiGetMock(...args),
  apiPutJson: (...args: unknown[]) => apiPutJsonMock(...args),
}));

vi.mock("@/lib/advisory-schedule-form", () => ({
  resolveBrowserTimeZoneId: () => "America/Chicago",
}));

describe("iana-time-zone-preference", () => {
  let beginIanaTimeZoneUserPersistIntent: typeof import("@/lib/iana-time-zone-preference").beginIanaTimeZoneUserPersistIntent;
  let endIanaTimeZoneUserPersistIntent: typeof import("@/lib/iana-time-zone-preference").endIanaTimeZoneUserPersistIntent;
  let persistIanaTimeZonePreference: typeof import("@/lib/iana-time-zone-preference").persistIanaTimeZonePreference;
  let persistIanaTimeZonePreferenceToServer: typeof import("@/lib/iana-time-zone-preference").persistIanaTimeZonePreferenceToServer;
  let resetIanaTimeZonePreferenceSessionStateForTests: typeof import("@/lib/iana-time-zone-preference").resetIanaTimeZonePreferenceSessionStateForTests;
  let resetIanaTimeZonePutSerializationForTests: typeof import("@/lib/iana-time-zone-preference").resetIanaTimeZonePutSerializationForTests;
  let syncIanaTimeZonePreferenceFromServer: typeof import("@/lib/iana-time-zone-preference").syncIanaTimeZonePreferenceFromServer;
  let writeStoredIanaTimeZonePreference: typeof import("@/lib/iana-time-zone-preference").writeStoredIanaTimeZonePreference;
  let resetUserPreferencesCacheForTests: typeof import("@/lib/api/user-preferences").resetUserPreferencesCacheForTests;
  let getOperatorQueryClient: typeof import("@/lib/query/operator-query-client").getOperatorQueryClient;

  beforeEach(async () => {
    vi.resetModules();
    apiGetMock.mockReset();
    apiPutJsonMock.mockReset();
    resetOperatorQueryClientForTests();
    window.localStorage.clear();

    const preferenceMod = await import("@/lib/iana-time-zone-preference");
    beginIanaTimeZoneUserPersistIntent = preferenceMod.beginIanaTimeZoneUserPersistIntent;
    endIanaTimeZoneUserPersistIntent = preferenceMod.endIanaTimeZoneUserPersistIntent;
    persistIanaTimeZonePreference = preferenceMod.persistIanaTimeZonePreference;
    persistIanaTimeZonePreferenceToServer = preferenceMod.persistIanaTimeZonePreferenceToServer;
    resetIanaTimeZonePreferenceSessionStateForTests = preferenceMod.resetIanaTimeZonePreferenceSessionStateForTests;
    resetIanaTimeZonePutSerializationForTests = preferenceMod.resetIanaTimeZonePutSerializationForTests;
    syncIanaTimeZonePreferenceFromServer = preferenceMod.syncIanaTimeZonePreferenceFromServer;
    writeStoredIanaTimeZonePreference = preferenceMod.writeStoredIanaTimeZonePreference;

    const userPreferencesMod = await import("@/lib/api/user-preferences");
    resetUserPreferencesCacheForTests = userPreferencesMod.resetUserPreferencesCacheForTests;

    const queryClientMod = await import("@/lib/query/operator-query-client");
    getOperatorQueryClient = queryClientMod.getOperatorQueryClient;

    resetUserPreferencesCacheForTests();
    resetIanaTimeZonePutSerializationForTests();
  });

  afterEach(() => {
    resetIanaTimeZonePreferenceSessionStateForTests();
    resetIanaTimeZonePutSerializationForTests();
    resetUserPreferencesCacheForTests();
    resetOperatorQueryClientForTests();
    window.localStorage.clear();
  });

  it("serializes concurrent PUTs so only the latest value is sent once", async () => {
    let releaseFirstPut: (() => void) | undefined;
    const firstPutGate = new Promise<void>((resolve) => {
      releaseFirstPut = resolve;
    });

    apiPutJsonMock
      .mockImplementationOnce(async () => {
        await firstPutGate;
      })
      .mockResolvedValue(undefined);

    writeStoredIanaTimeZonePreference("America/Chicago");

    const firstPut = persistIanaTimeZonePreferenceToServer("America/Chicago");
    const secondPut = persistIanaTimeZonePreferenceToServer("America/Denver");

    releaseFirstPut?.();
    const [firstOk, secondOk] = await Promise.all([firstPut, secondPut]);

    expect(firstOk).toBe(true);
    expect(secondOk).toBe(true);
    expect(apiPutJsonMock).toHaveBeenCalledTimes(2);
    expect(apiPutJsonMock.mock.calls[1]).toEqual([
      "/v1/user/preferences/time-zone",
      { ianaTimeZoneId: "America/Denver" },
    ]);
  });

  it("retries transient 503 responses before reporting failure", async () => {
    apiPutJsonMock
      .mockRejectedValueOnce(
        new ApiRequestError("Database Timeout", {
          problem: null,
          correlationId: "corr-503",
          httpStatus: 503,
        }),
      )
      .mockResolvedValue(undefined);

    const synced = await persistIanaTimeZonePreferenceToServer("America/Chicago");

    expect(synced).toBe(true);
    expect(apiPutJsonMock).toHaveBeenCalledTimes(2);
  });

  it("skips mount-time sync PUT while a user persist is in flight", async () => {
    writeStoredIanaTimeZonePreference("America/Chicago");
    apiGetMock.mockResolvedValue({
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
    });

    beginIanaTimeZoneUserPersistIntent();

    const synced = await syncIanaTimeZonePreferenceFromServer();

    expect(synced).toBe("UTC");
    expect(apiPutJsonMock).not.toHaveBeenCalled();

    endIanaTimeZoneUserPersistIntent();
  });

  it("pushes local browser time zone on sync when the account has no explicit value", async () => {
    writeStoredIanaTimeZonePreference("America/Chicago");
    apiGetMock.mockResolvedValue({
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
    });
    apiPutJsonMock.mockResolvedValue(undefined);

    const synced = await syncIanaTimeZonePreferenceFromServer();

    expect(synced).toBe("America/Chicago");
    expect(apiPutJsonMock).toHaveBeenCalledWith("/v1/user/preferences/time-zone", {
      ianaTimeZoneId: "America/Chicago",
    });
  });

  it("marks user persist intent only around user-initiated persists", async () => {
    apiPutJsonMock.mockResolvedValue(undefined);

    const synced = await persistIanaTimeZonePreference("America/Denver");

    expect(synced).toBe(true);
    expect(getOperatorQueryClient().getQueryData(operatorQueryKeys.userPreferences)).toMatchObject({
      ianaTimeZoneId: "America/Denver",
      ianaTimeZoneIsExplicit: true,
    });
  });
});

import { DEFAULT_LOADED_HOURLY_USD, ROI_HOURLY_USD_STORAGE_KEY } from "@/lib/roi-assumptions";

export const ROI_LOADED_HOURLY_ACCOUNT_SYNC_LOCAL_ONLY_MESSAGE =
  "Saved on this device only. Account sync failed — check connectivity and try again.";

export function readRoiLoadedHourlyUsdFromStorage(): number {
  if (typeof window === "undefined") {
    return DEFAULT_LOADED_HOURLY_USD;
  }

  try {
    const raw = window.localStorage.getItem(ROI_HOURLY_USD_STORAGE_KEY);

    if (raw === null || raw.trim().length === 0) {
      return DEFAULT_LOADED_HOURLY_USD;
    }

    const parsed = Number(raw);

    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_LOADED_HOURLY_USD;
  }
  catch {
    return DEFAULT_LOADED_HOURLY_USD;
  }
}

export function writeRoiLoadedHourlyUsdToStorage(value: number): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(ROI_HOURLY_USD_STORAGE_KEY, String(value));
  }
  catch {
    /* private mode */
  }
}

export async function syncRoiLoadedHourlyUsdFromServer(): Promise<number | null> {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const { getUserPreferences } = await import("@/lib/api/user-preferences");
    const remote = await getUserPreferences();

    if (remote.roiLoadedHourlyCostUsdIsExplicit) {
      writeRoiLoadedHourlyUsdToStorage(remote.roiLoadedHourlyCostUsd);

      return remote.roiLoadedHourlyCostUsd;
    }

    return readRoiLoadedHourlyUsdFromStorage();
  }
  catch {
    return null;
  }
}

export async function persistRoiLoadedHourlyUsdToServer(value: number): Promise<boolean> {
  try {
    const { setUserRoiLoadedHourlyCostUsd } = await import("@/lib/api/user-preferences-roi");
    await setUserRoiLoadedHourlyCostUsd(value);

    return true;
  }
  catch {
    return false;
  }
}

export async function persistRoiLoadedHourlyUsd(value: number): Promise<boolean> {
  writeRoiLoadedHourlyUsdToStorage(value);

  return persistRoiLoadedHourlyUsdToServer(value);
}

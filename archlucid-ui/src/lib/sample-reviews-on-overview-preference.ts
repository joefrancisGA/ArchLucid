export const SAMPLE_REVIEWS_ON_OVERVIEW_STORAGE_KEY = "archlucid.sample-reviews-on-overview.v1.personal";

export const SAMPLE_REVIEWS_ON_OVERVIEW_CHANGED_EVENT = "archlucid:sample-reviews-on-overview-changed";

export const SAMPLE_REVIEWS_ON_OVERVIEW_ACCOUNT_SYNC_LOCAL_ONLY_MESSAGE =
  "Saved on this device only. Account sync failed — check connectivity and try again.";

export const DEFAULT_SAMPLE_REVIEWS_ON_OVERVIEW_ENABLED = true;

function dispatchSampleReviewsOnOverviewChanged(): void {
  window.dispatchEvent(new CustomEvent(SAMPLE_REVIEWS_ON_OVERVIEW_CHANGED_EVENT));
}

export function normalizeSampleReviewsOnOverviewEnabled(value: string | null | undefined): boolean {
  if (value === null || value === undefined) {
    return DEFAULT_SAMPLE_REVIEWS_ON_OVERVIEW_ENABLED;
  }

  const trimmed = value.trim().toLowerCase();

  if (trimmed === "false") {
    return false;
  }

  if (trimmed === "true") {
    return true;
  }

  return DEFAULT_SAMPLE_REVIEWS_ON_OVERVIEW_ENABLED;
}

export function readSampleReviewsOnOverviewEnabledFromStorage(): boolean {
  if (typeof window === "undefined") {
    return DEFAULT_SAMPLE_REVIEWS_ON_OVERVIEW_ENABLED;
  }

  try {
    return normalizeSampleReviewsOnOverviewEnabled(
      window.localStorage.getItem(SAMPLE_REVIEWS_ON_OVERVIEW_STORAGE_KEY),
    );
  }
  catch {
    return DEFAULT_SAMPLE_REVIEWS_ON_OVERVIEW_ENABLED;
  }
}

export function writeSampleReviewsOnOverviewEnabledToStorage(enabled: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SAMPLE_REVIEWS_ON_OVERVIEW_STORAGE_KEY, enabled ? "true" : "false");
  dispatchSampleReviewsOnOverviewChanged();
}

export function persistSampleReviewsOnOverviewEnabledLocally(enabled: boolean): void {
  writeSampleReviewsOnOverviewEnabledToStorage(enabled);
}

export async function syncSampleReviewsOnOverviewEnabledFromServer(): Promise<boolean | null> {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const { getUserPreferences, setUserSampleReviewsOnOverviewEnabled } = await import("@/lib/api/user-preferences");
    const remote = await getUserPreferences();
    const localEnabled = readSampleReviewsOnOverviewEnabledFromStorage();

    if (
      !remote.sampleReviewsOnOverviewIsExplicit
      && localEnabled !== DEFAULT_SAMPLE_REVIEWS_ON_OVERVIEW_ENABLED
    ) {
      await setUserSampleReviewsOnOverviewEnabled(localEnabled);
      persistSampleReviewsOnOverviewEnabledLocally(localEnabled);

      return localEnabled;
    }

    persistSampleReviewsOnOverviewEnabledLocally(remote.sampleReviewsOnOverviewEnabled);

    return remote.sampleReviewsOnOverviewEnabled;
  }
  catch {
    return null;
  }
}

export async function persistSampleReviewsOnOverviewEnabledToServer(enabled: boolean): Promise<boolean> {
  try {
    const { setUserSampleReviewsOnOverviewEnabled } = await import("@/lib/api/user-preferences");
    await setUserSampleReviewsOnOverviewEnabled(enabled);

    return true;
  }
  catch {
    return false;
  }
}

export async function persistSampleReviewsOnOverviewEnabled(enabled: boolean): Promise<boolean> {
  persistSampleReviewsOnOverviewEnabledLocally(enabled);

  return persistSampleReviewsOnOverviewEnabledToServer(enabled);
}

/** Clears personal preference between Vitest cases. */
export function resetSampleReviewsOnOverviewSessionStateForTests(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SAMPLE_REVIEWS_ON_OVERVIEW_STORAGE_KEY);
}

export function subscribeSampleReviewsOnOverviewChanges(onChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handler = (): void => {
    onChange();
  };

  window.addEventListener(SAMPLE_REVIEWS_ON_OVERVIEW_CHANGED_EVENT, handler);

  return (): void => {
    window.removeEventListener(SAMPLE_REVIEWS_ON_OVERVIEW_CHANGED_EVENT, handler);
  };
}

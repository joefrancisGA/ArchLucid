import {
  FIXTURE_COMPARE_STALE_ALT_LEFT_RUN_ID,
  FIXTURE_LEFT_RUN_ID,
  FIXTURE_RIGHT_RUN_ID,
} from "./ids";

/** Matches {@link RunIdPicker} default on `/compare` (`projectId` prop defaults to `"default"`). */
const COMPARE_PICKER_PROJECT_ID = "default";

/** Buyer-polished picker shows this as the primary line (via {@link RunIdPicker} + description fallback). */
export const FIXTURE_COMPARE_STALE_PRIMARY_LABEL_LEFT_BASELINE = "Stale-warning E2E baseline";

/** Distinct left option so changing selection diverges from the last successful compare pair. */
export const FIXTURE_COMPARE_STALE_PRIMARY_LABEL_LEFT_ALT = "Stale-warning E2E alternate left";

export const FIXTURE_COMPARE_STALE_PRIMARY_LABEL_RIGHT = "Stale-warning E2E updated";

/**
 * Non-empty project runs page so Compare stale-input E2E can change the readonly combobox by picking list options
 * (typing raw ids is blocked in buyer-polished shells).
 */
export function fixtureComparePickerRunsPageForStaleInputWarning(): Record<string, unknown> {
  const createdUtc = "2026-01-10T12:00:00.000Z";

  const row = (runId: string, description: string): Record<string, unknown> => ({
    runId,
    projectId: COMPARE_PICKER_PROJECT_ID,
    description,
    createdUtc,
    hasGoldenManifest: true,
  });

  return {
    items: [
      row(FIXTURE_LEFT_RUN_ID, FIXTURE_COMPARE_STALE_PRIMARY_LABEL_LEFT_BASELINE),
      row(FIXTURE_COMPARE_STALE_ALT_LEFT_RUN_ID, FIXTURE_COMPARE_STALE_PRIMARY_LABEL_LEFT_ALT),
      row(FIXTURE_RIGHT_RUN_ID, FIXTURE_COMPARE_STALE_PRIMARY_LABEL_RIGHT),
    ],
    totalCount: 3,
    page: 1,
    pageSize: 50,
    hasMore: false,
  };
}

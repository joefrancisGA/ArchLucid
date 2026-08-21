import { formatAdvisoryScheduleInstant } from "@/lib/advisory-schedule-form";
import { previewRecurrenceScheduleRuns } from "@/lib/api/governance-stickiness-api";

export const ADVISORY_SCHEDULE_PREVIEW_COUNT = 3;
export const ADVISORY_SCHEDULE_PREVIEW_DEBOUNCE_MS = 250;

export type AdvisorySchedulePreviewState = {
  readonly loading: boolean;
  readonly isValid: boolean;
  readonly validationError: string | null;
  readonly runs: readonly {
    readonly primary: string;
    readonly utcSecondary: string;
    readonly iso: string;
  }[];
};

export const EMPTY_ADVISORY_SCHEDULE_PREVIEW: AdvisorySchedulePreviewState = {
  loading: false,
  isValid: true,
  validationError: null,
  runs: [],
};

/** Loads server-authoritative next runs and formats them for the selected zone. */
export async function loadAdvisoryScheduleUpcomingPreview(
  cronExpression: string,
  timeZoneId: string,
  count: number = ADVISORY_SCHEDULE_PREVIEW_COUNT,
): Promise<AdvisorySchedulePreviewState> {
  const trimmed = cronExpression.trim();

  if (trimmed.length === 0) {
    return {
      loading: false,
      isValid: false,
      validationError: "Choose a frequency and time to preview upcoming scans.",
      runs: [],
    };
  }

  try {
    const response = await previewRecurrenceScheduleRuns({
      cronExpression: trimmed,
      count,
    });

    if (!response.isValid) {
      return {
        loading: false,
        isValid: false,
        validationError:
          response.validationError?.trim() ||
          "That schedule pattern is not supported. Try Daily, Weekly, Monthly, or a valid advanced expression.",
        runs: [],
      };
    }

    return {
      loading: false,
      isValid: true,
      validationError: null,
      runs: response.nextRunUtc.map((iso) => {
        const formatted = formatAdvisoryScheduleInstant(iso, timeZoneId);

        return {
          primary: formatted.primary,
          utcSecondary: formatted.utcSecondary,
          iso,
        };
      }),
    };
  } catch {
    return {
      loading: false,
      isValid: false,
      validationError: "Could not load the upcoming-scan preview. Check your connection and try again.",
      runs: [],
    };
  }
}

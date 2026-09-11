import {
  isTabsKeyboardMove,
  resolveNextTabIndex,
} from "@/components/ui/tabs-keyboard";
import {
  WORKING_CAREER_REHEARSAL_DOOR_IDS,
  type WorkingCareerRehearsalDoorId,
} from "@/lib/governance/working-career-rehearsal-door";

export const WORKING_CAREER_REHEARSAL_CHOOSER_SOURCES = ["command-bar", "findings"] as const;

export type WorkingCareerRehearsalChooserSource =
  (typeof WORKING_CAREER_REHEARSAL_CHOOSER_SOURCES)[number];

export const WORKING_CAREER_REHEARSAL_CHOOSER_TEST_ID = "working-career-rehearsal-chooser";

/** Command bar owns Alt+Shift+E so a findings duplicate cannot cycle twice. */
export function shouldRegisterWorkingCareerRehearsalChooserShortcut(
  source: WorkingCareerRehearsalChooserSource,
): boolean {
  switch (source) {
    case "command-bar":
      return true;
    case "findings":
      return false;
    default: {
      const exhaustive: never = source;

      return exhaustive;
    }
  }
}

/** Arrow/Home/End on the segmented control — Carbon-style, not a fake tablist (TB-1664). */
export function resolveWorkingCareerRehearsalDoorFromSegmentKeyboard(
  current: WorkingCareerRehearsalDoorId,
  key: string,
): WorkingCareerRehearsalDoorId | null {
  if (!isTabsKeyboardMove(key)) {
    return null;
  }

  const currentIndex = WORKING_CAREER_REHEARSAL_DOOR_IDS.indexOf(current);
  const nextIndex = resolveNextTabIndex(
    currentIndex < 0 ? 0 : currentIndex,
    WORKING_CAREER_REHEARSAL_DOOR_IDS.length,
    key,
    "horizontal",
  );

  if (nextIndex === null) {
    return null;
  }

  return WORKING_CAREER_REHEARSAL_DOOR_IDS[nextIndex] ?? null;
}

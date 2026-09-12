import type { CompareExecutionModeHonesty } from "@/lib/compare-execution-mode-honesty";
import { formatStructuralExecutionModeLabel } from "@/lib/structural-execution-mode";

export type CompareExecutionModeSide = {
  readonly label: string;
  readonly modeLabel: string;
};

export type CompareExecutionModeDeltaView = {
  readonly baseline: CompareExecutionModeSide;
  readonly target: CompareExecutionModeSide;
  readonly changed: boolean;
  readonly advisoryParagraph: string | null;
};

function formatModeLabel(honesty: CompareExecutionModeHonesty, side: "baseline" | "target"): string {
  const mode = side === "baseline" ? honesty.baselineMode : honesty.updatedMode;
  const formatted = formatStructuralExecutionModeLabel(mode);

  if (formatted === "Unknown" || honesty.modeUnavailable) {
    return "Unavailable";
  }

  return formatted;
}

/** Compact compare execution-mode delta for buyer verdict chrome. */
export function buildCompareExecutionModeDeltaView(
  honesty: CompareExecutionModeHonesty | null,
): CompareExecutionModeDeltaView | null {
  if (honesty === null) {
    return null;
  }

  return {
    baseline: {
      label: "Baseline review",
      modeLabel: formatModeLabel(honesty, "baseline"),
    },
    target: {
      label: "Updated review",
      modeLabel: formatModeLabel(honesty, "target"),
    },
    changed: honesty.modesDiffer || honesty.modeUnavailable,
    advisoryParagraph: honesty.advisoryParagraph,
  };
}

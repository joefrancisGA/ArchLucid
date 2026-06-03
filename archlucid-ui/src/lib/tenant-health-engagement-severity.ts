import type { FindingSeverityKind } from "@/lib/design-tokens";

/** Maps engagement score to severity chip colors for admin tenant-health table (TB-228). */
export function engagementScoreSeverityKind(score: number): FindingSeverityKind {
  if (score < 30) {
    return "Critical";
  }

  if (score < 60) {
    return "Medium";
  }

  return "Low";
}

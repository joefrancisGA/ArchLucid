/** Severity badge classes for alerts inbox rows (TB-535 / TB-564). */
export function alertsInboxSeverityBadgeClass(severity: string): string {
  const key = severity.trim().toLowerCase();

  if (key === "critical") {
    return "border-transparent bg-red-600 text-white hover:bg-red-600/90 dark:bg-red-600 dark:hover:bg-red-600/90";
  }

  if (key === "high") {
    return "border-transparent bg-orange-800 text-white hover:bg-orange-800/90 dark:bg-orange-800 dark:hover:bg-orange-800/90";
  }

  if (key === "medium") {
    return "border-transparent bg-amber-800 text-white hover:bg-amber-800/90 dark:bg-amber-800 dark:hover:bg-amber-800/90";
  }

  return "border-neutral-200 bg-neutral-100 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100";
}

/** Run-scoped guided-intake correction deep link for an in-flight architecture run (TB-1837). */
export function buildArchitectureCorrectionHref(
  runId: string,
  correctionHref: string | null | undefined,
): string {
  const trimmedRunId = runId.trim();

  if (correctionHref !== null && correctionHref !== undefined && correctionHref.trim().length > 0) {
    return correctionHref;
  }

  return `/architecture/reviews/new?path=guided-intake&rerun=${encodeURIComponent(trimmedRunId)}`;
}

export function formatLivelihoodLastSavedLabel(savedUtc: string): string {
  if (savedUtc.trim().length === 0) {
    return "Last saved time was not stored.";
  }

  const parsed = Date.parse(savedUtc);

  if (!Number.isFinite(parsed)) {
    return "Last saved time was not readable.";
  }

  return `Last saved ${new Date(parsed).toLocaleString()}`;
}

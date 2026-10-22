export function formatLivelihoodLastSavedLabel(savedUtc: string): string {
  const parsed = Date.parse(savedUtc);

  if (!Number.isFinite(parsed)) {
    return "Last saved time unavailable";
  }

  return `Last saved ${new Date(parsed).toLocaleString()}`;
}

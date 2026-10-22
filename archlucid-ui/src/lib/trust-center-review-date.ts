export type TrustCenterReviewDateDisplay = {
  readonly label: string;
  readonly dateTime: string | null;
};

export function formatTrustCenterReviewDate(
  lastReviewedUtc: string | null | undefined,
): TrustCenterReviewDateDisplay {
  if (lastReviewedUtc === null || lastReviewedUtc === undefined) {
    return {
      label: "Updated with each assurance-cycle refresh",
      dateTime: null,
    };
  }

  const parsed: Date = new Date(lastReviewedUtc);

  if (Number.isNaN(parsed.getTime())) {
    return {
      label: lastReviewedUtc,
      dateTime: null,
    };
  }

  const isoDate: string = parsed.toISOString().slice(0, 10);

  return {
    label: isoDate,
    dateTime: isoDate,
  };
}

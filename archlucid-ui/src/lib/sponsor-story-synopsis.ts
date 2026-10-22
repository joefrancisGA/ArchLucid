export type SponsorStoryDispositionCounts = {
  readonly accepted: number;
  readonly dismissed: number;
  readonly deferred: number;
  readonly needsEvidence: number;
  readonly remediated: number;
  readonly undisposed: number;
};

export const SPONSOR_STORY_SYNOPSIS_WORKING_LABEL =
  "Working sponsor synopsis — not the signed export. Updates as you record dispositions.";

export function buildSponsorStoryDispositionCountsFromRows(
  rows: readonly { readonly latestDisposition?: string | null }[],
): SponsorStoryDispositionCounts {
  const counts = {
    accepted: 0,
    dismissed: 0,
    deferred: 0,
    needsEvidence: 0,
    remediated: 0,
    undisposed: 0,
  };

  for (const row of rows) {
    const disposition = (row.latestDisposition ?? "").trim();

    switch (disposition) {
      case "Accepted":
        counts.accepted += 1;
        break;
      case "RejectedAsNotApplicable":
        counts.dismissed += 1;
        break;
      case "Deferred":
        counts.deferred += 1;
        break;
      case "NeedsEvidence":
        counts.needsEvidence += 1;
        break;
      case "Remediated":
        counts.remediated += 1;
        break;
      default:
        counts.undisposed += 1;
        break;
    }
  }

  return counts;
}

export function buildSponsorStorySynopsisParagraph(input: {
  readonly packageTitle: string;
  readonly counts: SponsorStoryDispositionCounts;
}): string {
  const { counts, packageTitle } = input;
  const totalDispositions =
    counts.accepted + counts.dismissed + counts.deferred + counts.needsEvidence + counts.remediated;

  if (totalDispositions === 0 && counts.undisposed > 0) {
    return `Sponsor story for "${packageTitle}" has not started — ${counts.undisposed} finding${counts.undisposed === 1 ? "" : "s"} still need disposition before a sendable narrative forms.`;
  }

  const parts: string[] = [];

  if (counts.accepted > 0) {
    parts.push(`${counts.accepted} accepted`);
  }

  if (counts.dismissed > 0) {
    parts.push(`${counts.dismissed} waived as not applicable`);
  }

  if (counts.deferred > 0) {
    parts.push(`${counts.deferred} deferred`);
  }

  if (counts.needsEvidence > 0) {
    parts.push(`${counts.needsEvidence} awaiting evidence`);
  }

  if (counts.remediated > 0) {
    parts.push(`${counts.remediated} remediated`);
  }

  const dispositionPhrase = parts.length > 0 ? parts.join(", ") : "no dispositions yet";
  const undisposedPhrase =
    counts.undisposed > 0
      ? ` ${counts.undisposed} finding${counts.undisposed === 1 ? "" : "s"} still undisposed.`
      : " All findings have a recorded disposition.";

  return `Working sponsor synopsis for "${packageTitle}": ${dispositionPhrase}.${undisposedPhrase}`;
}

import type { FindingDispositionKind } from "@/lib/api/governance-stickiness-api";

/** Sponsor packet section that maps disposition to projected USD buckets (SponsorReviewPacketComposer). */
export const DISPOSITION_EXPORT_IMPACT_SPONSOR_ROI_SECTION_HEADING = "ROI basis by disposition";

export type DispositionExportImpactSurface = "signed_review_record" | "sponsor_packet" | "audit_trail";

export type DispositionExportImpactLine = {
  readonly surface: DispositionExportImpactSurface;
  readonly included: boolean;
  readonly detail: string;
};

const SIGNED_RECORD_UNCHANGED_DETAIL =
  "Unchanged — the committed sealed review record snapshot is not rewritten; disposition is recorded separately on the audit trail.";

const AUDIT_TRAIL_INCLUDED_DETAIL =
  "Included — appends a disposition event to the finding review trail (audit history).";

const SPONSOR_TOP_FINDINGS_DETAIL =
  "May still appear in sponsor packet top-finding summaries — selection is severity-based; disposition alone does not remove the row.";

type SponsorRoiBucketRule = {
  readonly bucketLabel: string;
  readonly includedInSponsorPacket: boolean;
};

function sponsorRoiBucketForDisposition(disposition: FindingDispositionKind): SponsorRoiBucketRule {
  switch (disposition) {
    case "Accepted":
      return { bucketLabel: "Accepted risk", includedInSponsorPacket: true };
    case "RejectedAsNotApplicable":
      return { bucketLabel: "Rejected (not applicable)", includedInSponsorPacket: true };
    case "Deferred":
      return { bucketLabel: "Deferred", includedInSponsorPacket: true };
    case "NeedsEvidence":
      return { bucketLabel: "Needs evidence", includedInSponsorPacket: true };
    case "Remediated":
      return { bucketLabel: "Realized (remediated)", includedInSponsorPacket: true };
    default: {
      const exhaustive: never = disposition;
      return exhaustive;
    }
  }
}

export function dispositionExportSponsorRoiBucketLabel(disposition: FindingDispositionKind): string {
  return sponsorRoiBucketForDisposition(disposition).bucketLabel;
}

/** Export consequences for a finding disposition — aligned to sponsor review packet ROI buckets (TB-2184). */
export function getDispositionExportImpactLines(
  disposition: FindingDispositionKind,
): readonly DispositionExportImpactLine[] {
  const sponsorRule = sponsorRoiBucketForDisposition(disposition);

  return [
    {
      surface: "signed_review_record",
      included: false,
      detail: SIGNED_RECORD_UNCHANGED_DETAIL,
    },
    {
      surface: "sponsor_packet",
      included: sponsorRule.includedInSponsorPacket,
      detail: sponsorRule.includedInSponsorPacket
        ? `Included — projected impact moves to the ${sponsorRule.bucketLabel} line in ${DISPOSITION_EXPORT_IMPACT_SPONSOR_ROI_SECTION_HEADING} on the sponsor review packet. ${SPONSOR_TOP_FINDINGS_DETAIL}`
        : "Not included in sponsor packet ROI disposition buckets.",
    },
    {
      surface: "audit_trail",
      included: true,
      detail: AUDIT_TRAIL_INCLUDED_DETAIL,
    },
  ];
}

export function dispositionExportImpactSurfaceLabel(surface: DispositionExportImpactSurface): string {
  switch (surface) {
    case "signed_review_record":
      return "Sealed review record";
    case "sponsor_packet":
      return "Sponsor packet";
    case "audit_trail":
      return "Audit trail";
    default: {
      const exhaustive: never = surface;
      return exhaustive;
    }
  }
}

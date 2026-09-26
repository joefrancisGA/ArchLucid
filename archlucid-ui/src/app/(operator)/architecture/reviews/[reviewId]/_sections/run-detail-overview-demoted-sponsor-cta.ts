/** Demoted sponsor report CTA on overview when the run is finished but not buyer-finalized. */
export function shouldShowOverviewDemotedSponsorReportCta(
  buyerFinalizedPackage: boolean,
  runCompleted: boolean,
): boolean {
  if (buyerFinalizedPackage) {
    return false;
  }

  return runCompleted;
}

/**
 * Maps persisted manifest status to a reviewer-facing approval check label.
 * API may emit `Committed` for a finalized record; UI elsewhere maps that to "Finalized".
 */
export function governanceGateLabelFromManifestStatus(status: string | undefined | null): string {
  if (status === null || status === undefined) {
    return "Manifest status was not stored.";
  }

  const t = status.trim();

  if (t.length === 0) {
    return "Status not recognized";
  }

  if (/^committed$/i.test(t) || /^finalized$/i.test(t) || /^approved$/i.test(t)) {
    return "Passed";
  }

  if (/^fail/i.test(t) || /^reject/i.test(t) || /^blocked$/i.test(t)) {
    return "Failed";
  }

  if (/^not[\s_-]*required$/i.test(t) || /^skipped$/i.test(t)) {
    return "Not required";
  }

  return "Status not recognized";
}

/** Operator hint when manifest status did not map to a known gate label (UU-507). */
export function governanceGatePersistedStatusHint(manifestStatus: string | undefined | null): string {
  const raw = (manifestStatus ?? "").trim();

  if (raw.length === 0) {
    return "No manifest status was returned.";
  }

  return `Persisted manifest status: ${raw}`;
}

/** Footnote when buyer-polished copy differs from the operator gate label (UU-507). */
export function governanceGateOperatorFootnote(
  operatorGateLabel: string | null | undefined,
  displayedGateLabel: string | null | undefined,
): string | null {
  const operator = (operatorGateLabel ?? "").trim();
  const displayed = (displayedGateLabel ?? "").trim();

  if (operator.length === 0 || displayed.length === 0 || operator === displayed) {
    return null;
  }

  return `Operator gate: ${operator}`;
}

/**
 * Buyer-facing label: operators still see "Passed" from {@link governanceGateLabelFromManifestStatus};
 * procurement language uses "Approved with monitoring" for the same gate state.
 */
export function buyerGovernanceApprovalDisplayLabel(gateLabel: string | undefined | null): string {
  const t = (gateLabel ?? "").trim();

  if (t.length === 0) {
    return "Not configured";
  }

  if (t === "Passed") {
    return "Approved with monitoring";
  }

  return t;
}

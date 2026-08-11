/**
 * Soft sponsor-path gate for first-session ROI baselines (H8 / TB-2204).
 * Prefer warn-and-continue over blocking export when baselines are missing.
 */

import { ARCHITECTURE_SCORECARD_PATH } from "@/lib/architecture-scorecard-route";

export type SponsorRoiBaselineGateStatus = "ready" | "missing-baselines" | "not-applicable";

export type ResolveSponsorRoiBaselineGateInput = {
  readonly hasBaselines: boolean;
  readonly isFinalized: boolean;
};

/** Deep-link to scorecard ROI assumption capture (accepts #roi-baselines alias on the page). */
export const SPONSOR_ROI_BASELINE_SCORECARD_HREF = `${ARCHITECTURE_SCORECARD_PATH}#roi-assumptions` as const;

export const SPONSOR_ROI_BASELINE_GATE_HEADLINE = "ROI baselines not captured";

export const SPONSOR_ROI_BASELINE_GATE_BODY =
  "Sponsor packets are clearer with review-cycle and manual-prep baselines. Capture them on the scorecard, or send anyway if this packet is baseline-blind on purpose.";

export const SPONSOR_ROI_BASELINE_GATE_CAPTURE_CTA = "Add ROI assumptions";

export const SPONSOR_ROI_BASELINE_GATE_SEND_ANYWAY_CTA = "Send anyway";

/**
 * Resolves whether the sponsor-send path should warn about missing ROI baselines.
 * Not-applicable when the package is not finalized; ready when baselines exist.
 */
export function resolveSponsorRoiBaselineGate(
  input: ResolveSponsorRoiBaselineGateInput,
): SponsorRoiBaselineGateStatus {
  if (!input.isFinalized) {
    return "not-applicable";
  }

  if (input.hasBaselines) {
    return "ready";
  }

  return "missing-baselines";
}

/** True when the soft warning banner should render (exports stay enabled). */
export function shouldShowSponsorRoiBaselineGateNotice(
  status: SponsorRoiBaselineGateStatus,
): boolean {
  return status === "missing-baselines";
}

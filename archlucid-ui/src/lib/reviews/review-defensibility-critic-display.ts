export const CRITIC_OUTPUT_NOT_STORED_LABEL = "Critic output was not stored.";

export const CRITIC_HAS_NOT_RUN_YET_LABEL = "Critic has not run yet.";

export const CRITIC_INCLUDED_LABEL = "Included";

/** Labels defensibility-strip critic line without implying a stored critic when the run is still in flight. */
export function formatReviewDefensibilityCriticLabel(
  pipelineInFlight: boolean,
  criticAbsent: boolean,
): string {
  if (pipelineInFlight) {
    return CRITIC_HAS_NOT_RUN_YET_LABEL;
  }

  if (criticAbsent) {
    return CRITIC_OUTPUT_NOT_STORED_LABEL;
  }

  return CRITIC_INCLUDED_LABEL;
}

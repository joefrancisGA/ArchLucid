/** Shown when an action attribution field has no recorded user name. */
export const ACTION_ACTOR_UNAVAILABLE = "N/A";

/**
 * Formats who performed an auditable action — always the recorded user name, never a role title.
 * Returns {@link ACTION_ACTOR_UNAVAILABLE} when the name is missing or blank.
 */
export function formatActionActorName(name: string | null | undefined): string {
  const trimmed = (name ?? "").trim();

  if (trimmed.length === 0) {
    return ACTION_ACTOR_UNAVAILABLE;
  }

  return trimmed;
}

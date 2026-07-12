const DEFAULT_VISIBLE_PREFIX = 8;

/** Short label for dev quick-jump chips while preserving the full id in title/aria-label. */
export function truncateDevTestingEntityId(id: string, visiblePrefix = DEFAULT_VISIBLE_PREFIX): string {
  const trimmed = id.trim();

  if (trimmed.length <= visiblePrefix + 1) {
    return trimmed;
  }

  return `${trimmed.slice(0, visiblePrefix)}…`;
}

export function buildDevTestingQuickJumpAriaLabel(entityLabel: string, id: string): string {
  return `${entityLabel} ${truncateDevTestingEntityId(id)}, open detail`;
}

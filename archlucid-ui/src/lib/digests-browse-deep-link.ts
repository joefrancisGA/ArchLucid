/** Fragment prefix the hub Preview action and schedule links build. */
export const DIGEST_HASH_PREFIX = "digest-" as const;

/** Stable element id for one digest history row — the scroll and hash target. */
export function digestRowElementId(digestId: string): string {
  return `${DIGEST_HASH_PREFIX}${digestId}`;
}

/** Canonical `#digest-{id}` fragment for a digest. */
export function digestHashFragment(digestId: string): string {
  return `#${digestRowElementId(encodeURIComponent(digestId))}`;
}

/**
 * Extracts the digest id from a `#digest-{id}` location hash (TB-1501).
 * Returns `null` for any other fragment so unrelated anchors are ignored.
 */
export function digestIdFromLocationHash(hash: string | null | undefined): string | null {
  if (hash === null || hash === undefined) {
    return null;
  }

  const fragment: string = hash.startsWith("#") ? hash.slice(1) : hash;

  if (!fragment.startsWith(DIGEST_HASH_PREFIX)) {
    return null;
  }

  const rawId: string = fragment.slice(DIGEST_HASH_PREFIX.length);

  if (rawId.trim() === "") {
    return null;
  }

  // Hub links percent-encode the id; malformed sequences fall back to the raw value.
  try {
    return decodeURIComponent(rawId);
  } catch {
    return rawId;
  }
}

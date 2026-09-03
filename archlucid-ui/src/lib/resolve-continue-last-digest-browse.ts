import { asNonemptyReadonlyArray } from "@/lib/continue-last-list-guard";
import type { ArchitectureDigest } from "@/types/advisory-scheduling";

export const DIGEST_BROWSE_LAST_VIEWED_STORAGE_KEY = "archlucid_digest_browse_continue_last_v1";

export type DigestsBrowseContinueLastTarget = {
  readonly digestId: string;
  readonly title: string;
};

function readStoredDigestId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(DIGEST_BROWSE_LAST_VIEWED_STORAGE_KEY)?.trim() ?? "";

    return stored.length > 0 ? stored : null;
  } catch {
    return null;
  }
}

export function writeDigestBrowseLastViewedId(digestId: string): void {
  const normalized = digestId.trim();

  if (normalized.length === 0 || typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(DIGEST_BROWSE_LAST_VIEWED_STORAGE_KEY, normalized);
  } catch {
    /* ignore */
  }
}

function toTarget(digest: ArchitectureDigest): DigestsBrowseContinueLastTarget {
  return {
    digestId: digest.digestId,
    title: digest.title.trim().length > 0 ? digest.title : "Architecture digest",
  };
}

function compareNewestGenerated(left: ArchitectureDigest, right: ArchitectureDigest): number {
  return right.generatedUtc.localeCompare(left.generatedUtc);
}

/** Resolves the digest history row to pin as Continue last viewed. */
export function resolveContinueLastDigestBrowse(digests: unknown): DigestsBrowseContinueLastTarget | null {
  const normalizedDigests = asNonemptyReadonlyArray<ArchitectureDigest>(digests);

  if (normalizedDigests === null) {
    return null;
  }

  const storedId = readStoredDigestId();

  if (storedId !== null) {
    const storedMatch = normalizedDigests.find((digest) => digest.digestId === storedId);

    if (storedMatch !== undefined) {
      return toTarget(storedMatch);
    }
  }

  const newest = normalizedDigests.slice().sort(compareNewestGenerated)[0];

  return newest === undefined ? null : toTarget(newest);
}

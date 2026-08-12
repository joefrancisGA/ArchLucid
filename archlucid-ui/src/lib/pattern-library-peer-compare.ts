import { PATTERN_LIBRARY_SAMPLE_CATALOG, findPatternLibraryRecord } from "@/lib/pattern-library-catalog";
import { patternLibraryDetailPath } from "@/lib/pattern-library-route";
import type { PatternLibraryRecord } from "@/lib/pattern-library-types";

export type PatternLibraryPeerCompareLink = {
  readonly patternKey: string;
  readonly name: string;
  readonly href: string;
  readonly label: string;
};

function arraysOverlap<T>(left: readonly T[], right: readonly T[]): boolean {
  const leftSet = new Set(left);

  return right.some((item) => leftSet.has(item));
}

function pickPeerRecord(
  current: PatternLibraryRecord,
  catalog: readonly PatternLibraryRecord[],
): PatternLibraryRecord | null {
  const others = catalog.filter((record) => record.patternKey !== current.patternKey);

  if (others.length === 0) {
    return null;
  }

  const sameTypeSharedDomain = others.find(
    (peer) => peer.patternType === current.patternType && arraysOverlap(peer.domains, current.domains),
  );

  if (sameTypeSharedDomain !== undefined) {
    return sameTypeSharedDomain;
  }

  const sameTypeSharedPlatform = others.find(
    (peer) => peer.patternType === current.patternType && arraysOverlap(peer.platforms, current.platforms),
  );

  if (sameTypeSharedPlatform !== undefined) {
    return sameTypeSharedPlatform;
  }

  const sharedDomain = others.find((peer) => arraysOverlap(peer.domains, current.domains));

  if (sharedDomain !== undefined) {
    return sharedDomain;
  }

  const sharedPlatform = others.find((peer) => arraysOverlap(peer.platforms, current.platforms));

  if (sharedPlatform !== undefined) {
    return sharedPlatform;
  }

  const currentIndex = catalog.findIndex((record) => record.patternKey === current.patternKey);

  if (currentIndex < 0) {
    return others[0] ?? null;
  }

  const nextIndex = (currentIndex + 1) % catalog.length;
  const nextPeer = catalog[nextIndex];

  if (nextPeer.patternKey === current.patternKey) {
    return null;
  }

  return nextPeer;
}

/** Contextual peer pattern for detail-page compare CTA (TB-1812). Never returns the current key. */
export function resolvePatternLibraryPeerCompare(
  patternKey: string,
  catalog: readonly PatternLibraryRecord[] = PATTERN_LIBRARY_SAMPLE_CATALOG,
): PatternLibraryPeerCompareLink | null {
  const current = findPatternLibraryRecord(patternKey);

  if (current === null) {
    return null;
  }

  const peer = pickPeerRecord(current, catalog);

  if (peer === null) {
    return null;
  }

  return {
    patternKey: peer.patternKey,
    name: peer.name,
    href: patternLibraryDetailPath(peer.patternKey),
    label: `Compare with ${peer.name}`,
  };
}

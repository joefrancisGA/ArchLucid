import type {
  VocabularyPeerLinkSource,
  VocabularyRailLink,
} from "@/components/vocabulary/vocabulary-rail-types";

/** Map vocabulary peer constants onto {@link VocabularyRailLink} entries. */
export function mapVocabularyRailPeerLinks(
  peers: readonly VocabularyPeerLinkSource[],
  resolveTestIdSuffix: (peer: VocabularyPeerLinkSource, index: number) => string,
): readonly VocabularyRailLink[] {
  return peers.map((peer, index) => ({
    href: peer.href,
    label: peer.label,
    testIdSuffix: resolveTestIdSuffix(peer, index),
    compactLineAnchor: peer.compactLineAnchor,
  }));
}

/** Default suffix for paired-surface rails (`peer-link`). */
export function toVocabularyRailPeerLink(
  peer: VocabularyPeerLinkSource,
  testIdSuffix = "peer-link",
): VocabularyRailLink {
  return {
    href: peer.href,
    label: peer.label,
    testIdSuffix,
    compactLineAnchor: peer.compactLineAnchor,
  };
}

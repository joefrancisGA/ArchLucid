import {
  getLoadBearingGlossaryNoun,
  LOAD_BEARING_GLOSSARY_BANNED_BODY_FRAGMENTS,
  LOAD_BEARING_GLOSSARY_NOUN_IDS,
  loadBearingGlossaryHelpHref,
  loadBearingGlossarySeenStorageKey,
  type LoadBearingGlossaryNounId,
} from "@/lib/load-bearing-glossary-nouns";

/** Core product nouns surfaced on the golden path (TB-2134). */
export const GOLDEN_PATH_GLOSSARY_NOUN_IDS = [
  "review-package",
  "evidence-trail",
  "governance-approval",
  "sealed-review-record",
] as const satisfies readonly LoadBearingGlossaryNounId[];

export type GoldenPathGlossaryNounId = (typeof GOLDEN_PATH_GLOSSARY_NOUN_IDS)[number];

export const GOLDEN_PATH_GLOSSARY_SEEN_STORAGE_PREFIX = "golden-path-glossary-seen-";

/** Phrases that must not appear inside golden-path glossary chip bodies (buyer-noun discipline). */
export const GOLDEN_PATH_GLOSSARY_BANNED_BODY_FRAGMENTS = LOAD_BEARING_GLOSSARY_BANNED_BODY_FRAGMENTS;

export function getGoldenPathGlossaryNoun(id: GoldenPathGlossaryNounId) {
  return getLoadBearingGlossaryNoun(id);
}

export function goldenPathGlossaryHelpHref(id: GoldenPathGlossaryNounId): string {
  return loadBearingGlossaryHelpHref(id);
}

export function goldenPathGlossarySeenStorageKey(id: GoldenPathGlossaryNounId): string {
  return `${GOLDEN_PATH_GLOSSARY_SEEN_STORAGE_PREFIX}${id}`;
}

/** @internal TB-2239 parity guard — golden-path ids must stay a subset of load-bearing ids. */
export const GOLDEN_PATH_GLOSSARY_NOUN_ID_PARITY = LOAD_BEARING_GLOSSARY_NOUN_IDS;

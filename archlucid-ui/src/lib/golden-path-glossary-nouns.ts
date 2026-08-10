import {
  getCustomerGlossaryTermById,
  type CustomerGlossaryTerm,
} from "@/lib/customer-glossary-manifest";

/** Core product nouns surfaced on the golden path (TB-2134). */
export const GOLDEN_PATH_GLOSSARY_NOUN_IDS = [
  "review-package",
  "evidence-trail",
  "governance-approval",
  "signed-review-record",
] as const;

export type GoldenPathGlossaryNounId = (typeof GOLDEN_PATH_GLOSSARY_NOUN_IDS)[number];

export const GOLDEN_PATH_GLOSSARY_SEEN_STORAGE_PREFIX = "golden-path-glossary-seen-";

/** Phrases that must not appear inside golden-path glossary chip bodies (buyer-noun discipline). */
export const GOLDEN_PATH_GLOSSARY_BANNED_BODY_FRAGMENTS = [
  "golden manifest",
  "signed manifest",
  "authority run",
  "architecture manifest",
  "job ",
  "intake",
] as const;

export function getGoldenPathGlossaryNoun(id: GoldenPathGlossaryNounId): CustomerGlossaryTerm {
  const term = getCustomerGlossaryTermById(id);

  if (term === null) {
    throw new Error(`Missing golden-path glossary noun: ${id}`);
  }

  return term;
}

export function goldenPathGlossaryHelpHref(id: GoldenPathGlossaryNounId): string {
  return `/help/glossary#term-${id}`;
}

export function goldenPathGlossarySeenStorageKey(id: GoldenPathGlossaryNounId): string {
  return `${GOLDEN_PATH_GLOSSARY_SEEN_STORAGE_PREFIX}${id}`;
}

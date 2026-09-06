import {
  getCustomerGlossaryTermById,
  type CustomerGlossaryTerm,
} from "@/lib/customer-glossary-manifest";

/**
 * TB-2239 — load-bearing invented product nouns eligible for inline glossary chips.
 * Golden-path subset remains in `golden-path-glossary-nouns.ts` (TB-2134).
 */
export const LOAD_BEARING_GLOSSARY_NOUN_IDS = [
  "architecture",
  "review-package",
  "evidence-trail",
  "governance-approval",
  "sealed-review-record",
  "finding",
  "decision",
  "deliverable",
  "policy-pack",
  "architecture-draft",
  "audit-trail",
] as const;

export type LoadBearingGlossaryNounId = (typeof LOAD_BEARING_GLOSSARY_NOUN_IDS)[number];

export const LOAD_BEARING_GLOSSARY_SEEN_STORAGE_PREFIX = "load-bearing-glossary-seen-";

/** Phrases that must not appear inside inline glossary chip bodies (buyer-noun discipline). */
export const LOAD_BEARING_GLOSSARY_BANNED_BODY_FRAGMENTS = [
  "golden manifest",
  "signed manifest",
  "authority run",
  "architecture manifest",
  "job ",
  "intake",
] as const;

export function getLoadBearingGlossaryNoun(id: LoadBearingGlossaryNounId): CustomerGlossaryTerm {
  const term = getCustomerGlossaryTermById(id);

  if (term === null) {
    throw new Error(`Missing load-bearing glossary noun: ${id}`);
  }

  return term;
}

export function loadBearingGlossaryHelpHref(id: LoadBearingGlossaryNounId): string {
  return `/help/glossary#term-${id}`;
}

export function loadBearingGlossarySeenStorageKey(id: LoadBearingGlossaryNounId): string {
  return `${LOAD_BEARING_GLOSSARY_SEEN_STORAGE_PREFIX}${id}`;
}

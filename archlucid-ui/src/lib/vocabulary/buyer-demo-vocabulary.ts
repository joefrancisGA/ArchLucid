import { isBuyerVocabularyPassActive } from "@/lib/demo-ui-env";

const WHOLE_WORD_REPLACEMENTS: readonly { readonly pattern: RegExp; readonly replacement: string }[] = [
  { pattern: /\bruns\b/gi, replacement: "reviews" },
  { pattern: /\brun\b/gi, replacement: "review" },
  { pattern: /\bmanifests\b/gi, replacement: "signed packages" },
  { pattern: /\bmanifest\b/gi, replacement: "signed package" },
  { pattern: /\bcommits\b/gi, replacement: "finalizations" },
  { pattern: /\bcommit\b/gi, replacement: "finalize" },
  { pattern: /\bcommitted\b/gi, replacement: "finalized" },
];

/** Maps engineering terms to buyer vocabulary when the vocabulary pass is active (#6 / TB-645). */
export function applyBuyerDemoVocabulary(text: string, active: boolean = isBuyerVocabularyPassActive()): string {
  if (!active || text.trim().length === 0) {
    return text;
  }

  let next = text;

  for (const rule of WHOLE_WORD_REPLACEMENTS) {
    next = next.replace(rule.pattern, rule.replacement);
  }

  return next;
}

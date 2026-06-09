import { isCtoDemoVocabularyPassEnv } from "@/lib/cto-demo-presenter-pack";

const WHOLE_WORD_REPLACEMENTS: readonly { readonly pattern: RegExp; readonly replacement: string }[] = [
  { pattern: /\bruns\b/gi, replacement: "reviews" },
  { pattern: /\brun\b/gi, replacement: "review" },
  { pattern: /\bmanifests\b/gi, replacement: "signed packages" },
  { pattern: /\bmanifest\b/gi, replacement: "signed package" },
  { pattern: /\bcommits\b/gi, replacement: "finalizations" },
  { pattern: /\bcommit\b/gi, replacement: "finalize" },
  { pattern: /\bcommitted\b/gi, replacement: "finalized" },
];

/** Maps engineering terms to buyer demo vocabulary when the vocabulary pass is active (#6). */
export function applyBuyerDemoVocabulary(text: string, active: boolean = isCtoDemoVocabularyPassEnv()): string {
  if (!active || text.trim().length === 0) {
    return text;
  }

  let next = text;

  for (const rule of WHOLE_WORD_REPLACEMENTS) {
    next = next.replace(rule.pattern, rule.replacement);
  }

  return next;
}

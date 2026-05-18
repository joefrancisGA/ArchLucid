/**
 * Preferred first sentence for buyer-polished Ask answers (Risk/Evidence/… layouts).
 *
 * Prefer ending on `.`, `!`, or `?`. When none match, trims to a capped span so headings never flood the viewport.
 */
export function splitBuyerAskExecutiveLead(text: string): { readonly sentence: string; readonly rest: string } {
  const t = text.trim();

  if (t.length === 0) {
    return { sentence: "", rest: "" };
  }

  const match = /^(.+?[.!?])([\s\S]*)$/u.exec(t);

  if (match !== null && match[1] !== undefined) {
    const sentence = match[1].trim();
    const rest = (match[2] ?? "").trim();

    return { sentence, rest };
  }

  const cap = Math.min(t.length, 260);

  return { sentence: t.slice(0, cap).trimEnd(), rest: "" };
}

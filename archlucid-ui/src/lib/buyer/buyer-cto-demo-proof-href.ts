import type { CtoDemoQuestion } from "@/lib/buyer/buyer-cto-demo-cto-questions";

export function buildCtoDemoProofHref(question: CtoDemoQuestion): string {
  let href = question.proofHref;

  if (question.proofQueryParam !== undefined && question.proofQueryParam.length > 0) {
    const separator = href.includes("?") ? "&" : "?";

    href = `${href}${separator}${question.proofQueryParam}`;
  }

  if (question.proofFragment !== undefined && question.proofFragment.length > 0) {
    href = `${href}#${question.proofFragment}`;
  }

  return href;
}

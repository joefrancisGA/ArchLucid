/**
 * Buyer-facing copy normalization: prefer review / architecture review over legacy run-primary labels,
 * and sealed review record over internal "golden manifest" jargon. API fields (`runId`, routes) are unchanged.
 */

import {
  REVIEW_PACKAGE_LABEL,
  SIGNED_MANIFEST_LABEL,
} from "@/lib/usability/canonical-product-terms";

const RUN_PRIMARY_REPLACEMENTS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bcannot create runs\b/gi, "cannot create reviews"],
  [/\bcreate runs\b/gi, "create reviews"],
  [/\barchitecture runs\b/gi, "architecture reviews"],
  [/\barchitecture run\b/gi, "architecture review"],
  [/\bparent run\b/gi, "parent review"],
  [/\bseparate run\b/gi, "separate review"],
  [/\bre-run on real\b/gi, "re-execute in Real"],
  [/\brun the assessment\b/gi, "execute the review"],
  [/\brun-create\b/gi, "review-create"],
  [/\bstarter run\b/gi, "starter review"],
];

const MANIFEST_PRIMARY_REPLACEMENTS: ReadonlyArray<readonly [RegExp, string]> = [
  // Package mislabeled as "decision record" (legacy sponsor synonym) → sealed review record.
  [/\bsigned decision records\b/gi, `${SIGNED_MANIFEST_LABEL}s`],
  [/\bsigned decision record\b/gi, SIGNED_MANIFEST_LABEL],
  [/\breviewed decision records\b/gi, `${SIGNED_MANIFEST_LABEL}s`],
  [/\breviewed decision record\b/gi, SIGNED_MANIFEST_LABEL],
  [/\bfinalized decision records\b/gi, `${SIGNED_MANIFEST_LABEL}s`],
  [/\bfinalized decision record\b/gi, SIGNED_MANIFEST_LABEL],
  [/\bgoverned decision records\b/gi, `${SIGNED_MANIFEST_LABEL}s`],
  [/\bgoverned decision record\b/gi, SIGNED_MANIFEST_LABEL],
  [/\bgolden manifests\b/gi, `${SIGNED_MANIFEST_LABEL}s`],
  [/\bgolden manifest\b/gi, SIGNED_MANIFEST_LABEL],
  [/\bcommitted manifests\b/gi, `finalized ${REVIEW_PACKAGE_LABEL.toLowerCase()}s`],
  [/\bcommitted manifest\b/gi, `finalized ${REVIEW_PACKAGE_LABEL.toLowerCase()}`],
  [/\bfinalized manifest\b/gi, `finalized ${REVIEW_PACKAGE_LABEL.toLowerCase()}`],
  [/\barchitecture manifest\b/gi, REVIEW_PACKAGE_LABEL],
  [/\bmanifest diff\b/gi, "review comparison"],
  [/\bmanifest comparison\b/gi, "review comparison"],
  [/\bmanifest decision\b/gi, "review record decision"],
  [/\bmanifest summary\b/gi, `${REVIEW_PACKAGE_LABEL.toLowerCase()} summary`],
  [/\bmanifest record\b/gi, SIGNED_MANIFEST_LABEL],
  [/\bmanifest not found\b/gi, `${REVIEW_PACKAGE_LABEL.toLowerCase()} not found`],
  [/\bopen manifest\b/gi, `open ${REVIEW_PACKAGE_LABEL.toLowerCase()}`],
];

/**
 * Operator → architect persona replacements for buyer-visible UI copy.
 * API role ids (`Operator`) and internal route groups (`(operator)`) are unchanged at the source.
 */
const OPERATOR_PERSONA_REPLACEMENTS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\boperator-level permissions\b/gi, "elevated permissions"],
  [/\boperator-level permission\b/gi, "elevated permissions"],
  [/\boperator-level access\b/gi, "elevated access"],
  [/\boperator permissions\b/gi, "architect permissions"],
  [/\boperator permission\b/gi, "architect permission"],
  [/\boperator access\b/gi, "architect access"],
  [/\boperator audit events\b/gi, "workspace audit events"],
  [/\boperator workflows\b/gi, "architect workflows"],
  [/\boperator workflow\b/gi, "architect workflow"],
  [/\boperator surfaces\b/gi, "workspace surfaces"],
  [/\boperator surface\b/gi, "workspace surface"],
  [/\boperator header\b/gi, "workspace header"],
  [/\boperator help shell\b/gi, "architect help"],
  [/\boperator help\b/gi, "architect help"],
  [/\boperator activity log\b/gi, "workspace activity log"],
  [/\boperator diagnostics\b/gi, "workspace diagnostics"],
  [/\boperator orientation\b/gi, "architect orientation"],
  [/\boperator field reference\b/gi, "architect field reference"],
  [/\boperator command-center\b/gi, "architect command center"],
  [/\boperator demo\b/gi, "architect demo"],
  [/\boperator feedback\b/gi, "architect feedback"],
  [/\boperator tooling\b/gi, "advanced tooling"],
  [/\boperator memory\b/gi, "manual scheduling"],
  [/\boperator notes\b/gi, "architect notes"],
  [/\boperator views\b/gi, "architect views"],
  [/\bplatform operators\b/gi, "platform administrators"],
  [/\binternal operators\b/gi, "internal administrators"],
  [/\bcustomer-success operators\b/gi, "customer-success teams"],
  [/\boperators and evaluators\b/gi, "architects and evaluators"],
  [/\boperators and buyers\b/gi, "architects and buyers"],
  [/\bfor operators\b/gi, "for architects"],
  [/\boperators can\b/gi, "architects can"],
  [/\bOperators configure\b/g, "Architects configure"],
  [/\boperators configure\b/gi, "architects configure"],
  [/\boperators should\b/gi, "architects should"],
  [/\boperators take\b/gi, "architects take"],
  [/\boperators capture\b/gi, "architects capture"],
  [/\boperators invite\b/gi, "architects invite"],
  [/\boperators provision\b/gi, "platform administrators provision"],
  [/\boperators unblock\b/gi, "architects unblock"],
  [/\boperators on\b/gi, "architects on"],
  [/\bauthorized operators\b/gi, "authorized architects"],
  [/\bAsk an operator\b/g, "Ask an architect"],
  [/\bask an operator\b/gi, "ask an architect"],
  [/\buntil an operator\b/gi, "until an architect"],
  [/\bafter an operator\b/gi, "after an architect"],
  [/\ban operator\b/gi, "an architect"],
  [/\bneed operator on\b/gi, "need elevated permissions on"],
  [/\bneed operator access\b/gi, "need architect access"],
  [/\boperator on the api\b/gi, "elevated permissions on the API"],
  [/\boperator shell\b/gi, "architect workspace"],
  [/\bpilot operator\b/gi, "architect"],
];

/** Maps legacy operator persona labels in buyer-visible strings to architect vocabulary. */
export function buyerFacingPersonaTerminology(text: string): string {
  let result = text;

  for (const [pattern, replacement] of OPERATOR_PERSONA_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }

  return result;
}

/** Maps legacy run-primary phrases in operator-visible strings to review-first vocabulary. */
export function buyerFacingReviewTerminology(text: string): string {
  let result = text;

  for (const [pattern, replacement] of RUN_PRIMARY_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }

  for (const [pattern, replacement] of MANIFEST_PRIMARY_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }

  result = buyerFacingPersonaTerminology(result);

  return result;
}

/** Maps API or legacy labels that still say "golden manifest" into buyer-facing sealed review record copy. */
export function buyerFacingManifestTerminology(text: string): string {
  let result = text;

  for (const [pattern, replacement] of MANIFEST_PRIMARY_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }

  return result;
}

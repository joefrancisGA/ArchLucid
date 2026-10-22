/**
 * Wizard preset CTA copy. Labels already carry sentence case plus product acronyms
 * (SaaS, EU, US, FedRAMP, StateRAMP, B2B, GDPR). Do not flatten them with toLowerCase —
 * UI_DESIGN_SYSTEM.md § Capitalization: preserve declared casing at the call site.
 */

export type WizardPresetActionLabelOptions = {
  /** Append " starter" for industry-vertical cards. */
  starter?: boolean;
};

/**
 * Builds "Use {label}" button text in sentence case while keeping acronym tokens intact.
 */
export function wizardPresetActionLabel(
  label: string | null | undefined,
  options?: WizardPresetActionLabelOptions,
): string {
  const continuation = formatWizardPresetActionContinuation(label);
  const prefix = `Use ${continuation}`;

  if (options?.starter === true) {
    return `${prefix} starter`;
  }

  return prefix;
}

/**
 * Sentence-case continuation after a leading verb such as "Use".
 * Lowercases a leading ordinary word ("Public" → "public") but leaves acronyms as declared.
 */
export function formatWizardPresetActionContinuation(label: string | null | undefined): string {
  if (label === null || label === undefined) {
    return "template";
  }

  const trimmed = label.trim();

  if (trimmed.length === 0) {
    return "template";
  }

  const firstWhitespace = trimmed.search(/\s/);
  const firstToken = firstWhitespace === -1 ? trimmed : trimmed.slice(0, firstWhitespace);
  const remainder = firstWhitespace === -1 ? "" : trimmed.slice(firstWhitespace);

  if (tokenLooksLikeAcronym(firstToken)) {
    return trimmed;
  }

  return `${firstToken.charAt(0).toLowerCase()}${firstToken.slice(1)}${remainder}`;
}

/**
 * True when a whitespace-delimited token should keep its declared casing.
 * Covers all-caps (EU, US, GDPR), mixed internal caps (SaaS, FedRAMP, StateRAMP, IoT),
 * and letter-digit blends (B2B, PCI-DSS).
 */
export function tokenLooksLikeAcronym(token: string | null | undefined): boolean {
  if (token === null || token === undefined || token.length === 0) {
    return false;
  }

  // Strip wrapping punctuation so "(EU)" or "US," still count as acronyms.
  const core = token.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, "");

  if (core.length === 0) {
    return false;
  }

  if (/^[A-Z]{2,}$/.test(core)) {
    return true;
  }

  if (/^[A-Z0-9]+(?:-[A-Z0-9]+)+$/.test(core)) {
    return true;
  }

  if (/^[A-Z][A-Z0-9]*[0-9][A-Z0-9]*$/.test(core)) {
    return true;
  }

  if (/^[A-Z][a-z]+[A-Z]/.test(core)) {
    return true;
  }

  return false;
}

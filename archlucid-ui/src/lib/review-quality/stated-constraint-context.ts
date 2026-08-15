import type { StatedConstraintContext } from "@/lib/review-quality/assumption-and-severity";

export type ArchitectureRequestConstraintSource = {
  readonly constraints?: readonly string[] | null;
  readonly inlineRequirements?: readonly string[] | null;
  readonly intakeQuestionAnswers?: Readonly<Record<string, string>> | null;
};

const EMPTY_CONTEXT: StatedConstraintContext = {
  rtoMinutes: null,
  rpoMinutes: null,
  monthlyCostCeilingUsd: null,
};

function parseMinutesAfterLabel(text: string, label: "rto" | "rpo"): number | null {
  const pattern = new RegExp(`${label}\\s*[:\\-]?\\s*(\\d+(?:\\.\\d+)?)\\s*(hours?|hrs?|h|minutes?|mins?|m)\\b`, "i");
  const match = pattern.exec(text);

  if (match === null) {
    return null;
  }

  const amount = Number.parseFloat(match[1] ?? "");
  const unit = (match[2] ?? "").toLowerCase();

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  if (unit.startsWith("h")) {
    return Math.round(amount * 60);
  }

  return Math.round(amount);
}

function parseUsdCeiling(text: string): number | null {
  const dollarMatch = /\$\s*([\d,]+(?:\.\d+)?)\s*(k|m)?/i.exec(text);

  if (dollarMatch !== null) {
    const raw = Number.parseFloat((dollarMatch[1] ?? "").replace(/,/g, ""));
    const suffix = (dollarMatch[2] ?? "").toLowerCase();

    if (!Number.isFinite(raw) || raw <= 0) {
      return null;
    }

    if (suffix === "k") {
      return Math.round(raw * 1000);
    }

    if (suffix === "m") {
      return Math.round(raw * 1_000_000);
    }

    return Math.round(raw);
  }

  const ceilingMatch = /(?:monthly|month)\s+(?:cost\s+)?(?:ceiling|budget|cap)\s*(?:of\s+)?\$?\s*([\d,]+)/i.exec(text);

  if (ceilingMatch !== null) {
    const raw = Number.parseFloat((ceilingMatch[1] ?? "").replace(/,/g, ""));

    if (Number.isFinite(raw) && raw > 0) {
      return Math.round(raw);
    }
  }

  return null;
}

function mergeContext(
  base: StatedConstraintContext,
  text: string,
): StatedConstraintContext {
  const rtoMinutes = base.rtoMinutes ?? parseMinutesAfterLabel(text, "rto");
  const rpoMinutes = base.rpoMinutes ?? parseMinutesAfterLabel(text, "rpo");
  const monthlyCostCeilingUsd = base.monthlyCostCeilingUsd ?? parseUsdCeiling(text);

  return {
    rtoMinutes,
    rpoMinutes,
    monthlyCostCeilingUsd,
  };
}

/** TB-2319: derive stated RTO/RPO/cost ceilings from architecture request intake projection. */
export function deriveStatedConstraintContextFromTexts(texts: readonly string[]): StatedConstraintContext {
  let context = EMPTY_CONTEXT;

  for (const text of texts) {
    const trimmed = text.trim();

    if (trimmed.length === 0) {
      continue;
    }

    context = mergeContext(context, trimmed);
  }

  return context;
}

export function deriveStatedConstraintContextFromArchitectureRequest(
  source: ArchitectureRequestConstraintSource,
): StatedConstraintContext {
  const texts: string[] = [];

  for (const line of source.constraints ?? []) {
    if (line.trim().length > 0) {
      texts.push(line);
    }
  }

  for (const line of source.inlineRequirements ?? []) {
    if (line.trim().length > 0) {
      texts.push(line);
    }
  }

  const intakeAnswers = source.intakeQuestionAnswers;

  if (intakeAnswers !== null && intakeAnswers !== undefined) {
    for (const value of Object.values(intakeAnswers)) {
      if (value.trim().length > 0) {
        texts.push(value);
      }
    }
  }

  return deriveStatedConstraintContextFromTexts(texts);
}

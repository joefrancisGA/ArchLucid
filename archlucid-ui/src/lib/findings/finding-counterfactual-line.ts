const COUNTERFACTUAL_NOTE_PREFIX = "counterfactual:";

export function parseCounterfactualFromTraceNotes(
  notes: readonly string[] | null | undefined,
): string | null {
  if (notes === null || notes === undefined) {
    return null;
  }

  for (const note of notes) {
    if (typeof note !== "string") {
      continue;
    }

    const trimmed = note.trim();

    if (trimmed.toLowerCase().startsWith(COUNTERFACTUAL_NOTE_PREFIX)) {
      const sentence = trimmed.slice(COUNTERFACTUAL_NOTE_PREFIX.length).trim();

      return sentence.length > 0 ? sentence : null;
    }
  }

  return null;
}

export function parseCounterfactualFromPrefixedText(text: string | null | undefined): string | null {
  if (text === null || text === undefined) {
    return null;
  }

  const trimmed = text.trim();

  if (!trimmed.toLowerCase().startsWith(COUNTERFACTUAL_NOTE_PREFIX)) {
    return null;
  }

  const sentence = trimmed.slice(COUNTERFACTUAL_NOTE_PREFIX.length).trim();

  return sentence.length > 0 ? sentence : null;
}

export function extractCounterfactualFromFindingWire(wire: Record<string, unknown>): string | null {
  const trace = wire.trace;

  if (trace !== null && typeof trace === "object") {
    const notes = (trace as { notes?: unknown }).notes;

    if (Array.isArray(notes)) {
      const fromNotes = parseCounterfactualFromTraceNotes(
        notes.filter((note): note is string => typeof note === "string"),
      );

      if (fromNotes !== null) {
        return fromNotes;
      }
    }
  }

  const reasoningTrace = wire.reasoningTrace;

  if (typeof reasoningTrace === "string") {
    return parseCounterfactualFromPrefixedText(reasoningTrace);
  }

  return null;
}

export function extractCounterfactualFromQuickDecisionFinding(input: {
  readonly recommendation?: string | null;
  readonly aiReasoning?: { readonly wireJson?: string | null } | null;
}): string | null {
  const fromRecommendation = parseCounterfactualFromPrefixedText(input.recommendation);

  if (fromRecommendation !== null) {
    return fromRecommendation;
  }

  const wireJson = input.aiReasoning?.wireJson;

  if (typeof wireJson !== "string" || wireJson.trim().length === 0) {
    return null;
  }

  try {
    const parsed = JSON.parse(wireJson) as Record<string, unknown>;

    return extractCounterfactualFromFindingWire(parsed);
  } catch {
    return null;
  }
}

/** Sentence case for operator helper copy — counterfactual templates already start with "If". */
export function formatFindingCounterfactualPresentation(line: string): string {
  return line.trim();
}

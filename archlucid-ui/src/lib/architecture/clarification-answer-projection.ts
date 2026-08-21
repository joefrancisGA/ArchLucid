export function formatOperatorAssertedClarificationAnswer(input: {
  readonly questionId: string;
  readonly priorRunId: string;
  readonly answeredAtUtc: string;
  readonly answer: string;
}): string {
  const dateLabel = input.answeredAtUtc.slice(0, 10);
  return `Operator-asserted [q=${input.questionId.trim()}] (review ${input.priorRunId.trim()}, ${dateLabel}): ${input.answer.trim()}`;
}

export function mergeStructuredBriefAssumptions(
  existing: readonly string[] | undefined,
  additions: readonly string[],
): string[] {
  const merged = [...(existing ?? [])];
  for (const addition of additions) {
    const trimmed = addition.trim();
    if (trimmed.length === 0 || merged.includes(trimmed)) {
      continue;
    }
    merged.push(trimmed);
  }
  return merged;
}

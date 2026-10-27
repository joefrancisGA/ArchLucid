/** Clickable follow-ups shown below the latest assistant answer on Ask. */
export const ASK_ASSISTANT_ANSWER_FOLLOW_UP_TOP_RISK_PROMPT = "Why is this the top risk?" as const;

export const ASK_ASSISTANT_ANSWER_FOLLOW_UP_EVIDENCE_PROMPT = "What evidence supports this?" as const;

export const ASK_ASSISTANT_ANSWER_FOLLOW_UP_UNCITED_PROMPT = "This answer did not cite evidence." as const;

export const ASK_ASSISTANT_ANSWER_FOLLOW_UP_CITATIONS_OMITTED_PROMPT =
  "Citation metadata was not stored on this answer." as const;

export const ASK_ASSISTANT_ANSWER_FOLLOW_UP_UNBLOCK_FINALIZE_PROMPT =
  "What would unblock finalize?" as const;

/** @deprecated Use {@link resolveAskAssistantAnswerFollowUpPrompts} for answer-aware chips. */
export const ASK_ASSISTANT_ANSWER_FOLLOW_UP_PROMPTS: readonly string[] = [
  "What did this answer cite?",
  "Which finding is this about?",
  "What is still open on this review?",
];

function answerDeniesTopRisk(answerText: string): boolean {
  return /\bno top risk\b/i.test(answerText) || /\btop risk was not stored\b/i.test(answerText);
}

function answerNamesTopRisk(answerText: string): boolean {
  if (answerDeniesTopRisk(answerText)) {
    return false;
  }

  return /\btop risk\b/i.test(answerText) || /\bhighest(?:\s+priority)?\s+risk\b/i.test(answerText);
}

export type ResolveAskAssistantAnswerFollowUpOptions = {
  readonly hasCitations?: boolean | null;
};

function resolveCitationFollowUpPrompt(hasCitations: boolean | null | undefined): string | null {
  if (hasCitations === true) {
    return ASK_ASSISTANT_ANSWER_FOLLOW_UP_EVIDENCE_PROMPT;
  }

  if (hasCitations === false) {
    return ASK_ASSISTANT_ANSWER_FOLLOW_UP_UNCITED_PROMPT;
  }

  return ASK_ASSISTANT_ANSWER_FOLLOW_UP_CITATIONS_OMITTED_PROMPT;
}

function answerSaysFinalizeIsBlocked(answerText: string): boolean {
  return /\bfinalize\b/i.test(answerText)
    && /\b(block|blocked|blocking|cannot finalize|can't finalize)\b/i.test(answerText);
}

/** Returns follow-up chips appropriate to the cited assistant answer. */
export function resolveAskAssistantAnswerFollowUpPrompts(
  answerText: string,
  options?: ResolveAskAssistantAnswerFollowUpOptions,
): readonly string[] {
  const trimmed = answerText.trim();

  if (trimmed.length === 0) {
    return [];
  }

  const prompts: string[] = [];

  if (answerNamesTopRisk(trimmed)) {
    prompts.push(ASK_ASSISTANT_ANSWER_FOLLOW_UP_TOP_RISK_PROMPT);
  }

  const citationFollowUp = resolveCitationFollowUpPrompt(options?.hasCitations);

  if (citationFollowUp !== null) {
    prompts.push(citationFollowUp);
  }

  if (trimmed.length > 0 && answerSaysFinalizeIsBlocked(trimmed)) {
    prompts.push(ASK_ASSISTANT_ANSWER_FOLLOW_UP_UNBLOCK_FINALIZE_PROMPT);
  }

  return prompts;
}

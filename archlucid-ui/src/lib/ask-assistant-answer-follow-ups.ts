/** Clickable follow-ups shown below the latest assistant answer on Ask. */
export const ASK_ASSISTANT_ANSWER_FOLLOW_UP_TOP_RISK_PROMPT = "Why is this the top risk?" as const;

export const ASK_ASSISTANT_ANSWER_FOLLOW_UP_EVIDENCE_PROMPT = "What evidence supports this?" as const;

export const ASK_ASSISTANT_ANSWER_FOLLOW_UP_UNBLOCK_FINALIZE_PROMPT =
  "What would unblock finalize?" as const;

/** @deprecated Use {@link resolveAskAssistantAnswerFollowUpPrompts} for answer-aware chips. */
export const ASK_ASSISTANT_ANSWER_FOLLOW_UP_PROMPTS: readonly string[] = [
  ASK_ASSISTANT_ANSWER_FOLLOW_UP_TOP_RISK_PROMPT,
  ASK_ASSISTANT_ANSWER_FOLLOW_UP_EVIDENCE_PROMPT,
  ASK_ASSISTANT_ANSWER_FOLLOW_UP_UNBLOCK_FINALIZE_PROMPT,
];

function answerNamesTopRisk(answerText: string): boolean {
  return /\btop risk\b/i.test(answerText) || /\bhighest(?:\s+priority)?\s+risk\b/i.test(answerText);
}

function answerSaysFinalizeIsBlocked(answerText: string): boolean {
  return /\bfinalize\b/i.test(answerText)
    && /\b(block|blocked|blocking|cannot finalize|can't finalize)\b/i.test(answerText);
}

/** Returns follow-up chips appropriate to the cited assistant answer. */
export function resolveAskAssistantAnswerFollowUpPrompts(answerText: string): readonly string[] {
  const trimmed = answerText.trim();
  const prompts: string[] = [];

  if (trimmed.length > 0 && answerNamesTopRisk(trimmed)) {
    prompts.push(ASK_ASSISTANT_ANSWER_FOLLOW_UP_TOP_RISK_PROMPT);
  }

  prompts.push(ASK_ASSISTANT_ANSWER_FOLLOW_UP_EVIDENCE_PROMPT);

  if (trimmed.length > 0 && answerSaysFinalizeIsBlocked(trimmed)) {
    prompts.push(ASK_ASSISTANT_ANSWER_FOLLOW_UP_UNBLOCK_FINALIZE_PROMPT);
  }

  return prompts;
}

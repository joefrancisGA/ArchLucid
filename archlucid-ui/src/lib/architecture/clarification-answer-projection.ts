const CLARIFICATION_ANSWER_PREFIX = "[finding-clarification]";

export function formatClarificationAnswerAssumption(questionId: string, answer: string): string {
  return `${CLARIFICATION_ANSWER_PREFIX} ${answer.trim()} [q=${questionId.trim()}]`;
}

export function projectClarificationAnswersToConfirmedAssumptions(
  answersByQuestionId: Readonly<Record<string, string>>,
): string[] {
  return Object.entries(answersByQuestionId)
    .filter(([, answer]) => answer.trim().length >= 8)
    .map(([questionId, answer]) => formatClarificationAnswerAssumption(questionId, answer));
}

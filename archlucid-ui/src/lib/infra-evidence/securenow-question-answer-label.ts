const ANSWER_LABELS: Readonly<Record<string, string>> = {
  NamePeer: "Name the peer",
  StandsAlone: "It stands alone",
  NotSure: "Not sure",
  Retire: "Retire",
  Keep: "Keep",
  Yes: "Yes",
  No: "No",
  Register: "Register",
  NotASessionHost: "Not a session host",
};

export function secureNowQuestionAnswerLabel(answerCode: string): string {
  const trimmed = answerCode.trim();

  if (trimmed.length === 0) {
    return "Stored answer was stored empty.";
  }

  const label = ANSWER_LABELS[trimmed];

  if (label === undefined) {
    return `Answer code ${trimmed} has no reviewer label.`;
  }

  return label;
}

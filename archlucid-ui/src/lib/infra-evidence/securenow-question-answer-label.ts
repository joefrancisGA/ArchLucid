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
  return ANSWER_LABELS[answerCode] ?? answerCode;
}

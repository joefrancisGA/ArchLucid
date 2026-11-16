/** Decision register empty while capture had gaps — disposition context is not load failure. */
export const DECISION_REGISTER_EMPTY_PARTIAL_CAPTURE_LINE =
  "No decisions are stored yet. A partial capture does not mean the register failed to load — complete recovery before expecting path-linked decisions." as const;
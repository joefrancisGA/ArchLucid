export const ITSM_OAUTH_OPERATOR_CANCEL_NOT_TOKEN_EXCHANGE_LINE =
  "Atlassian consent was denied or cancelled. That is an operator or IdP stop — the token exchange did not run." as const;

export const ITSM_OAUTH_TOKEN_EXCHANGE_FAILURE_NOT_CANCEL_LINE =
  "Atlassian token exchange failed after consent. That is a callback API failure — it is separate from a cancelled consent." as const;

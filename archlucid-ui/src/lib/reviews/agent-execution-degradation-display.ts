export const AGENT_EXECUTION_LIMITATION_CODE_NOT_STORED_LABEL =
  "Limitation code was not stored." as const;

export const AGENT_EXECUTION_LIMITATION_CODE_STORED_EMPTY_LABEL =
  "Limitation code was stored empty." as const;

export function formatAgentExecutionLimitationCodeLabel(
  code: string | null | undefined,
): string {
  if (code === null || code === undefined) {
    return AGENT_EXECUTION_LIMITATION_CODE_NOT_STORED_LABEL;
  }

  const trimmed = code.trim();

  if (trimmed.length === 0) {
    return AGENT_EXECUTION_LIMITATION_CODE_STORED_EMPTY_LABEL;
  }

  return trimmed;
}

export function formatAgentExecutionLimitationSuffix(
  code: string | null | undefined,
): string {
  if (code === null || code === undefined) {
    return "";
  }

  const trimmed = code.trim();

  if (trimmed.length === 0) {
    return ` · ${AGENT_EXECUTION_LIMITATION_CODE_STORED_EMPTY_LABEL}`;
  }

  return ` · Limitation code ${trimmed}`;
}

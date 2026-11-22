/** Connection status dashboard names partial capture versus a failed configuration read. */
export const CONNECTION_STATUS_DASHBOARD_PARTIAL_CAPTURE_LINE =
  "Partial capture can hide connectors until inventory finishes — recover capture before treating missing rows as final configuration." as const;

export const CONNECTION_STATUS_DASHBOARD_PARTIAL_CAPTURE_NOT_LOAD_FAILURE_LINE =
  "This is partial capture recovery guidance — not a failed connection-status read." as const;

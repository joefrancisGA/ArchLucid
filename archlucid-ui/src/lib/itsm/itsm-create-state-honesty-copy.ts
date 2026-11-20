export const ITSM_CREATE_CONNECTOR_OFF_NOT_FAILED_CREATE_LINE =
  "ITSM native create is off for this workspace. That is a connector setting — a ticket was not created and the create call did not fail." as const;

export const ITSM_CREATE_HARD_FAILURE_NOT_EMPTY_LINKAGE_LINE =
  "Ticket create failed on this request. That is a hard create failure — it does not mean the finding has no linked tickets." as const;

export const ITSM_CREATE_EMPTY_LINKAGE_NOT_FAILED_CREATE_LINE =
  "No linked tickets are stored for this finding yet. That is an empty linkage list — create did not fail." as const;

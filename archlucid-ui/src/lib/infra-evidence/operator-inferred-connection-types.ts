export type OperatorInferredConnectionStatus = "Proposed" | "Confirmed" | "Dismissed";

export type OperatorInferredConnectionSource = "upload" | "questionnaire";

export const OPERATOR_INFERRED_CONNECTION_STATUS_NOT_STORED_COPY =
  "Connection status was not stored." as const;

export const OPERATOR_INFERRED_CONNECTION_SOURCE_NOT_STORED_COPY =
  "Connection source was not stored." as const;

export type OperatorInferredConnectionRow = {
  connectionId: string;
  snapshotId: string;
  status: OperatorInferredConnectionStatus | "" | null;
  source: OperatorInferredConnectionSource | "" | null;
  ruleName: string | null;
  questionText: string | null;
  fromArmId: string | null;
  fromLabel: string | null;
  fromCloudResourceId: string | null;
  toHost: string | null;
  toCatalog: string | null;
  toArmId: string | null;
  toCloudResourceId: string | null;
  settingName: string | null;
  sourceFileFormat: string | null;
  provenanceKind: string;
  createdUtc: string;
  updatedUtc: string;
};

export type InferenceQuestionnaireListResponse = {
  items: OperatorInferredConnectionRow[];
  totalCount: number;
  cap: number;
  capReached: boolean;
};

export type OperatorInferredConnectionConfirmRequest = {
  connectionId: string;
  fromCloudResourceId?: string | null;
  toCloudResourceId?: string | null;
  toArmId?: string | null;
  toCatalog?: string | null;
  dataPlaneAnswer?: "Read" | "Write" | null;
};

export type OperatorInferredConnectionDismissRequest = {
  connectionId: string;
};

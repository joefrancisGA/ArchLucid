export type OperatorInferredConnectionStatus = "Proposed" | "Confirmed" | "Dismissed";

export type OperatorInferredConnectionSource = "upload" | "questionnaire";

export type OperatorInferredConnectionRow = {
  connectionId: string;
  snapshotId: string;
  status: OperatorInferredConnectionStatus;
  source: OperatorInferredConnectionSource;
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
};

export type OperatorInferredConnectionDismissRequest = {
  connectionId: string;
};

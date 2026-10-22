export type PillarExaminationState =
  | "Examined"
  | "PartiallyExamined"
  | "NotExamined"
  | "Unavailable";

export type PillarFindingAggregate = {
  pillarKey: string;
  criticalCount: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  dispositionedCount: number;
  mutedCount: number;
};

export type ExaminationStateResolution = {
  state: PillarExaminationState;
  reasonText: string;
};

export type PillarPackAssignment = {
  pillarKey: string;
  policyPackId: string;
  policyPackName: string;
  policyPackVersion: string;
  scopeLevel: string;
  isEnabled: boolean;
  assignedUtc: string;
};

export type PillarPosture = {
  pillarKey: string;
  displayName: string;
  displayOrder: number;
  findingCounts: PillarFindingAggregate;
  examination: ExaminationStateResolution;
  packAssignments: PillarPackAssignment[];
};

export type ReviewIntegrityAggregate = {
  criticalCount: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  dispositionedCount: number;
  mutedCount: number;
};

export type ArchitecturePostureSummary = {
  pillars: PillarPosture[];
  reviewIntegrity: ReviewIntegrityAggregate;
  uncategorizedCount: number;
  primaryPillarKey: string | null;
  latestSnapshotCreatedUtc: string | null;
  isDegraded: boolean;
};

export type ArchitectureReviewRecurrenceSchedule = {
  scheduleId: string;
  sourceRunId: string;
  architectureId?: string | null;
  name: string;
  cronExpression: string;
  isEnabled: boolean;
  nextRunUtc?: string | null;
  lastTriggeredUtc?: string | null;
  lastTriggeredRunId?: string | null;
  lastRunStatus?: string | null;
  lastErrorMessage?: string | null;
  consecutiveFailureCount?: number;
};

export type PreviewRecurrenceScheduleRunsResponse = {
  isValid: boolean;
  validationError?: string | null;
  nextRunUtc: string[];
};

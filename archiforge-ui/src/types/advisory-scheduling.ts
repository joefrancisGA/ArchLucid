export type AdvisoryScanSchedule = {
  scheduleId: string;
  tenantId: string;
  workspaceId: string;
  projectId: string;
  runProjectSlug: string;
  name: string;
  cronExpression: string;
  isEnabled: boolean;
  createdUtc: string;
  lastRunUtc?: string | null;
  nextRunUtc?: string | null;
};

export type AdvisoryScanExecution = {
  executionId: string;
  scheduleId: string;
  startedUtc: string;
  completedUtc?: string | null;
  status: string;
  resultJson: string;
  errorMessage?: string | null;
};

export type ArchitectureDigest = {
  digestId: string;
  tenantId: string;
  workspaceId: string;
  projectId: string;
  runId?: string | null;
  comparedToRunId?: string | null;
  generatedUtc: string;
  title: string;
  summary: string;
  contentMarkdown: string;
  metadataJson: string;
};

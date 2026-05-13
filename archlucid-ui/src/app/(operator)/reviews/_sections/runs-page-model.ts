import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { RunSummary } from "@/types/authority";

/** Resolved query + list payload for the reviews index (server-rendered). */
export type RunsPageModel = {
  readonly projectId: string;
  readonly page: number;
  readonly pageSize: number;
  readonly runs: RunSummary[];
  readonly totalCount: number;
  readonly loadFailure: ApiLoadFailureState | null;
  readonly malformedMessage: string | null;
  readonly usedStaticRunsFallback: boolean;
  readonly nextCursorForClient: string | null;
  readonly projectTitle: string;
  readonly firstCommittedRunId: string | null;
  readonly welcomeOnboardingEligible: boolean;
};

export type RunsPageSearchParams = {
  projectId?: string;
  page?: string;
  pageSize?: string;
  take?: string;
  cursor?: string;
};

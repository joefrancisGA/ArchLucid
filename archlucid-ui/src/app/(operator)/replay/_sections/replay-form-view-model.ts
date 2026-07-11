import type { Dispatch, SetStateAction } from "react";

import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { ReplayValidationHistoryEntry, ReplayValidationOutcome } from "@/lib/replay-validation-workflow";
import type { ReplayResponse } from "@/types/authority";
import type { RunSummary } from "@/types/authority";

export type ReplayFormViewModel = {
  readonly runId: string;
  readonly setRunId: Dispatch<SetStateAction<string>>;
  readonly selectedRun: RunSummary | null;
  readonly setSelectedRun: Dispatch<SetStateAction<RunSummary | null>>;
  readonly mode: string;
  readonly setMode: Dispatch<SetStateAction<string>>;
  readonly modifyConfirmed: boolean;
  readonly setModifyConfirmed: Dispatch<SetStateAction<boolean>>;
  readonly result: ReplayResponse | null;
  readonly failure: ApiLoadFailureState | null;
  readonly malformedMessage: string | null;
  readonly loading: boolean;
  readonly onReplay: () => Promise<void>;
  readonly runIdTrimmed: string;
  readonly historyEntries: readonly ReplayValidationHistoryEntry[];
  readonly lastValidationByRunId: Readonly<Record<string, ReplayValidationOutcome>>;
  readonly actionDisabledReason: string | null;
};

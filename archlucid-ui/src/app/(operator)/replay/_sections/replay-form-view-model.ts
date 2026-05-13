import type { Dispatch, SetStateAction } from "react";

import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { ReplayResponse } from "@/types/authority";

export type ReplayFormViewModel = {
  readonly runId: string;
  readonly setRunId: Dispatch<SetStateAction<string>>;
  readonly mode: string;
  readonly setMode: Dispatch<SetStateAction<string>>;
  readonly result: ReplayResponse | null;
  readonly failure: ApiLoadFailureState | null;
  readonly malformedMessage: string | null;
  readonly loading: boolean;
  readonly onReplay: () => Promise<void>;
  readonly runIdTrimmed: string;
};

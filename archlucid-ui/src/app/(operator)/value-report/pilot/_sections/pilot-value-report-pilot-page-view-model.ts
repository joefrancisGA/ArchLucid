import type { Dispatch, SetStateAction } from "react";

import type { ApiProblemDetails } from "@/lib/api-problem";
import type { PilotValueReportJson } from "@/types/pilot-value-report";

export type PilotValueReportPilotPageError = {
  readonly message: string;
  readonly problem: ApiProblemDetails | null;
  readonly correlationId: string | null;
};

export type PilotValueReportPilotPageViewModel = {
  readonly fromUtc: string;
  readonly setFromUtc: Dispatch<SetStateAction<string>>;
  readonly toUtc: string;
  readonly setToUtc: Dispatch<SetStateAction<string>>;
  readonly data: PilotValueReportJson | null;
  readonly busy: boolean;
  readonly error: PilotValueReportPilotPageError | null;
  readonly load: () => Promise<void>;
  readonly onDownloadMarkdown: () => Promise<void>;
  readonly onEmailSponsor: () => Promise<void>;
};

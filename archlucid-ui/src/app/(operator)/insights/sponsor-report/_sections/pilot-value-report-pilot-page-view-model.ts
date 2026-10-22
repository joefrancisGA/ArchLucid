import type { Dispatch, SetStateAction } from "react";

import type { ApiProblemDetails } from "@/lib/api-problem";
import type { PilotOutcomesPeriodPresetId } from "@/lib/pilot-outcomes-period-presets";
import type { PilotValueReportJson } from "@/types/pilot-value-report";

export type PilotValueReportExportFormat = "markdown" | "pdf" | "csv";

export type PilotValueReportPilotPageError = {
  readonly message: string;
  readonly problem: ApiProblemDetails | null;
  readonly correlationId: string | null;
};

export type PilotOutcomesEmailPreview = {
  readonly recipient: string;
  readonly reportingPeriodLabel: string;
  readonly includedSections: readonly string[];
  readonly attachmentFormat: string;
  readonly basedOnCurrentData: boolean;
};

export type PilotValueReportPilotPageViewModel = {
  readonly fromUtc: string;
  readonly setFromUtc: Dispatch<SetStateAction<string>>;
  readonly toUtc: string;
  readonly setToUtc: Dispatch<SetStateAction<string>>;
  readonly periodPreset: PilotOutcomesPeriodPresetId;
  readonly setPeriodPreset: Dispatch<SetStateAction<PilotOutcomesPeriodPresetId>>;
  readonly applyPeriodPreset: (presetId: PilotOutcomesPeriodPresetId) => void;
  readonly data: PilotValueReportJson | null;
  readonly busy: boolean;
  readonly exportBusy: boolean;
  readonly emailBusy: boolean;
  readonly error: PilotValueReportPilotPageError | null;
  readonly load: () => Promise<void>;
  readonly onDownloadReport: (format: PilotValueReportExportFormat) => Promise<void>;
  /** Sponsor-report DOCX export for the selected period (Execute-gated). */
  readonly onGenerateDocx: () => Promise<void>;
  /** Board pack PDF for the current calendar quarter (Execute-gated). */
  readonly onBoardPack: () => Promise<void>;
  readonly docxBusy: boolean;
  readonly boardBusy: boolean;
  /** True when the signed-in user holds Execute authority for sponsor exports. */
  readonly canMutate: boolean;
  readonly emailPreviewOpen: boolean;
  readonly emailPreview: PilotOutcomesEmailPreview | null;
  readonly openEmailPreview: () => void;
  readonly closeEmailPreview: () => void;
  readonly confirmSendEmail: () => Promise<void>;
  readonly includesSampleData: boolean;
  readonly reportingTimezoneLabel: string;
};

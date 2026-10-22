import type { RoiSummaryPageState } from "./roi-summary-page-types";

export type RoiSummaryPageViewModel = {
  readonly demo: boolean;
  readonly isAdmin: boolean;
  readonly state: RoiSummaryPageState;
  readonly load: () => Promise<void>;
};

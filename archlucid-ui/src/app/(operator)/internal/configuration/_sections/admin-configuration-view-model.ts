import type { Dispatch, SetStateAction } from "react";

import type {
  AdminConfigLintResponse,
  AdminConfigurationLoadState,
  ConfigSummaryKeyRow,
} from "./admin-configuration-types";

export type AdminConfigurationRowSectionGroup = {
  readonly section: string;
  readonly items: ConfigSummaryKeyRow[];
};

/** Prop bundle from `useAdminConfigurationPage` to `AdminConfigurationPageView`. */
export type AdminConfigurationPageViewModel = {
  readonly isDemo: boolean;
  readonly loadState: AdminConfigurationLoadState;
  readonly lintState: AdminConfigurationLoadState;
  readonly lint: AdminConfigLintResponse | null;
  readonly search: string;
  readonly setSearch: Dispatch<SetStateAction<string>>;
  readonly sectionFilter: string;
  readonly setSectionFilter: Dispatch<SetStateAction<string>>;
  readonly sections: string[];
  readonly filteredRows: ConfigSummaryKeyRow[];
  readonly rowsBySection: AdminConfigurationRowSectionGroup[];
  readonly refreshAll: () => Promise<void>;
};

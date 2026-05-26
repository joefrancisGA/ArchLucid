import type {
  CircuitGateRow,
  HealthReadyResponse,
  OperatorTaskSuccessRatesResponse,
  VersionInfoResponse,
} from "@/lib/health-dashboard-types";

import type { AdminHealthConfigLintPayload, ConfigurationHealthPayload } from "./admin-health-types";

/** Props from `useAdminHealthPage` to `AdminHealthPageView`. */
export type AdminHealthPageViewModel = {
  readonly isDemo: boolean;
  readonly loading: boolean;
  readonly refresh: () => Promise<void>;
  readonly ready: HealthReadyResponse | null;
  readonly readyError: string | null;
  readonly version: VersionInfoResponse | null;
  readonly circuitNote: string | null;
  readonly circuitGates: CircuitGateRow[];
  readonly rates: OperatorTaskSuccessRatesResponse | null;
  readonly ratesNote: string | null;
  readonly configLint: AdminHealthConfigLintPayload | null;
  readonly configLintNote: string | null;
  readonly configurationHealth: ConfigurationHealthPayload | null;
  readonly configurationHealthNote: string | null;
};

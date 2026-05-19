import type { HealthReadyResponse, VersionInfoResponse } from "@/lib/health-dashboard-types";
import type { CriticalDependencyRow } from "@/lib/system-health-critical-dependencies";

export type SystemHealthPageViewModel = {
  readonly loading: boolean;
  readonly liveOk: boolean;
  readonly liveStatus: string;
  readonly ready: HealthReadyResponse | null;
  readonly readyError: string | null;
  readonly version: VersionInfoResponse | null;
  readonly criticalDependencies: readonly CriticalDependencyRow[];
  readonly refresh: () => Promise<void>;
};

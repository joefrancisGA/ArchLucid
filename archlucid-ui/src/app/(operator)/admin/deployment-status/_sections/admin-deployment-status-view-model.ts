import type { AdminDeploymentStatusResponse } from "@/lib/admin-deployment-status";

export type AdminDeploymentStatusPageViewModel = {
  readonly isDemo: boolean;
  readonly loading: boolean;
  readonly error: string | null;
  readonly status: AdminDeploymentStatusResponse | null;
  readonly lastRefreshedAt: Date | null;
  readonly refresh: () => Promise<void>;
};

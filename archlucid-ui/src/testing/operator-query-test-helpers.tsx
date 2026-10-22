import type { ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach } from "vitest";

import { invalidateHealthReadySummaryCache } from "@/lib/health-ready-client";
import { createOperatorQueryClient, resetOperatorQueryClientForTests } from "@/lib/query/operator-query-client";
import { invalidateTenantTrialStatusCache } from "@/lib/tenant-trial-status-client";

export function renderWithOperatorQuery(
  ui: ReactElement,
  options?: RenderOptions & { readonly queryClient?: QueryClient },
) {
  const queryClient = options?.queryClient ?? createOperatorQueryClient();

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>, options);
}

/** Resets TanStack Query state before each test that renders operator shell query hooks. */
export function useOperatorQueryTestLifecycle(): void {
  beforeEach(async () => {
    resetOperatorQueryClientForTests();
    await invalidateHealthReadySummaryCache();
    await invalidateTenantTrialStatusCache();
  });
}

"use client";

import { useMemo } from "react";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { useOidcSessionKeepalive } from "@/hooks/use-oidc-session-keepalive";
import { useRunSummaryQuery } from "@/hooks/use-run-summary-query";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  PACKAGE_PRINT_ERROR_FALLBACK,
  PACKAGE_PRINT_LOADING_LABEL,
  buildPackagePrintPresentation,
} from "@/lib/package-print-view";
import { cn } from "@/lib/utils";

import { PackagePrintPageView } from "./PackagePrintPageView";

type PackagePrintPageClientProps = {
  readonly runId: string;
  readonly listScopedRunId?: string | null;
};

/** Client loader for the lightweight print view — run summary only (TB-2205). */
export function PackagePrintPageClient(props: PackagePrintPageClientProps): React.JSX.Element {
  const { runId, listScopedRunId = null } = props;
  const summaryQuery = useRunSummaryQuery(runId);

  useOidcSessionKeepalive(true);

  const failure: ApiLoadFailureState | null = useMemo(
    () => (summaryQuery.isError ? toApiLoadFailure(summaryQuery.error) : null),
    [summaryQuery.error, summaryQuery.isError],
  );

  if (summaryQuery.isPending) {
    return (
      <p
        className={cn("p-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
        role="status"
        data-testid="package-print-loading"
      >
        {PACKAGE_PRINT_LOADING_LABEL}
      </p>
    );
  }

  if (summaryQuery.isError || summaryQuery.data === undefined) {
    return (
      <div className="space-y-3 p-4" data-testid="package-print-error">
        <OperatorApiProblem
          fallbackMessage={failure?.message ?? PACKAGE_PRINT_ERROR_FALLBACK}
          problem={failure?.problem ?? null}
          correlationId={failure?.correlationId ?? null}
        />
        <Button type="button" variant="secondary" onClick={() => void summaryQuery.refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <PackagePrintPageView
      presentation={buildPackagePrintPresentation(summaryQuery.data)}
      listScopedRunId={listScopedRunId}
    />
  );
}

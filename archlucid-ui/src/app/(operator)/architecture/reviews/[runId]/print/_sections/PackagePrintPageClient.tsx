"use client";

import { useEffect, useState } from "react";

import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { getRunSummary } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  PACKAGE_PRINT_ERROR_FALLBACK,
  PACKAGE_PRINT_LOADING_LABEL,
  buildPackagePrintPresentation,
  type PackagePrintPresentation,
} from "@/lib/package-print-view";
import { cn } from "@/lib/utils";

import { PackagePrintPageView } from "./PackagePrintPageView";

type PackagePrintPageClientProps = {
  readonly runId: string;
};

type LoadState =
  | { readonly status: "loading" }
  | { readonly status: "error"; readonly failure: ApiLoadFailureState | null }
  | { readonly status: "ready"; readonly presentation: PackagePrintPresentation };

/** Client loader for the lightweight print view — run summary only (TB-2205). */
export function PackagePrintPageClient(props: PackagePrintPageClientProps): React.JSX.Element {
  const { runId } = props;
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    setState({ status: "loading" });

    void getRunSummary(runId)
      .then((summary) => {
        if (cancelled) {
          return;
        }

        setState({ status: "ready", presentation: buildPackagePrintPresentation(summary) });
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        setState({ status: "error", failure: toApiLoadFailure(error) });
      });

    return () => {
      cancelled = true;
    };
  }, [runId, reloadToken]);

  if (state.status === "loading") {
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

  if (state.status === "error") {
    return (
      <div className="space-y-3 p-4" data-testid="package-print-error">
        <OperatorApiProblem
          fallbackMessage={state.failure?.message ?? PACKAGE_PRINT_ERROR_FALLBACK}
          problem={state.failure?.problem ?? null}
          correlationId={state.failure?.correlationId ?? null}
        />
        <Button type="button" variant="secondary" onClick={() => setReloadToken((value) => value + 1)}>
          Retry
        </Button>
      </div>
    );
  }

  return <PackagePrintPageView presentation={state.presentation} />;
}

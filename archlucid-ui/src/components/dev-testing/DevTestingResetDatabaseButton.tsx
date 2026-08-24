"use client";

import { useState } from "react";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type ResetDatabaseResponse = {
  catalogName?: string;
  demoSeedApplied?: boolean;
};

type ProblemDetails = {
  title?: string;
  detail?: string;
};

async function postResetDatabase(): Promise<ResetDatabaseResponse> {
  const response = await fetch("/api/reset-database", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let detail = `Database reset failed (${response.status}).`;

    try {
      const problem = (await response.json()) as ProblemDetails;

      if (typeof problem.detail === "string" && problem.detail.trim().length > 0) {
        detail = problem.detail;
      } else if (typeof problem.title === "string" && problem.title.trim().length > 0) {
        detail = problem.title;
      }
    } catch {
      // Keep generic detail when the upstream body is not Problem Details JSON.
    }

    throw new Error(detail);
  }

  return (await response.json()) as ResetDatabaseResponse;
}

/** Destructive dev-only action that replays first-install persistence bootstrap on the local SQL catalog. */
export function DevTestingResetDatabaseButton(): React.JSX.Element {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleConfirmReset(): Promise<void> {
    setBusy(true);
    setErrorMessage(null);

    try {
      await postResetDatabase();
      setDialogOpen(false);
      window.location.assign("/");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Database reset failed.";
      setErrorMessage(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <p className={cn("m-0 font-medium text-neutral-700 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>
        Database
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="destructive"
          data-testid="dev-reset-database-button"
          onClick={() => {
            setErrorMessage(null);
            setDialogOpen(true);
          }}
        >
          Reset Database
        </Button>
        {errorMessage !== null ? (
          <p className={cn("m-0 text-[var(--al-danger-text)]", OPERATOR_TYPOGRAPHY.helper)} role="alert">
            {errorMessage}
          </p>
        ) : null}
      </div>

      <ConfirmationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Reset database to first-install state?"
        description="This drops and recreates the local development SQL catalog, then replays migrations, schema bootstrap, default scope rows, and optional demo seed. All existing runs, workspaces, and audit history in this catalog are permanently removed."
        confirmLabel="Reset Database"
        variant="destructive"
        busy={busy}
        onConfirm={() => {
          void handleConfirmReset();
        }}
      />
    </div>
  );
}

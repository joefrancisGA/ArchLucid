"use client";

import { useState } from "react";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { CopyIdButton } from "@/components/CopyIdButton";
import { Button } from "@/components/ui/button";
import { buildApiRequestErrorFromParts } from "@/lib/api-error";
import {
  CORRELATION_ID_HEADER,
  captureTraceContextFromResponse,
  generateCorrelationId,
} from "@/lib/correlation";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { PROXY_UPSTREAM_CATALOG_RESET_FETCH_TIMEOUT_MS } from "@/lib/server-fetch-timeouts";
import { cn } from "@/lib/utils";

type ResetDatabaseResponse = {
  catalogName?: string;
  demoSeedApplied?: boolean;
};

type ResetDatabaseSuccess = {
  catalogName: string | null;
  demoSeedApplied: boolean;
  correlationId: string | null;
  httpStatus: number;
  durationMs: number;
};

type ResetDatabaseFailure = {
  message: string;
  httpStatus: number | null;
  correlationId: string | null;
  durationMs: number;
};

type ResetDatabaseAttemptStatus =
  | { phase: "idle" }
  | { phase: "running"; startedAtMs: number }
  | ({ phase: "success" } & ResetDatabaseSuccess)
  | ({ phase: "error" } & ResetDatabaseFailure);

const RESET_DATABASE_ROUTE = "/api/reset-database";
const SUCCESS_REDIRECT_DELAY_MS = 1_500;
const ADMIN_ROLE_HINT =
  "Database reset requires Admin privileges. Set the dev role override to Admin in this panel, then retry.";

function readCatalogName(payload: ResetDatabaseResponse): string | null {
  const catalogName = payload.catalogName?.trim() ?? "";

  return catalogName.length > 0 ? catalogName : null;
}

function buildAdminRoleHint(httpStatus: number | null): string | null {
  if (httpStatus === 401 || httpStatus === 403) {
    return ADMIN_ROLE_HINT;
  }

  return null;
}

function logResetDatabaseTelemetry(
  level: "info" | "error",
  payload: Record<string, string | number | boolean | null>,
): void {
  const message = "[dev-reset-database]";

  if (level === "info") {
    console.info(message, payload);
  } else {
    console.error(message, payload);
  }
}

async function postResetDatabase(requestCorrelationId: string): Promise<ResetDatabaseSuccess> {
  const startedAtMs = Date.now();
  const response = await fetch(RESET_DATABASE_ROUTE, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      [CORRELATION_ID_HEADER]: requestCorrelationId,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(PROXY_UPSTREAM_CATALOG_RESET_FETCH_TIMEOUT_MS),
  });

  captureTraceContextFromResponse(response);

  const bodyText = await response.text();
  const durationMs = Date.now() - startedAtMs;

  if (!response.ok) {
    const apiError = buildApiRequestErrorFromParts(response, bodyText, requestCorrelationId);
    const adminHint = buildAdminRoleHint(apiError.httpStatus);

    throw Object.assign(apiError, {
      durationMs,
      adminHint,
    });
  }

  let payload: ResetDatabaseResponse = {};

  if (bodyText.trim().length > 0) {
    payload = JSON.parse(bodyText) as ResetDatabaseResponse;
  }

  const correlationId =
    response.headers.get(CORRELATION_ID_HEADER)?.trim() ||
    requestCorrelationId.trim() ||
    null;

  return {
    catalogName: readCatalogName(payload),
    demoSeedApplied: payload.demoSeedApplied === true,
    correlationId,
    httpStatus: response.status,
    durationMs,
  };
}

type ResetDatabaseStatusPanelProps = {
  readonly status: ResetDatabaseAttemptStatus;
};

function ResetDatabaseStatusPanel({ status }: ResetDatabaseStatusPanelProps): React.JSX.Element | null {
  if (status.phase === "idle") {
    return null;
  }

  if (status.phase === "running") {
    return (
      <div
        className={cn(
          "rounded border border-neutral-300 bg-white p-3 text-neutral-800 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-100",
          OPERATOR_TYPOGRAPHY.helper,
        )}
        role="status"
        data-testid="dev-reset-database-status"
      >
        <p className="m-0 font-medium">Resetting database…</p>
        <p className="m-0 mt-1 text-neutral-600 dark:text-neutral-400">
          Calling <code>{RESET_DATABASE_ROUTE}</code>. This can take up to 10 minutes while the catalog is dropped,
          migrations replay, and schema bootstrap runs.
        </p>
      </div>
    );
  }

  if (status.phase === "success") {
    return (
      <div
        className={cn(
          "rounded border border-emerald-300 bg-emerald-50 p-3 text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-100",
          OPERATOR_TYPOGRAPHY.helper,
        )}
        role="status"
        data-testid="dev-reset-database-status"
      >
        <p className="m-0 font-medium">Database reset completed.</p>
        <ul className="m-0 mt-2 list-disc space-y-1 pl-5">
          <li>
            Catalog: <code>{status.catalogName ?? "unknown"}</code>
          </li>
          <li>Demo seed applied: {status.demoSeedApplied ? "yes" : "no"}</li>
          <li>
            HTTP {status.httpStatus} in {status.durationMs} ms
          </li>
        </ul>
        {status.correlationId !== null ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="font-medium">Correlation ID</span>
            <code className="rounded bg-white/70 px-1 py-0.5 font-mono dark:bg-neutral-900/70">{status.correlationId}</code>
            <CopyIdButton value={status.correlationId} aria-label="Copy correlation ID" />
          </div>
        ) : null}
        <p className="m-0 mt-2 text-neutral-700 dark:text-neutral-300">Reloading home…</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded border border-red-300 bg-red-50 p-3 text-red-950 dark:border-red-800 dark:bg-red-950/30 dark:text-red-100",
        OPERATOR_TYPOGRAPHY.helper,
      )}
      role="alert"
      data-testid="dev-reset-database-status"
    >
      <p className="m-0 font-medium">Database reset failed.</p>
      <p className="m-0 mt-1">{status.message}</p>
      {status.httpStatus !== null ? (
        <p className="m-0 mt-1 text-neutral-700 dark:text-neutral-300">
          HTTP {status.httpStatus} after {status.durationMs} ms via <code>{RESET_DATABASE_ROUTE}</code>
        </p>
      ) : null}
      {status.correlationId !== null ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="font-medium">Correlation ID</span>
          <code className="rounded bg-white/70 px-1 py-0.5 font-mono dark:bg-neutral-900/70">{status.correlationId}</code>
          <CopyIdButton value={status.correlationId} aria-label="Copy correlation ID" />
        </div>
      ) : null}
    </div>
  );
}

/** Destructive dev-only action that replays first-install persistence bootstrap on the local SQL catalog. */
export function DevTestingResetDatabaseButton(): React.JSX.Element {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [attemptStatus, setAttemptStatus] = useState<ResetDatabaseAttemptStatus>({ phase: "idle" });
  const [dialogErrorMessage, setDialogErrorMessage] = useState<string | null>(null);
  const [dialogAdminHint, setDialogAdminHint] = useState<string | null>(null);

  async function handleConfirmReset(): Promise<void> {
    const requestCorrelationId = generateCorrelationId();
    const startedAtMs = Date.now();

    setBusy(true);
    setDialogErrorMessage(null);
    setDialogAdminHint(null);
    setAttemptStatus({ phase: "running", startedAtMs });

    logResetDatabaseTelemetry("info", {
      phase: "start",
      route: RESET_DATABASE_ROUTE,
      correlationId: requestCorrelationId,
    });

    try {
      const result = await postResetDatabase(requestCorrelationId);

      setAttemptStatus({
        phase: "success",
        ...result,
      });

      logResetDatabaseTelemetry("info", {
        phase: "success",
        route: RESET_DATABASE_ROUTE,
        correlationId: result.correlationId,
        catalogName: result.catalogName,
        demoSeedApplied: result.demoSeedApplied,
        httpStatus: result.httpStatus,
        durationMs: result.durationMs,
      });

      window.setTimeout(() => {
        setDialogOpen(false);
        window.location.assign("/");
      }, SUCCESS_REDIRECT_DELAY_MS);
    } catch (err: unknown) {
      const durationMs = Date.now() - startedAtMs;
      const apiError = err as {
        message?: string;
        httpStatus?: number;
        correlationId?: string | null;
        adminHint?: string | null;
        durationMs?: number;
      };
      const message =
        typeof apiError.message === "string" && apiError.message.trim().length > 0
          ? apiError.message
          : "Database reset failed.";
      const httpStatus = typeof apiError.httpStatus === "number" ? apiError.httpStatus : null;
      const correlationId =
        typeof apiError.correlationId === "string" && apiError.correlationId.trim().length > 0
          ? apiError.correlationId.trim()
          : requestCorrelationId;
      const adminHint =
        typeof apiError.adminHint === "string" && apiError.adminHint.trim().length > 0
          ? apiError.adminHint
          : buildAdminRoleHint(httpStatus);

      setAttemptStatus({
        phase: "error",
        message,
        httpStatus,
        correlationId,
        durationMs: typeof apiError.durationMs === "number" ? apiError.durationMs : durationMs,
      });
      setDialogErrorMessage(message);
      setDialogAdminHint(adminHint);

      logResetDatabaseTelemetry("error", {
        phase: "error",
        route: RESET_DATABASE_ROUTE,
        correlationId,
        httpStatus,
        durationMs: typeof apiError.durationMs === "number" ? apiError.durationMs : durationMs,
        message,
      });
    } finally {
      setBusy(false);
    }
  }

  const dialogExtraContent = (
    <div className="space-y-2">
      <p className={cn("m-0 text-neutral-600 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
        SQL Server Management Studio: connect to the master database and run{" "}
        <code className="font-mono text-[0.95em]">
          EXEC dbo.usp_ArchLucid_ResetDevelopmentCatalog @DatabaseName = N&apos;ArchLucid&apos;, @Confirm =
          N&apos;RESET&apos;;
        </code>{" "}
        then restart the API so schema and demo data return.
      </p>
      {dialogErrorMessage !== null || dialogAdminHint !== null ? (
        <div className="space-y-2" data-testid="dev-reset-database-dialog-feedback">
          {dialogErrorMessage !== null ? (
            <p className={cn("m-0 text-[var(--al-danger-text)]", OPERATOR_TYPOGRAPHY.helper)} role="alert">
              {dialogErrorMessage}
            </p>
          ) : null}
          {dialogAdminHint !== null ? (
            <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
              {dialogAdminHint}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );

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
            setDialogErrorMessage(null);
            setDialogAdminHint(null);
            setDialogOpen(true);
          }}
        >
          Reset Database
        </Button>
      </div>

      <ResetDatabaseStatusPanel status={attemptStatus} />

      <ConfirmationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Reset database to first-install state?"
        description="This drops and recreates the local development SQL catalog, then replays migrations, schema bootstrap, default scope rows, and optional demo seed. The request is allowed to run for up to 10 minutes. All existing runs, workspaces, and audit history in this catalog are permanently removed."
        extraContent={dialogExtraContent}
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

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { initializeArchitectureCreation } from "@/lib/architecture-creation-init";
import { clearArchitectureCreationDraftId } from "@/lib/architecture-creation-session";
import { trackArchitectureDraftResumeClick } from "@/lib/architecture-draft-resume-telemetry";
import {
  listArchitectureDraftRegistryEntries,
  type ArchitectureDraftRegistryEntry,
} from "@/lib/architecture-draft-registry";
import {
  ARCHITECTURE_DRAFT_STATUS_LABELS,
  type ArchitectureDraftCustomerStatus,
} from "@/lib/architecture-draft-status";
import {
  architectureDraftPath,
  ARCHITECTURES_LIST_PATH,
} from "@/lib/architecture-routes";
import {
  CONTINUE_DRAFT_LABEL,
  START_NEW_ARCHITECTURE_LABEL,
  VIEW_ALL_DRAFTS_LABEL,
} from "@/lib/architecture-workflow-labels";
import {
  ARCHITECTURE_CREATION_AUTOSAVE_REASSURANCE,
  ARCHITECTURE_CREATION_CONTINUE_SECTION_TITLE,
  ARCHITECTURE_CREATION_NO_DRAFTS_GUIDANCE,
  ARCHITECTURE_CREATION_RECENT_DRAFTS_SECTION_TITLE,
  ARCHITECTURE_CREATION_REVIEW_BOUNDARY,
} from "@/lib/create-vs-review-intake-copy";
import {
  CREATE_ARCHITECTURE_BOOTSTRAP_TIMEOUT_MS,
  CREATE_ARCHITECTURE_DRAFT_START_FAILED_MESSAGE,
  CREATE_ARCHITECTURE_STARTING_LABEL,
} from "@/lib/review-start-progress-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type BootstrapMode = "loading" | "ready" | "creating";

const RECENT_DRAFTS_PREVIEW_LIMIT = 3;

function formatDraftUpdatedLabel(updatedUtc: string): string {
  const parsed = Date.parse(updatedUtc);

  if (Number.isNaN(parsed)) {
    return "recently";
  }

  return new Date(parsed).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusTagKind(status: ArchitectureDraftCustomerStatus): "ready" | "in-progress" | "needs-attention" {
  if (status === "ready-for-review") {
    return "ready";
  }

  if (status === "archived") {
    return "needs-attention";
  }

  return "in-progress";
}

function DraftResumeCard(props: {
  readonly entry: ArchitectureDraftRegistryEntry;
  readonly primary?: boolean;
}): React.JSX.Element {
  const { entry, primary = false } = props;

  return (
    <li
      className="rounded-lg border border-al-border-subtle bg-al-surface-raised p-4"
      data-testid={`architecture-creation-resume-${entry.architectureId}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="m-0 break-words font-medium text-al-text-primary">{entry.displayName}</p>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-al-text-secondary")}>
            Updated {formatDraftUpdatedLabel(entry.lastUpdatedUtc)}
          </p>
          <StatusTag
            kind={statusTagKind(entry.customerStatus)}
            label={ARCHITECTURE_DRAFT_STATUS_LABELS[entry.customerStatus]}
          />
        </div>
        <Button type="button" variant={primary ? "primary" : "outline"} size="sm" asChild>
          <Link
            href={architectureDraftPath(entry.architectureId)}
            data-testid={`architecture-creation-continue-${entry.architectureId}`}
            onClick={() => {
              trackArchitectureDraftResumeClick("architectures-new", entry.architectureId);
            }}
          >
            {CONTINUE_DRAFT_LABEL}
          </Link>
        </Button>
      </div>
    </li>
  );
}

/** Stable architecture-creation entry — resume drafts or start a new one without starting a review. */
export function ArchitectureCreationBootstrap(): React.JSX.Element {
  const router = useRouter();
  const createInFlightRef = useRef(false);
  const createTimeoutIdRef = useRef<number | null>(null);
  const [mode, setMode] = useState<BootstrapMode>("loading");
  const [draftEntries, setDraftEntries] = useState<readonly ArchitectureDraftRegistryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const entries = listArchitectureDraftRegistryEntries();
    setDraftEntries(entries);
    setMode("ready");
  }, []);

  useEffect(() => {
    return () => {
      if (createTimeoutIdRef.current !== null) {
        window.clearTimeout(createTimeoutIdRef.current);
        createTimeoutIdRef.current = null;
      }
    };
  }, []);

  const failCreate = (message: string) => {
    if (createTimeoutIdRef.current !== null) {
      window.clearTimeout(createTimeoutIdRef.current);
      createTimeoutIdRef.current = null;
    }

    createInFlightRef.current = false;
    setError(message);
    setMode("ready");
  };

  const startNewDraft = () => {
    if (createInFlightRef.current || mode === "creating") {
      return;
    }

    createInFlightRef.current = true;
    setError(null);
    setMode("creating");
    clearArchitectureCreationDraftId();

    createTimeoutIdRef.current = window.setTimeout(() => {
      failCreate(CREATE_ARCHITECTURE_DRAFT_START_FAILED_MESSAGE);
    }, CREATE_ARCHITECTURE_BOOTSTRAP_TIMEOUT_MS);

    void initializeArchitectureCreation()
      .then((result) => {
        // Timeout recovery already cleared the in-flight flag — ignore a late success.
        if (!createInFlightRef.current) {
          return;
        }

        if (result.draftId === null) {
          failCreate(CREATE_ARCHITECTURE_DRAFT_START_FAILED_MESSAGE);

          return;
        }

        if (createTimeoutIdRef.current !== null) {
          window.clearTimeout(createTimeoutIdRef.current);
          createTimeoutIdRef.current = null;
        }

        router.replace(architectureDraftPath(result.draftId));
      })
      .catch(() => {
        if (!createInFlightRef.current) {
          return;
        }

        failCreate(CREATE_ARCHITECTURE_DRAFT_START_FAILED_MESSAGE);
      });
  };

  if (mode === "loading") {
    return (
      <div
        className="max-w-2xl space-y-3"
        data-testid="architecture-creation-bootstrap-loading"
        aria-busy="true"
        aria-live="polite"
      >
        <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
        <div className="h-24 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
        <span className="sr-only">Loading architecture drafts</span>
      </div>
    );
  }

  if (mode === "creating") {
    return (
      <div
        className="max-w-2xl space-y-3"
        data-testid="architecture-creation-bootstrap-creating"
        aria-busy="true"
        aria-live="polite"
      >
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{CREATE_ARCHITECTURE_STARTING_LABEL}</p>
        <Button type="button" variant="primary" size="sm" disabled aria-busy="true">
          {CREATE_ARCHITECTURE_STARTING_LABEL}
        </Button>
      </div>
    );
  }

  const previewEntries = draftEntries.slice(0, RECENT_DRAFTS_PREVIEW_LIMIT);
  const hasDrafts = previewEntries.length > 0;
  const sectionTitle =
    previewEntries.length === 1
      ? ARCHITECTURE_CREATION_CONTINUE_SECTION_TITLE
      : ARCHITECTURE_CREATION_RECENT_DRAFTS_SECTION_TITLE;

  return (
    <div className="max-w-2xl space-y-4" data-testid="architecture-creation-bootstrap-ready">
      {error !== null ? (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} role="alert" data-testid="architecture-creation-bootstrap-error">
          {error}
        </p>
      ) : null}

      {hasDrafts ? (
        <section aria-labelledby="architecture-creation-drafts-heading">
          <h3
            id="architecture-creation-drafts-heading"
            className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
          >
            {sectionTitle}
          </h3>
          <ul className="m-0 mt-3 list-none space-y-3 p-0" data-testid="architecture-creation-bootstrap-resume-choice">
            {previewEntries.map((entry, index) => (
              <DraftResumeCard key={entry.architectureId} entry={entry} primary={index === 0} />
            ))}
          </ul>
        </section>
      ) : (
        <p className={cn("m-0 max-w-prose", OPERATOR_TYPOGRAPHY.helper)} data-testid="architecture-creation-bootstrap-empty">
          {ARCHITECTURE_CREATION_NO_DRAFTS_GUIDANCE}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={hasDrafts ? "outline" : "primary"}
          size="sm"
          onClick={startNewDraft}
          data-testid="architecture-creation-start-new"
        >
          {START_NEW_ARCHITECTURE_LABEL}
        </Button>
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href={ARCHITECTURES_LIST_PATH} data-testid="architecture-creation-view-all-drafts">
            {VIEW_ALL_DRAFTS_LABEL}
          </Link>
        </Button>
        {error !== null ? (
          <Button type="button" variant="outline" size="sm" onClick={startNewDraft} data-testid="architecture-creation-retry">
            Retry
          </Button>
        ) : null}
      </div>

      <div className="space-y-1">
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-al-text-secondary")}>
          {ARCHITECTURE_CREATION_REVIEW_BOUNDARY}
        </p>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-al-text-secondary")}>
          {ARCHITECTURE_CREATION_AUTOSAVE_REASSURANCE}
        </p>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { initializeArchitectureCreation } from "@/lib/architecture-creation-init";
import { clearArchitectureCreationDraftId } from "@/lib/architecture-creation-session";
import { trackArchitectureDraftResumeClick } from "@/lib/architecture-draft-resume-telemetry";
import {
  listArchitectureDraftRegistryEntries,
  type ArchitectureDraftRegistryEntry,
} from "@/lib/architecture-draft-registry";
import {
  architectureDraftPath,
  ARCHITECTURES_LIST_PATH,
} from "@/lib/architecture-routes";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture-workflow-labels";
import { CREATE_ARCHITECTURE_STARTING_LABEL } from "@/lib/review-start-progress-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type BootstrapMode = "loading" | "resume-choice" | "creating";

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

/** Idempotent draft bootstrap — resumes existing drafts when present, otherwise creates a new draft. */
export function ArchitectureCreationBootstrap(): React.JSX.Element {
  const router = useRouter();
  const startedRef = useRef(false);
  const [mode, setMode] = useState<BootstrapMode>("loading");
  const [draftEntries, setDraftEntries] = useState<readonly ArchitectureDraftRegistryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const entries = listArchitectureDraftRegistryEntries();
    setDraftEntries(entries);

    if (entries.length > 0) {
      setMode("resume-choice");

      return;
    }

    if (startedRef.current) {
      return;
    }

    startedRef.current = true;
    setMode("creating");

    void initializeArchitectureCreation()
      .then((result) => {
        if (result.draftId === null) {
          setError("Could not start a new architecture draft. Try again.");

          return;
        }

        router.replace(architectureDraftPath(result.draftId));
      })
      .catch(() => {
        setError("Could not start a new architecture draft. Try again.");
      });
  }, [router]);

  const startNewDraft = () => {
    setError(null);
    setMode("creating");
    startedRef.current = true;
    clearArchitectureCreationDraftId();

    void initializeArchitectureCreation()
      .then((result) => {
        if (result.draftId === null) {
          setError("Could not start a new architecture draft. Try again.");

          if (draftEntries.length > 0) {
            setMode("resume-choice");
          }

          return;
        }

        router.replace(architectureDraftPath(result.draftId));
      })
      .catch(() => {
        setError("Could not start a new architecture draft. Try again.");

        if (draftEntries.length > 0) {
          setMode("resume-choice");
        }
      });
  };

  if (mode === "resume-choice" && draftEntries.length > 0) {
    return (
      <div className="space-y-4" data-testid="architecture-creation-bootstrap-resume-choice">
        <p className={cn("m-0 max-w-prose", OPERATOR_TYPOGRAPHY.helper)}>
          You have saved architecture drafts. Resume one or start a new draft.
        </p>
        {error !== null ? (
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} role="alert">
            {error}
          </p>
        ) : null}
        <ul className="m-0 list-none space-y-2 p-0">
          {draftEntries.map((entry) => (
            <li key={entry.architectureId} data-testid={`architecture-creation-resume-${entry.architectureId}`}>
              <Link
                href={architectureDraftPath(entry.architectureId)}
                className={cn(OPERATOR_LINK.nav, "inline-flex flex-wrap items-baseline gap-x-2")}
                onClick={() => {
                  trackArchitectureDraftResumeClick("architectures-new", entry.architectureId);
                }}
              >
                <span className="font-medium text-al-text-primary">{entry.displayName}</span>
                <span className={cn(OPERATOR_TYPOGRAPHY.helper, "text-al-text-secondary")}>
                  Updated {formatDraftUpdatedLabel(entry.lastUpdatedUtc)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="primary" size="sm" onClick={startNewDraft} data-testid="architecture-creation-start-new">
            {CREATE_ARCHITECTURE_LABEL}
          </Button>
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href={ARCHITECTURES_LIST_PATH}>View all drafts</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (error !== null) {
    return (
      <div className="space-y-3" data-testid="architecture-creation-bootstrap-error">
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} role="alert">
          {error}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={startNewDraft}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="architecture-creation-bootstrap-loading">
      {CREATE_ARCHITECTURE_STARTING_LABEL}
    </p>
  );
}

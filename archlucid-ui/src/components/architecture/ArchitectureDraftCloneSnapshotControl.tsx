"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { Button } from "@/components/ui/button";
import {
  buildArchitectureDraftRegistryEntry,
  upsertArchitectureDraftRegistryEntry,
} from "@/lib/architecture/architecture-draft-registry";
import { architectureDraftPath } from "@/lib/architecture/architecture-routes";
import { cloneDraftSnapshot } from "@/lib/api/draft-intake-api";
import { formatVerboseApiFailureMessage } from "@/lib/resolve-api-error-message";

export const ARCHITECTURE_DRAFT_CLONE_SNAPSHOT_LABEL = "Start a new draft from this snapshot";

type ArchitectureDraftCloneSnapshotControlProps = {
  readonly architectureId: string;
  readonly testId?: string;
  readonly variant?: "primary" | "outline";
};

/** Creates a new editable architecture id from a run-spawned snapshot (WA-10). */
export function ArchitectureDraftCloneSnapshotControl(
  props: ArchitectureDraftCloneSnapshotControlProps,
): React.JSX.Element {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const handleClone = useCallback(async () => {
    if (busy) {
      return;
    }

    setInlineError(null);
    setBusy(true);

    try {
      const response = await cloneDraftSnapshot(props.architectureId);
      upsertArchitectureDraftRegistryEntry(
        buildArchitectureDraftRegistryEntry(response.clone, { linkedReviewId: null }),
      );
      router.push(architectureDraftPath(response.clone.draftId));
    } catch (error) {
      setInlineError(
        formatVerboseApiFailureMessage(error, "Could not start a new draft from this snapshot."),
      );
    } finally {
      setBusy(false);
    }
  }, [busy, props.architectureId, router]);

  const testId = props.testId ?? "architecture-draft-clone-snapshot";

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant={props.variant ?? "outline"}
        size="sm"
        disabled={busy}
        data-testid={testId}
        onClick={() => {
          void handleClone();
        }}
      >
        {busy ? "Starting new draft…" : ARCHITECTURE_DRAFT_CLONE_SNAPSHOT_LABEL}
      </Button>
      {inlineError !== null ? (
        <OperatorMutationInlineError message={inlineError} testId={`${testId}-inline-error`} />
      ) : null}
    </div>
  );
}

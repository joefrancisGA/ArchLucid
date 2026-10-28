"use client";

import { cn } from "@/lib/utils";
import type { ReactElement } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import type { ReviewRunEngineProvenance } from "@/lib/review-engine-provenance-display";
import {
  formatReviewEngineCostUsd,
  formatReviewEngineOptionalStoredField,
  formatReviewEngineProviderLabel,
  formatReviewEngineRunTimestamp,
} from "@/lib/review-engine-provenance-display";
import {
  RUN_ENGINE_PROVENANCE_OPEN_PARAM,
  parseRunEngineProvenanceOpenFromSearch,
  runEngineProvenanceDisclosureHrefFromSearch,
} from "@/lib/runs/run-engine-provenance-disclosure-url";
import { commitHrefIfChanged } from "@/lib/navigation/replace-if-href-changed";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type RunDetailEngineProvenanceRowProps = {
  readonly provenance: ReviewRunEngineProvenance;
};

function ProvenanceField(props: { readonly label: string; readonly value: string }) {
  const { label, value } = props;

  return (
    <>
      <dt className="font-medium text-neutral-700 dark:text-neutral-300">{label}</dt>
      <dd className="mt-1 text-neutral-800 dark:text-neutral-200">{value}</dd>
    </>
  );
}

/** Quiet enterprise footnote for model engine provenance on run detail. */
export function RunDetailEngineProvenanceRow(props: RunDetailEngineProvenanceRowProps): ReactElement {
  const { provenance } = props;
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const urlEngineProvenanceOpen = parseRunEngineProvenanceOpenFromSearch(
    searchParams.get(RUN_ENGINE_PROVENANCE_OPEN_PARAM),
  );
  const [open, setOpenState] = useState(urlEngineProvenanceOpen);
  const openRef = useRef(open);
  openRef.current = open;
  const deploymentLabel =
    provenance.deploymentOrModelId?.trim().length > 0
      ? provenance.deploymentOrModelId.trim()
      : "Deployment was not stored.";
  const providerLabel = formatReviewEngineProviderLabel(provenance.providerKind);
  const engineLabel = provenance.modelAliasId
    ? `${provenance.modelAliasId} (${providerLabel} / ${deploymentLabel})`
    : `${providerLabel} / ${deploymentLabel}`;
  const costLabel = formatReviewEngineCostUsd(provenance.estimatedCostUsd);

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      commitHrefIfChanged(
        runEngineProvenanceDisclosureHrefFromSearch(searchParams.toString(), detailsOpen, pathname),
        { notify: false },
      );
    },
    [pathname, searchParams],
  );

  const setOpen = useCallback(
    (detailsOpen: boolean) => {
      if (openRef.current === detailsOpen) {
        return;
      }

      openRef.current = detailsOpen;
      setOpenState(detailsOpen);
      syncOpenToUrl(detailsOpen);
    },
    [syncOpenToUrl],
  );

  useEffect(() => {
    const syncOpenFromUrl = (): void => {
      const nextOpen = parseRunEngineProvenanceOpenFromSearch(
        new URLSearchParams(window.location.search).get(RUN_ENGINE_PROVENANCE_OPEN_PARAM),
      );

      if (openRef.current === nextOpen) {
        return;
      }

      openRef.current = nextOpen;
      setOpenState(nextOpen);
    };

    syncOpenFromUrl();
    window.addEventListener("popstate", syncOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncOpenFromUrl);
    };
  }, []);

  useEffect(() => {
    if (openRef.current === urlEngineProvenanceOpen) {
      return;
    }

    openRef.current = urlEngineProvenanceOpen;
    setOpenState(urlEngineProvenanceOpen);
  }, [urlEngineProvenanceOpen]);

  return (
    <CollapsibleSection title="Engine & model" open={open} onToggle={setOpen}>
      <dl className={cn("m-0 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
        <ProvenanceField
          label="Catalog alias"
          value={provenance.modelAliasId?.trim() || "Catalog alias was not stored."}
        />
        <ProvenanceField label="Engine" value={engineLabel} />
        <ProvenanceField
          label="Prompt pack"
          value={provenance.promptPackVersion?.trim() || "Prompt pack version was not stored."}
        />
        <ProvenanceField
          label="Policy pack"
          value={provenance.policyPackVersion?.trim() || "Policy pack version was not stored."}
        />
        <ProvenanceField
          label="Output schema"
          value={formatReviewEngineOptionalStoredField(
            provenance.outputSchemaVersion,
            "Output schema version was not stored.",
            "Output schema version was stored empty.",
          )}
        />
        <ProvenanceField
          label="Engine profile"
          value={formatReviewEngineOptionalStoredField(
            provenance.engineProfileId,
            "Engine profile was not stored.",
            "Engine profile was stored empty.",
          )}
        />
        <ProvenanceField
          label="Evidence snapshot version"
          value={formatReviewEngineOptionalStoredField(
            provenance.evidenceSnapshotVersion,
            "Evidence snapshot version was not stored.",
            "Evidence snapshot version was stored empty.",
          )}
        />
        {provenance.taskEvaluationSnapshotsAtSelection === null
        || provenance.taskEvaluationSnapshotsAtSelection === undefined ? (
          <ProvenanceField label="Task evaluations" value="Task evaluations were not stored." />
        ) : (
          provenance.taskEvaluationSnapshotsAtSelection.map((evaluation) => (
            <ProvenanceField
              key={`${evaluation.taskType}-${evaluation.evaluationState}`}
              label={`Task evaluation: ${evaluation.taskType}`}
              value={evaluation.evaluationState}
            />
          ))
        )}
        <ProvenanceField
          label="Run"
          value={formatReviewEngineRunTimestamp(provenance.runTimestampUtc)}
        />
        <ProvenanceField
          label="Est. cost"
          value={costLabel ?? "Estimated cost was not stored."}
        />
      </dl>
    </CollapsibleSection>
  );
}

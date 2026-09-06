"use client";

import { cn } from "@/lib/utils";
import type { ReactElement } from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import type { ReviewRunEngineProvenance } from "@/lib/review-engine-provenance-display";
import {
  formatReviewEngineCostUsd,
  formatReviewEngineProviderLabel,
  formatReviewEngineRunTimestamp,
} from "@/lib/review-engine-provenance-display";
import {
  parseRunEngineProvenanceOpenFromSearch,
  runEngineProvenanceDisclosureHrefFromSearch,
} from "@/lib/runs/run-engine-provenance-disclosure-url";
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
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const runEngineProvenanceOpenParam = searchParams.get("runEngineProvenanceOpen");
  const [open, setOpenState] = useState(() => parseRunEngineProvenanceOpenFromSearch(runEngineProvenanceOpenParam));
  const engineLabel = provenance.modelAliasId
    ? `${provenance.modelAliasId} (${formatReviewEngineProviderLabel(provenance.providerKind)} / ${provenance.deploymentOrModelId})`
    : `${formatReviewEngineProviderLabel(provenance.providerKind)} / ${provenance.deploymentOrModelId}`;
  const costLabel = formatReviewEngineCostUsd(provenance.estimatedCostUsd);

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      router.replace(runEngineProvenanceDisclosureHrefFromSearch(searchParams.toString(), detailsOpen, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setOpen = useCallback(
    (detailsOpen: boolean) => {
      setOpenState(detailsOpen);
      syncOpenToUrl(detailsOpen);
    },
    [syncOpenToUrl],
  );

  useEffect(() => {
    setOpenState(parseRunEngineProvenanceOpenFromSearch(runEngineProvenanceOpenParam));
  }, [runEngineProvenanceOpenParam]);

  return (
    <CollapsibleSection title="Engine & model" open={open} onToggle={setOpen}>
      <dl className={cn("m-0 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
        {provenance.modelAliasId ? (
          <ProvenanceField label="Catalog alias" value={provenance.modelAliasId} />
        ) : null}
        <ProvenanceField label="Engine" value={engineLabel} />
        {provenance.promptPackVersion ? (
          <ProvenanceField label="Prompt pack" value={provenance.promptPackVersion} />
        ) : null}
        {provenance.policyPackVersion ? (
          <ProvenanceField label="Policy pack" value={provenance.policyPackVersion} />
        ) : null}
        {provenance.outputSchemaVersion ? (
          <ProvenanceField label="Output schema" value={provenance.outputSchemaVersion} />
        ) : null}
        <ProvenanceField
          label="Run"
          value={formatReviewEngineRunTimestamp(provenance.runTimestampUtc)}
        />
        {costLabel ? <ProvenanceField label="Est. cost" value={costLabel} /> : null}
      </dl>
    </CollapsibleSection>
  );
}

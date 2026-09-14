import Link from "next/link";
import type { Ref } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { DriftIdentifierRow } from "@/app/(operator)/governance/infrastructure/drift/DriftIdentifierRow";
import { formatAzureResourceDisplay } from "@/lib/infra-evidence/format-azure-resource-display";
import {
  formatInfraEvidenceChangeTypeLabel,
  isNavigableEvidenceReference,
} from "@/lib/infra-evidence/infra-evidence-drift-display";
import type { InfraEvidenceDiffChange } from "@/lib/infra-evidence/infra-evidence-drift-types";
import { formatResourceHubTabViewLabel } from "@/lib/infra-evidence/infra-evidence-hub-tab-labels";
import {
  GOVERNANCE_INFRASTRUCTURE_DRIFT_CHANGE_ID_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_CHANGE_IDENTIFIERS_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_RESOURCE_GROUP_DETAIL_HEADING,
} from "@/lib/governance/governance-infrastructure-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

function DriftChangePropertyDetail(props: {
  readonly change: InfraEvidenceDiffChange;
}): React.JSX.Element {
  const propertyLabel = props.change.property?.trim() ?? "";

  return (
    <article
      className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
      data-testid={`infra-drift-change-property-detail-${props.change.changeId}`}
    >
      <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
        {formatInfraEvidenceChangeTypeLabel(props.change.changeType)}
        {propertyLabel.length > 0 ? ` · ${propertyLabel}` : ""}
      </h3>
      <dl className="mt-3 grid gap-2 text-sm">
        <div>
          <dt className="font-medium">Old value</dt>
          <dd className="font-mono text-xs">{props.change.oldValue ?? "—"}</dd>
        </div>
        <div>
          <dt className="font-medium">New value</dt>
          <dd className="font-mono text-xs">{props.change.newValue ?? "—"}</dd>
        </div>
        <div>
          <dt className="font-medium">Evidence</dt>
          <dd className="font-mono text-xs">
            {isNavigableEvidenceReference(props.change.evidenceReference) ? (
              <Link className="text-al-link hover:underline" href={props.change.evidenceReference ?? "#"}>
                {props.change.evidenceReference}
              </Link>
            ) : (
              props.change.evidenceReference ?? "—"
            )}
          </dd>
        </div>
      </dl>
    </article>
  );
}

export function DriftChangeDetail(props: {
  readonly selectedChanges: readonly InfraEvidenceDiffChange[];
  readonly changeDrawerRef: Ref<HTMLElement | null>;
  readonly hubHref: string | null;
  readonly changeIdentifiersOpen: boolean;
  readonly onChangeIdentifiersToggle: (open: boolean) => void;
  readonly variant?: "standalone" | "inline";
}): React.JSX.Element {
  const variant = props.variant ?? "standalone";
  const primaryChange = props.selectedChanges[0];

  if (primaryChange == null) {
    return (
      <section
        ref={props.changeDrawerRef}
        tabIndex={-1}
        className={cn(
          "p-4",
          variant === "inline"
            ? "rounded-none border-0 bg-transparent"
            : "rounded-md border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950",
        )}
        aria-label="Selected change details"
        data-testid="infra-drift-change-drawer"
      />
    );
  }

  const resourceDisplay = formatAzureResourceDisplay(primaryChange.azureResourceId);
  const azureResourceId = primaryChange.azureResourceId?.trim() ?? "";
  const cloudResourceId = primaryChange.cloudResourceId?.trim() ?? "";
  const hasMultipleChanges = props.selectedChanges.length > 1;

  return (
    <section
      ref={props.changeDrawerRef}
      tabIndex={-1}
      className={cn(
        "p-4",
        variant === "inline"
          ? "rounded-none border-0 bg-transparent"
          : "rounded-md border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950",
      )}
      aria-label="Selected change details"
      data-testid="infra-drift-change-drawer"
    >
      <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Change detail</h2>
      <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.body)}>{resourceDisplay.primaryLabel}</p>
      {resourceDisplay.secondaryLabel != null ? (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{resourceDisplay.secondaryLabel}</p>
      ) : null}
      {hasMultipleChanges ? (
        <>
          <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)} data-testid="infra-drift-change-group-summary">
            {GOVERNANCE_INFRASTRUCTURE_DRIFT_RESOURCE_GROUP_DETAIL_HEADING(props.selectedChanges.length)}
          </p>
          <div className="mt-3 grid gap-3">
            {props.selectedChanges.map((change) => (
              <DriftChangePropertyDetail key={change.changeId} change={change} />
            ))}
          </div>
        </>
      ) : (
        <>
          <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>
            {formatInfraEvidenceChangeTypeLabel(primaryChange.changeType)}
            {primaryChange.property != null ? ` · ${primaryChange.property}` : ""}
          </p>
          <dl className="mt-3 grid gap-2 text-sm">
            <div>
              <dt className="font-medium">Old value</dt>
              <dd className="font-mono text-xs">{primaryChange.oldValue ?? "—"}</dd>
            </div>
            <div>
              <dt className="font-medium">New value</dt>
              <dd className="font-mono text-xs">{primaryChange.newValue ?? "—"}</dd>
            </div>
            <div>
              <dt className="font-medium">Evidence</dt>
              <dd className="font-mono text-xs">
                {isNavigableEvidenceReference(primaryChange.evidenceReference) ? (
                  <Link className="text-al-link hover:underline" href={primaryChange.evidenceReference ?? "#"}>
                    {primaryChange.evidenceReference}
                  </Link>
                ) : (
                  primaryChange.evidenceReference ?? "—"
                )}
              </dd>
            </div>
          </dl>
        </>
      )}
      <CollapsibleSection
        title={GOVERNANCE_INFRASTRUCTURE_DRIFT_CHANGE_IDENTIFIERS_TITLE}
        sectionTestId="infra-drift-change-identifiers"
        className="mb-0 mt-3"
        open={props.changeIdentifiersOpen}
        onToggle={props.onChangeIdentifiersToggle}
      >
        <div className="grid gap-2">
          {props.selectedChanges.map((change) => (
            <DriftIdentifierRow
              key={change.changeId}
              label={GOVERNANCE_INFRASTRUCTURE_DRIFT_CHANGE_ID_LABEL}
              value={change.changeId}
              copyAriaLabel={`Copy change id ${change.changeId}`}
            />
          ))}
          {cloudResourceId.length > 0 ? (
            <DriftIdentifierRow
              label="Cloud resource id"
              value={cloudResourceId}
              copyAriaLabel="Copy cloud resource id"
            />
          ) : null}
          {azureResourceId.length > 0 ? (
            <DriftIdentifierRow
              label="Azure resource id"
              value={azureResourceId}
              copyAriaLabel="Copy Azure resource id"
            />
          ) : null}
        </div>
      </CollapsibleSection>
      {props.hubHref != null ? (
        <p className={cn("m-0 mt-3", OPERATOR_TYPOGRAPHY.helper)}>
          <Link className="text-al-link hover:underline" href={props.hubHref}>
            {formatResourceHubTabViewLabel("drift")}
          </Link>
        </p>
      ) : null}
    </section>
  );
}

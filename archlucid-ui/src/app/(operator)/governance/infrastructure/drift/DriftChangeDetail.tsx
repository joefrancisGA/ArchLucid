import Link from "next/link";
import type { Ref } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { DriftIdentifierRow } from "@/app/(operator)/governance/infrastructure/drift/DriftIdentifierRow";
import { formatAzureResourceDisplay } from "@/lib/infra-evidence/format-azure-resource-display";
import { formatInfraEvidenceChangeTypeLabel, isNavigableEvidenceReference } from "@/lib/infra-evidence/infra-evidence-drift-display";
import type { InfraEvidenceDiffChange } from "@/lib/infra-evidence/infra-evidence-drift-types";
import { formatResourceHubTabViewLabel } from "@/lib/infra-evidence/infra-evidence-hub-tab-labels";
import {
  GOVERNANCE_INFRASTRUCTURE_DRIFT_CHANGE_ID_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_CHANGE_IDENTIFIERS_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_CHANGED_BY_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_CHANGED_BY_UNAVAILABLE,
} from "@/lib/governance/governance-infrastructure-copy";
import { formatInfraEvidenceDriftChangedByLabel } from "@/lib/infra-evidence/infra-evidence-drift-change-attribution";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function DriftChangeDetail(props: {
  readonly selectedChange: InfraEvidenceDiffChange;
  readonly changeDrawerRef: Ref<HTMLElement | null>;
  readonly hubHref: string | null;
  readonly changeIdentifiersOpen: boolean;
  readonly onChangeIdentifiersToggle: (open: boolean) => void;
  readonly variant?: "standalone" | "inline";
}): React.JSX.Element {
  const variant = props.variant ?? "standalone";
  const resourceDisplay = formatAzureResourceDisplay(props.selectedChange.azureResourceId);
  const azureResourceId = props.selectedChange.azureResourceId?.trim() ?? "";
  const cloudResourceId = props.selectedChange.cloudResourceId?.trim() ?? "";
  const changedByLabel = formatInfraEvidenceDriftChangedByLabel(props.selectedChange);

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
      <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>
        {formatInfraEvidenceChangeTypeLabel(props.selectedChange.changeType)}
        {props.selectedChange.property != null ? ` · ${props.selectedChange.property}` : ""}
      </p>
      <dl className="mt-3 grid gap-2 text-sm">
        <div>
          <dt className="font-medium">Old value</dt>
          <dd className="font-mono text-xs">{props.selectedChange.oldValue ?? "—"}</dd>
        </div>
        <div>
          <dt className="font-medium">New value</dt>
          <dd className="font-mono text-xs">{props.selectedChange.newValue ?? "—"}</dd>
        </div>
        <div>
          <dt className="font-medium">Evidence</dt>
          <dd className="font-mono text-xs">
            {isNavigableEvidenceReference(props.selectedChange.evidenceReference) ? (
              <Link className="text-al-link hover:underline" href={props.selectedChange.evidenceReference ?? "#"}>
                {props.selectedChange.evidenceReference}
              </Link>
            ) : (
              props.selectedChange.evidenceReference ?? "—"
            )}
          </dd>
        </div>
        <div>
          <dt className="font-medium">{GOVERNANCE_INFRASTRUCTURE_DRIFT_CHANGED_BY_LABEL}</dt>
          <dd className="text-xs" data-testid="infra-drift-change-changed-by">
            {changedByLabel ?? (
              <span className="text-al-text-secondary">{GOVERNANCE_INFRASTRUCTURE_DRIFT_CHANGED_BY_UNAVAILABLE}</span>
            )}
          </dd>
        </div>
      </dl>
      <CollapsibleSection
        title={GOVERNANCE_INFRASTRUCTURE_DRIFT_CHANGE_IDENTIFIERS_TITLE}
        sectionTestId="infra-drift-change-identifiers"
        className="mb-0 mt-3"
        open={props.changeIdentifiersOpen}
        onToggle={props.onChangeIdentifiersToggle}
      >
        <div className="grid gap-2">
          <DriftIdentifierRow
            label={GOVERNANCE_INFRASTRUCTURE_DRIFT_CHANGE_ID_LABEL}
            value={props.selectedChange.changeId}
            copyAriaLabel="Copy change id"
          />
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

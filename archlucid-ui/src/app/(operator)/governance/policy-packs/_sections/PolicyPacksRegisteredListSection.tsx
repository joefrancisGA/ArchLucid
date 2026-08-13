import { cn } from "@/lib/utils";
import {
  policyPacksCurrentPacksHeadingOperator,
  policyPacksCurrentPacksHeadingReader,
  policyPacksEmptyScopeOperatorLine,
  policyPacksEmptyScopeReaderLine,
  policyPacksPackSelectReaderTitle,
} from "@/lib/enterprise-controls-context-copy";
import { policyPackTypeBuyerDisplayLabel, policyPackTypeDisplayLabel } from "@/lib/policy/policy-pack-type-label";
import {
  isOrganizationPrivatePolicyPackDistributionScope,
  policyPackDistributionScopeBuyerLabel,
  POLICY_PACK_ORGANIZATION_PRIVATE_HELPER_COPY,
} from "@/lib/policy/policy-pack-distribution-scope-label";
import { isStandardBaselinePolicyPackName } from "@/lib/policy/policy-pack-standard-baseline";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { CopyIdButton } from "@/components/CopyIdButton";
import { BooleanStatusChip } from "@/components/ui/boolean-status-chip";
import { StatusTag } from "@/components/ui/status-tag";
import type { PolicyPack } from "@/types/policy-packs";

export type PolicyPacksRegisteredListSectionProps = {
  buyerPolishedShell: boolean;
  canMutatePacks: boolean;
  packs: PolicyPack[];
  effectivePackIds: ReadonlySet<string>;
  selectedPackId: string;
  onSelectedPackIdChange: (value: string) => void;
};

export function PolicyPacksRegisteredListSection(props: PolicyPacksRegisteredListSectionProps) {
  const { buyerPolishedShell, canMutatePacks, packs, effectivePackIds, selectedPackId, onSelectedPackIdChange } = props;

  return (
    <section className="mb-8" aria-labelledby="policy-packs-current-heading">
      <h3 id="policy-packs-current-heading" className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
        {canMutatePacks ? policyPacksCurrentPacksHeadingOperator : policyPacksCurrentPacksHeadingReader}
      </h3>
      {packs.length === 0 ? (
        <p className={cn("max-w-2xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {canMutatePacks ? policyPacksEmptyScopeOperatorLine : policyPacksEmptyScopeReaderLine}
        </p>
      ) : (
        <ul>
          {packs.map((p) => (
            <li key={p.policyPackId}>
              <div className="flex flex-wrap items-center gap-2">
                <strong>{p.name}</strong>
                {isStandardBaselinePolicyPackName(p.name) ? (
                  <StatusTag kind="ready" label="Standard baseline" data-testid={`policy-pack-baseline-${p.policyPackId}`} />
                ) : (
                  <StatusTag kind="neutral" label="Advanced / domain" data-testid={`policy-pack-advanced-${p.policyPackId}`} />
                )}
                {isOrganizationPrivatePolicyPackDistributionScope(p.distributionScope) ? (
                  <StatusTag
                    kind="neutral"
                    label={policyPackDistributionScopeBuyerLabel(p.distributionScope) ?? "Organization private"}
                    data-testid={`policy-pack-org-private-${p.policyPackId}`}
                  />
                ) : null}
                <BooleanStatusChip
                  value={effectivePackIds.has(p.policyPackId)}
                  trueLabel="Enabled in scope"
                  falseLabel="Disabled — opt in to enable"
                  falseIsAttention={false}
                  data-testid={`policy-pack-enabled-${p.policyPackId}`}
                />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <code className={cn("font-mono text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>{p.policyPackId}</code>
                <CopyIdButton value={p.policyPackId} aria-label="Copy policy pack ID" />
              </div>
              <span className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                {" "}
                —{" "}
                {buyerPolishedShell
                  ? `${policyPackTypeBuyerDisplayLabel(p.packType)} · Version ${p.currentVersion}`
                  : `${policyPackTypeDisplayLabel(p.packType)} / ${p.status} / current `}
                {!buyerPolishedShell ? <code>{p.currentVersion}</code> : null}
              </span>
              <div className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{p.description}</div>
              {isOrganizationPrivatePolicyPackDistributionScope(p.distributionScope) ? (
                <p
                  className={cn("mt-1 max-w-2xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}
                  data-testid={`policy-pack-org-private-copy-${p.policyPackId}`}
                >
                  {POLICY_PACK_ORGANIZATION_PRIVATE_HELPER_COPY}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <label className={cn("mt-3 block", OPERATOR_TYPOGRAPHY.body)}>
        Selected pack (inspect versions and lifecycle)
        <select
          value={selectedPackId}
          onChange={(e) => onSelectedPackIdChange(e.target.value)}
          aria-describedby={!canMutatePacks ? "policy-packs-pack-select-reader-hint" : undefined}
          className={cn("mt-1 block w-full max-w-lg p-2", OPERATOR_TYPOGRAPHY.body)}
        >
          <option value="">—</option>
          {packs.map((p) => (
            <option key={p.policyPackId} value={p.policyPackId}>
              {buyerPolishedShell ? p.name : `${p.name} (${p.policyPackId.slice(0, 8)}…)`}
            </option>
          ))}
        </select>
        {!canMutatePacks ? (
          <p
            id="policy-packs-pack-select-reader-hint"
            className={cn("mt-2 max-w-2xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            role="note"
          >
            {policyPacksPackSelectReaderTitle}
          </p>
        ) : null}
      </label>
    </section>
  );
}

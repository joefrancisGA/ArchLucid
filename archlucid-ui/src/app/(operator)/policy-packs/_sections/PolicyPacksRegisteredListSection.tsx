import {
  policyPacksCurrentPacksHeadingOperator,
  policyPacksCurrentPacksHeadingReader,
  policyPacksEmptyScopeOperatorLine,
  policyPacksEmptyScopeReaderLine,
  policyPacksPackSelectReaderTitle,
} from "@/lib/enterprise-controls-context-copy";
import { policyPackTypeDisplayLabel } from "@/lib/policy-pack-type-label";
import { isStandardBaselinePolicyPackName } from "@/lib/policy-pack-standard-baseline";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
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
                — {policyPackTypeDisplayLabel(p.packType)} / {p.status} / current{" "}
                <code>{p.currentVersion}</code>
              </span>
              <div className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{p.description}</div>
            </li>
          ))}
        </ul>
      )}

      <label className={cn("mt-3 block", OPERATOR_TYPOGRAPHY.body)}>
        Selected pack (inspect versions and lifecycle)
        <select
          value={selectedPackId}
          onChange={(e) => onSelectedPackIdChange(e.target.value)}
          title={canMutatePacks ? undefined : policyPacksPackSelectReaderTitle}
          className={cn("mt-1 block w-full max-w-lg p-2", OPERATOR_TYPOGRAPHY.body)}
        >
          <option value="">—</option>
          {packs.map((p) => (
            <option key={p.policyPackId} value={p.policyPackId}>
              {buyerPolishedShell ? p.name : `${p.name} (${p.policyPackId.slice(0, 8)}…)`}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}

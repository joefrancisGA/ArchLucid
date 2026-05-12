import {
  policyPacksCurrentPacksHeadingOperator,
  policyPacksCurrentPacksHeadingReader,
  policyPacksEmptyScopeOperatorLine,
  policyPacksEmptyScopeReaderLine,
  policyPacksPackSelectReaderTitle,
} from "@/lib/enterprise-controls-context-copy";
import type { PolicyPack } from "@/types/policy-packs";

export type PolicyPacksRegisteredListSectionProps = {
  buyerPolishedShell: boolean;
  canMutatePacks: boolean;
  packs: PolicyPack[];
  selectedPackId: string;
  onSelectedPackIdChange: (value: string) => void;
};

export function PolicyPacksRegisteredListSection(props: PolicyPacksRegisteredListSectionProps) {
  const { buyerPolishedShell, canMutatePacks, packs, selectedPackId, onSelectedPackIdChange } = props;

  return (
    <section className="mb-8" aria-labelledby="policy-packs-current-heading">
      <h3 id="policy-packs-current-heading">
        {canMutatePacks ? policyPacksCurrentPacksHeadingOperator : policyPacksCurrentPacksHeadingReader}
      </h3>
      {packs.length === 0 ? (
        <p className="text-neutral-500 dark:text-neutral-400 max-w-2xl text-sm">
          {canMutatePacks ? policyPacksEmptyScopeOperatorLine : policyPacksEmptyScopeReaderLine}
        </p>
      ) : (
        <ul>
          {packs.map((p) => (
            <li key={p.policyPackId}>
              <strong>{p.name}</strong> — {p.packType} / {p.status} / current <code>{p.currentVersion}</code>
              <div className="text-[13px] text-neutral-600 dark:text-neutral-400">{p.description}</div>
            </li>
          ))}
        </ul>
      )}

      <label className="block mt-3">
        Selected pack (inspect versions and lifecycle)
        <select
          value={selectedPackId}
          onChange={(e) => onSelectedPackIdChange(e.target.value)}
          title={canMutatePacks ? undefined : policyPacksPackSelectReaderTitle}
          className="block w-full max-w-lg p-2 mt-1"
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

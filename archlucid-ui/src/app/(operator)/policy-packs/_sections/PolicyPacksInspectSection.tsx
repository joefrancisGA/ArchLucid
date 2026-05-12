import { CollapsibleJsonTree } from "@/components/CollapsibleJsonTree";
import { PolicyPackDiffView } from "@/components/PolicyPackDiffView";
import {
  policyPacksCompareVersionsIntroOperator,
  policyPacksCompareVersionsIntroReader,
  policyPacksCompareVersionsReaderSubline,
  policyPacksHideDiffButtonTitle,
  policyPacksPackContentHeadingOperator,
  policyPacksPackContentHeadingReader,
  policyPacksPublishedVersionsEmptyOperatorLine,
  policyPacksPublishedVersionsEmptyReaderLine,
  policyPacksShowDiffButtonLabelReaderRank,
  policyPacksShowDiffButtonReaderTitle,
} from "@/lib/enterprise-controls-context-copy";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";
import type {
  EffectivePolicyPackSet,
  PolicyPackContentDocument,
  PolicyPackVersion,
} from "@/types/policy-packs";

export type PolicyPacksInspectSectionProps = {
  canMutatePacks: boolean;
  selectedPackId: string;
  effective: EffectivePolicyPackSet | null;
  effectiveContent: PolicyPackContentDocument | null;
  packVersions: PolicyPackVersion[];
  compareLeftId: string;
  compareRightId: string;
  onCompareLeftIdChange: (value: string) => void;
  onCompareRightIdChange: (value: string) => void;
  showVersionDiff: boolean;
  setShowVersionDiff: (value: boolean) => void;
  compareLeftVersion: PolicyPackVersion | undefined;
  compareRightVersion: PolicyPackVersion | undefined;
};

export function PolicyPacksInspectSection(props: PolicyPacksInspectSectionProps) {
  const {
    canMutatePacks,
    selectedPackId,
    effective,
    effectiveContent,
    packVersions,
    compareLeftId,
    compareRightId,
    onCompareLeftIdChange,
    onCompareRightIdChange,
    showVersionDiff,
    setShowVersionDiff,
    compareLeftVersion,
    compareRightVersion,
  } = props;

  return (
    <section className="mb-0" aria-labelledby="policy-packs-content-heading">
      <h3 id="policy-packs-content-heading">
        {canMutatePacks ? policyPacksPackContentHeadingOperator : policyPacksPackContentHeadingReader}
      </h3>
      <h4 className="mt-2 mb-2">Effective resolved packs</h4>
      {effective ? (
        <div className="mb-5">
          {isStaticDemoPayloadFallbackEnabled() ? (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {effective.packs?.length ?? 0} pack(s) resolved for this scope. Connect a live API to inspect raw configuration.
            </p>
          ) : (
            <CollapsibleJsonTree value={effective} className="max-h-[360px] border border-neutral-200 dark:border-neutral-600" />
          )}
        </div>
      ) : (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">—</p>
      )}

      <h4 className="mt-0 mb-2">Resolved effective content</h4>
      {effectiveContent ? (
        <div className="mb-6">
          {isStaticDemoPayloadFallbackEnabled() ? (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Effective policy content is available with a live API connection.
            </p>
          ) : (
            <CollapsibleJsonTree
              value={effectiveContent}
              className="max-h-[360px] border border-neutral-200 dark:border-neutral-600"
            />
          )}
        </div>
      ) : (
        <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">—</p>
      )}

      <h4 className="mt-0 mb-2">Published versions</h4>
      {packVersions.length === 0 ? (
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">
          {selectedPackId
            ? canMutatePacks
              ? policyPacksPublishedVersionsEmptyOperatorLine
              : policyPacksPublishedVersionsEmptyReaderLine
            : "Select a pack to load versions."}
        </p>
      ) : (
        <ul className="text-sm leading-relaxed">
          {packVersions.map((v) => (
            <li key={v.policyPackVersionId}>
              <strong>{v.version}</strong>
              {v.isPublished ? " · published" : " · draft"}
              <span className="text-neutral-500 dark:text-neutral-400"> · {v.createdUtc}</span>
            </li>
          ))}
        </ul>
      )}

      <h4 className="mt-5 mb-2">Compare versions</h4>
      {!canMutatePacks ? (
        <p className="mb-1 max-w-prose text-xs text-neutral-500 dark:text-neutral-400" role="note">
          {policyPacksCompareVersionsReaderSubline}
        </p>
      ) : null}
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0">
        {canMutatePacks ? policyPacksCompareVersionsIntroOperator : policyPacksCompareVersionsIntroReader}
      </p>
      <div className="flex flex-wrap gap-3 items-end mb-3">
        <label>
          Left version
          <select
            value={compareLeftId}
            onChange={(e) => {
              onCompareLeftIdChange(e.target.value);
              setShowVersionDiff(false);
            }}
            className="block min-w-[220px] p-2 mt-1"
          >
            <option value="">—</option>
            {packVersions.map((v) => (
              <option key={`L-${v.policyPackVersionId}`} value={v.policyPackVersionId}>
                {v.version} ({v.policyPackVersionId.slice(0, 8)}…)
              </option>
            ))}
          </select>
        </label>
        <label>
          Right version
          <select
            value={compareRightId}
            onChange={(e) => {
              onCompareRightIdChange(e.target.value);
              setShowVersionDiff(false);
            }}
            className="block min-w-[220px] p-2 mt-1"
          >
            <option value="">—</option>
            {packVersions.map((v) => (
              <option key={`R-${v.policyPackVersionId}`} value={v.policyPackVersionId}>
                {v.version} ({v.policyPackVersionId.slice(0, 8)}…)
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => setShowVersionDiff(true)}
          disabled={!compareLeftId || !compareRightId || compareLeftId === compareRightId}
          title={canMutatePacks ? undefined : policyPacksShowDiffButtonReaderTitle}
        >
          {canMutatePacks ? "Show diff" : policyPacksShowDiffButtonLabelReaderRank}
        </button>
        {showVersionDiff ? (
          <button type="button" onClick={() => setShowVersionDiff(false)} title={policyPacksHideDiffButtonTitle}>
            Hide diff
          </button>
        ) : null}
      </div>
      {showVersionDiff && compareLeftId !== compareRightId && compareLeftVersion && compareRightVersion ? (
        <PolicyPackDiffView leftVersion={compareLeftVersion} rightVersion={compareRightVersion} />
      ) : null}
      {showVersionDiff && compareLeftId !== compareRightId && (!compareLeftVersion || !compareRightVersion) ? (
        <p className="text-red-700 dark:text-red-400">Selected versions are no longer in the list; refresh and try again.</p>
      ) : null}
    </section>
  );
}

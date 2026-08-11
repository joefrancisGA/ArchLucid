import { cn } from "@/lib/utils";
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
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
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

  const mergedKeys =
    effectiveContent?.complianceRuleKeys?.filter((k) => (k ?? "").trim().length > 0).map((k) => k.trim()) ?? [];
  const mergedKeyPreviewCap = 48;
  const mergedKeyPreview =
    mergedKeys.length > mergedKeyPreviewCap ? mergedKeys.slice(0, mergedKeyPreviewCap) : mergedKeys;
  const mergedKeyRemainder = mergedKeys.length > mergedKeyPreviewCap ? mergedKeys.length - mergedKeyPreviewCap : 0;

  return (
    <section className="mb-0" aria-labelledby="policy-packs-content-heading">
      <h3 id="policy-packs-content-heading" className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
        {canMutatePacks ? policyPacksPackContentHeadingOperator : policyPacksPackContentHeadingReader}
      </h3>
      <h4 className={cn("mb-2 mt-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Effective resolved packs</h4>
      {effective ? (
        <div className="mb-5">
          {isStaticDemoPayloadFallbackEnabled() ? (
            <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {effective.packs?.length ?? 0} pack(s) resolved for this scope. Connect a live API to inspect raw configuration.
            </p>
          ) : (
            <CollapsibleJsonTree value={effective} className="max-h-[360px] border border-neutral-200 dark:border-neutral-600" />
          )}
        </div>
      ) : (
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>—</p>
      )}

      <h4 className={cn("mb-2 mt-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Resolved effective content</h4>
      {effectiveContent ? (
        <div className="mb-6">
          {isStaticDemoPayloadFallbackEnabled() ? (
            <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
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
        <p className={cn("mb-6 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>—</p>
      )}

      {mergedKeys.length > 0 ? (
        <details className="mb-6 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950/50">
          <summary className={cn("cursor-pointer text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
            Bundled compliance rule keys merged for this scope ({mergedKeys.length})
          </summary>
          <p className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            These stable keys anchor evaluation; titles, remediation, and framework mapping text live on each finding inspect view and in{" "}
            <code className={cn("rounded bg-neutral-100 dark:bg-neutral-800", OPERATOR_TYPOGRAPHY.badge)}>docs/samples/policy-packs/*.json</code>{" "}
            / <code className={cn("rounded bg-neutral-100 dark:bg-neutral-800", OPERATOR_TYPOGRAPHY.badge)}>docs/library/POLICY_PACK_APPENDIX_*</code>.
          </p>
          <ul
            className={cn(
              "mb-0 mt-3 max-h-48 list-disc overflow-y-auto pl-5 leading-relaxed text-al-text-primary md:columns-2 md:gap-6",
              OPERATOR_TYPOGRAPHY.helper,
            )}
          >
            {mergedKeyPreview.map((k) => (
              <li key={k} className="break-all">
                {k}
              </li>
            ))}
          </ul>
          {mergedKeyRemainder > 0 ? (
            <p className={cn("mb-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>…and {mergedKeyRemainder} more.</p>
          ) : null}
        </details>
      ) : null}

      <h4 className={cn("mb-2 mt-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Published versions</h4>
      {packVersions.length === 0 ? (
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {selectedPackId
            ? canMutatePacks
              ? policyPacksPublishedVersionsEmptyOperatorLine
              : policyPacksPublishedVersionsEmptyReaderLine
            : "Select a pack to load versions."}
        </p>
      ) : (
        <ul className={cn("leading-relaxed", OPERATOR_TYPOGRAPHY.body)}>
          {packVersions.map((v) => (
            <li key={v.policyPackVersionId}>
              <strong>{v.version}</strong>
              {v.isPublished ? " · published" : " · draft"}
              <span className="text-al-text-secondary"> · {v.createdUtc}</span>
            </li>
          ))}
        </ul>
      )}

      <h4 className={cn("mb-2 mt-5 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Compare versions</h4>
      {!canMutatePacks ? (
        <p className={cn("mb-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="note">
          {policyPacksCompareVersionsReaderSubline}
        </p>
      ) : null}
      <p className={cn("mt-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
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

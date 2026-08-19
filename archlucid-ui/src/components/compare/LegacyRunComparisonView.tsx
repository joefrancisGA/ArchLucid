import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { OperatorEmptyState } from "@/components/operator/OperatorShellMessage";
import { CompareDiffExpandableValueCell } from "@/components/compare/CompareDiffExpandableValueCell";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { sortDiffItems } from "@/lib/compare-display-sort";
import {
  buildCompareEmptyDiffTeaching,
  type CompareEmptyDiffTeaching,
} from "@/lib/compare-empty-diff-teaching";
import type { RunComparison } from "@/types/authority";

const monoCls = cn("font-mono", OPERATOR_TYPOGRAPHY.helper);

const FIXTURE_MANIFEST_RE = /manifest-(left|right)-fixture/i;
const FIXTURE_HASH_RE = /^sha256:(left|right)$/i;

/** Returns true when a manifest ID looks like a fixture/seed placeholder rather than a real ID. */
function isFixtureManifestId(id: string): boolean {
  return FIXTURE_MANIFEST_RE.test(id);
}

/** Returns true when a hash looks like a placeholder rather than a real digest. */
function isFixtureHash(hash: string): boolean {
  return FIXTURE_HASH_RE.test(hash);
}

/** Maps a potentially fixture-shaped manifest ID to a display label. */
function displayManifestId(id: string, side: "left" | "right"): string {
  if (isFixtureManifestId(id)) {
    return side === "left" ? "Baseline review" : "Updated review";
  }

  return id;
}

/** Maps a potentially fixture-shaped hash to a display string. */
function displayHash(hash: string): string {
  if (isFixtureHash(hash)) {
    return "(hash unavailable in demo)";
  }

  return hash;
}

/**
 * Review-level and manifest diffs from the comparison endpoint.
 */
export function LegacyRunComparisonView(props: { result: RunComparison }) {
  const { result } = props;
  const runLevelDiffs = sortDiffItems(result.runLevelDiffs);
  const manifestDiffs =
    result.manifestComparison !== undefined && result.manifestComparison !== null
      ? sortDiffItems(result.manifestComparison.diffs)
      : [];

  return (
    <section id="compare-legacy" className="mt-7">
      <h3 className={cn("mb-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Review-level diff</h3>
      <p className={cn("mt-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
        <strong>Baseline:</strong> <code className={monoCls}>{result.leftRunId}</code> ·{" "}
        <strong>Updated:</strong> <code className={monoCls}>{result.rightRunId}</code>
        {result.runLevelDiffCount !== undefined && (
          <>
            {" "}
            · <strong>Changes:</strong> {result.runLevelDiffCount}
          </>
        )}
      </p>

      <h4 className={OPERATOR_TYPOGRAPHY.helper}>Review-level diffs</h4>
      {result.runLevelDiffs.length === 0 ? (
        <CompareEmptyDiffEmptyState teaching={buildCompareEmptyDiffTeaching("no-run-level-diffs")} />
      ) : (
        <EnterpriseTable ariaLabel="Review-level diffs" className="mt-2">
          <EnterpriseTableHead>
            <EnterpriseTableHeadRow>
              <EnterpriseTableHeaderCell>Kind</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Section</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Key</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Before</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>After</EnterpriseTableHeaderCell>
            </EnterpriseTableHeadRow>
          </EnterpriseTableHead>
          <EnterpriseTableBody>
            {runLevelDiffs.map((diff, index) => (
              <EnterpriseTableRow key={`${diff.section}-${diff.key}-${diff.diffKind}-${index}`}>
                <EnterpriseTableCell>{diff.diffKind}</EnterpriseTableCell>
                <EnterpriseTableCell>{diff.section}</EnterpriseTableCell>
                <EnterpriseTableCell>{diff.key}</EnterpriseTableCell>
                <CompareDiffExpandableValueCell value={diff.beforeValue ?? null} monospace />
                <CompareDiffExpandableValueCell value={diff.afterValue ?? null} monospace />
              </EnterpriseTableRow>
            ))}
          </EnterpriseTableBody>
        </EnterpriseTable>
      )}

      <h4 className={cn("mt-6", OPERATOR_TYPOGRAPHY.helper)}>Review diff</h4>
      {!result.manifestComparison ? (
        <CompareEmptyDiffEmptyState teaching={buildCompareEmptyDiffTeaching("missing-comparison-block")} />
      ) : (
        <>
          <p className={cn("mb-2", OPERATOR_TYPOGRAPHY.body)}>
            <strong>Changes:</strong> added {result.manifestComparison.addedCount}, removed{" "}
            {result.manifestComparison.removedCount}, changed {result.manifestComparison.changedCount}
          </p>
          <details className={cn("mb-3 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/50", OPERATOR_TYPOGRAPHY.body)}>
            <summary className={cn("cursor-pointer font-medium text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              Technical details
            </summary>
            <p className={cn("mb-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              <strong>Review record IDs:</strong>{" "}
              <code className={monoCls}>
                {displayManifestId(result.manifestComparison.leftManifestId, "left")}
              </code>{" "}
              vs{" "}
              <code className={monoCls}>
                {displayManifestId(result.manifestComparison.rightManifestId, "right")}
              </code>
              <br />
              <strong>Hashes:</strong>{" "}
              <span className={monoCls}>{displayHash(result.manifestComparison.leftManifestHash)}</span> vs{" "}
              <span className={monoCls}>{displayHash(result.manifestComparison.rightManifestHash)}</span>
            </p>
          </details>
          {manifestDiffs.length === 0 ? (
            <CompareEmptyDiffEmptyState teaching={buildCompareEmptyDiffTeaching("empty-manifest-diffs")} />
          ) : (
            <EnterpriseTable ariaLabel="Review manifest diffs" className="mt-2">
              <EnterpriseTableHead>
                <EnterpriseTableHeadRow>
                  <EnterpriseTableHeaderCell>Kind</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Section</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Key</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Before</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>After</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Notes</EnterpriseTableHeaderCell>
                </EnterpriseTableHeadRow>
              </EnterpriseTableHead>
              <EnterpriseTableBody>
                {manifestDiffs.map((diff, index) => (
                  <EnterpriseTableRow key={`${diff.section}-${diff.key}-${diff.diffKind}-${index}`}>
                    <EnterpriseTableCell>{diff.diffKind}</EnterpriseTableCell>
                    <EnterpriseTableCell>{diff.section}</EnterpriseTableCell>
                    <EnterpriseTableCell>{diff.key}</EnterpriseTableCell>
                    <CompareDiffExpandableValueCell value={diff.beforeValue ?? null} monospace />
                    <CompareDiffExpandableValueCell value={diff.afterValue ?? null} monospace />
                    <CompareDiffExpandableValueCell value={diff.notes ?? null} />
                  </EnterpriseTableRow>
                ))}
              </EnterpriseTableBody>
            </EnterpriseTable>
          )}
        </>
      )}
    </section>
  );
}

/** Renders one empty-compare teaching block inside OperatorEmptyState. */
function CompareEmptyDiffEmptyState(props: { teaching: CompareEmptyDiffTeaching }) {
  const { teaching } = props;

  return (
    <OperatorEmptyState title={teaching.title}>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{teaching.body}</p>
      {teaching.nextSteps.length > 0 ? (
        <ul className={cn("mb-0 mt-2 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.body)}>
          {teaching.nextSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      ) : null}
    </OperatorEmptyState>
  );
}

import { OperatorEmptyState } from "@/components/OperatorShellMessage";
import { sortDiffItems } from "@/lib/compare-display-sort";
import type { RunComparison } from "@/types/authority";

const cellCls = "border border-neutral-200 px-2.5 py-2 text-left align-top dark:border-neutral-700";
const monoCls = "font-mono text-[13px]";

/**
 * Legacy authority comparison: run-level and flat manifest diffs as stable tables.
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
      <h3 className="mb-2">Run record / manifest diff (legacy)</h3>
      <p className="mt-0 text-sm text-neutral-500 dark:text-neutral-400">
        <strong>Left (base):</strong> <code className={monoCls}>{result.leftRunId}</code> ·{" "}
        <strong>Right (target):</strong> <code className={monoCls}>{result.rightRunId}</code>
        {result.runLevelDiffCount !== undefined && (
          <>
            {" "}
            · <strong>Run-level diff count:</strong> {result.runLevelDiffCount}
          </>
        )}
      </p>

      <h4 className="text-[15px]">Run-level diffs</h4>
      {result.runLevelDiffs.length === 0 ? (
        <OperatorEmptyState title="No run-level diffs">
          <p className="m-0 text-sm">
            The legacy endpoint returned zero row-level differences (valid empty result).
          </p>
        </OperatorEmptyState>
      ) : (
        <table className="mt-2 w-full border-collapse text-sm">
          <thead>
            <tr className="bg-neutral-50/90 dark:bg-neutral-900/50">
              <th className={cellCls}>Kind</th>
              <th className={cellCls}>Section</th>
              <th className={cellCls}>Key</th>
              <th className={cellCls}>Before</th>
              <th className={cellCls}>After</th>
            </tr>
          </thead>
          <tbody>
            {runLevelDiffs.map((diff, index) => (
              <tr key={`${diff.section}-${diff.key}-${diff.diffKind}-${index}`}>
                <td className={cellCls}>{diff.diffKind}</td>
                <td className={cellCls}>{diff.section}</td>
                <td className={cellCls}>{diff.key}</td>
                <td className={`${cellCls} ${monoCls}`}>{diff.beforeValue ?? "—"}</td>
                <td className={`${cellCls} ${monoCls}`}>{diff.afterValue ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h4 className="mt-6 text-[15px]">Manifest differences (flat)</h4>
      {!result.manifestComparison ? (
        <OperatorEmptyState title="No manifest comparison block">
          <p className="m-0 text-sm">
            The API did not include a manifest comparison object for this pair (distinct from “zero
            diffs inside a comparison”).
          </p>
        </OperatorEmptyState>
      ) : (
        <>
          <p className="mb-2 text-sm">
            <strong>Manifest IDs:</strong>{" "}
            <code className={monoCls}>{result.manifestComparison.leftManifestId}</code> vs{" "}
            <code className={monoCls}>{result.manifestComparison.rightManifestId}</code>
            <br />
            <strong>Hashes:</strong>{" "}
            <span className={monoCls}>{result.manifestComparison.leftManifestHash}</span> vs{" "}
            <span className={monoCls}>{result.manifestComparison.rightManifestHash}</span>
            <br />
            <strong>Counts:</strong> added {result.manifestComparison.addedCount}, removed{" "}
            {result.manifestComparison.removedCount}, changed {result.manifestComparison.changedCount}
          </p>
          {manifestDiffs.length === 0 ? (
            <OperatorEmptyState title="Manifest comparison has zero line items">
              <p className="m-0 text-sm">Comparison object present but diff list is empty.</p>
            </OperatorEmptyState>
          ) : (
            <table className="mt-2 w-full border-collapse text-sm">
              <thead>
                <tr className="bg-neutral-50/90 dark:bg-neutral-900/50">
                  <th className={cellCls}>Kind</th>
                  <th className={cellCls}>Section</th>
                  <th className={cellCls}>Key</th>
                  <th className={cellCls}>Before</th>
                  <th className={cellCls}>After</th>
                  <th className={cellCls}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {manifestDiffs.map((diff, index) => (
                  <tr key={`${diff.section}-${diff.key}-${diff.diffKind}-${index}`}>
                    <td className={cellCls}>{diff.diffKind}</td>
                    <td className={cellCls}>{diff.section}</td>
                    <td className={cellCls}>{diff.key}</td>
                    <td className={`${cellCls} ${monoCls}`}>{diff.beforeValue ?? "—"}</td>
                    <td className={`${cellCls} ${monoCls}`}>{diff.afterValue ?? "—"}</td>
                    <td className={cellCls}>{diff.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </section>
  );
}

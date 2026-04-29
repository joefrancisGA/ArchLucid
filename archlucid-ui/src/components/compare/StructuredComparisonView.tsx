import { OperatorEmptyState } from "@/components/OperatorShellMessage";
import { getArchitecturePackageDocxUrl } from "@/lib/api";
import { compareRunHeadingLabel } from "@/lib/compare-run-display";
import { sortGoldenManifestComparison } from "@/lib/compare-display-sort";
import type { GoldenManifestComparison } from "@/types/comparison";

const cellCls = "border border-neutral-200 px-2.5 py-2 text-left align-top dark:border-neutral-700";
const sectionBoxCls = "mt-5 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950";

/** Inline empty-state note for a comparison section with zero deltas. */
function EmptySectionNote({ label }: { label: string }) {
  return (
    <OperatorEmptyState title={label}>
      <p className="m-0 text-sm">No rows in this section for this pair of runs.</p>
    </OperatorEmptyState>
  );
}

/**
 * Golden-manifest structured comparison: tables and stable column order for operator review.
 */
export function StructuredComparisonView(props: { golden: GoldenManifestComparison }) {
  const golden = sortGoldenManifestComparison(props.golden);
  const total =
    golden.totalDeltaCount !== undefined
      ? golden.totalDeltaCount
      : golden.decisionChanges.length +
        golden.requirementChanges.length +
        golden.securityChanges.length +
        golden.topologyChanges.length +
        golden.costChanges.length;

  return (
    <section id="compare-structured" className="mt-7">
      <h3 className="mb-2">Manifest comparison</h3>
      <div className="mb-3 flex flex-wrap items-baseline gap-3 text-sm text-neutral-700 dark:text-neutral-300">
        <span>
          <strong>Baseline run:</strong> {compareRunHeadingLabel(golden.baseRunId)}
        </span>
        <span aria-hidden="true" className="text-neutral-300 dark:text-neutral-600">
          →
        </span>
        <span>
          <strong>Updated run:</strong> {compareRunHeadingLabel(golden.targetRunId)}
        </span>
        <span className="text-neutral-500 dark:text-neutral-400">
          · <strong>Total deltas (reported):</strong> {total}
        </span>
      </div>
      <p className="mb-4 mt-0 text-sm">
        <a
          href={getArchitecturePackageDocxUrl(golden.baseRunId, golden.targetRunId, {
            includeComparisonExplanation: true,
          })}
          rel="noreferrer"
        >
          Download architecture package DOCX (includes comparison; AI narrative when configured)
        </a>
      </p>

      <div className={sectionBoxCls}>
        <h4 className="mb-2 mt-0 text-[15px]">Summary highlights</h4>
        {golden.summaryHighlights.length === 0 ? (
          <EmptySectionNote label="No summary highlights" />
        ) : (
          <ul className="m-0 pl-5 leading-normal">
            {golden.summaryHighlights.map((h, i) => (
              <li key={`highlight-${i}`}>{h}</li>
            ))}
          </ul>
        )}
      </div>

      <div className={sectionBoxCls}>
        <h4 className="mb-2 mt-0 text-[15px]">Decision changes</h4>
        {golden.decisionChanges.length === 0 ? (
          <EmptySectionNote label="No decision changes" />
        ) : (
          <table className="mt-2 w-full border-collapse text-sm">
            <thead>
              <tr className="bg-neutral-50/90 dark:bg-neutral-900/50">
                <th className={cellCls}>Decision</th>
                <th className={cellCls}>Base</th>
                <th className={cellCls}>Target</th>
                <th className={cellCls}>Change</th>
              </tr>
            </thead>
            <tbody>
              {golden.decisionChanges.map((d, i) => (
                <tr key={i}>
                  <td className={cellCls}>{d.decisionKey}</td>
                  <td className={cellCls}>{d.baseValue ?? "—"}</td>
                  <td className={cellCls}>{d.targetValue ?? "—"}</td>
                  <td className={cellCls}>{d.changeType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={sectionBoxCls}>
        <h4 className="mb-2 mt-0 text-[15px]">Requirement changes</h4>
        {golden.requirementChanges.length === 0 ? (
          <EmptySectionNote label="No requirement changes" />
        ) : (
          <table className="mt-2 w-full border-collapse text-sm">
            <thead>
              <tr className="bg-neutral-50/90 dark:bg-neutral-900/50">
                <th className={cellCls}>Requirement</th>
                <th className={cellCls}>Change</th>
              </tr>
            </thead>
            <tbody>
              {golden.requirementChanges.map((r) => (
                <tr key={`${r.requirementName}:${r.changeType}`}>
                  <td className={cellCls}>{r.requirementName}</td>
                  <td className={cellCls}>{r.changeType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={sectionBoxCls}>
        <h4 className="mb-2 mt-0 text-[15px]">Security posture delta</h4>
        {golden.securityChanges.length === 0 ? (
          <EmptySectionNote label="No security control changes" />
        ) : (
          <table className="mt-2 w-full border-collapse text-sm">
            <thead>
              <tr className="bg-neutral-50/90 dark:bg-neutral-900/50">
                <th className={cellCls}>Control</th>
                <th className={cellCls}>Base</th>
                <th className={cellCls}>Target</th>
              </tr>
            </thead>
            <tbody>
              {golden.securityChanges.map((s, i) => (
                <tr key={i}>
                  <td className={cellCls}>{s.controlName}</td>
                  <td className={cellCls}>{s.baseStatus ?? "—"}</td>
                  <td className={cellCls}>{s.targetStatus ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={sectionBoxCls}>
        <h4 className="mb-2 mt-0 text-[15px]">Topology changes</h4>
        {golden.topologyChanges.length === 0 ? (
          <EmptySectionNote label="No topology changes" />
        ) : (
          <table className="mt-2 w-full border-collapse text-sm">
            <thead>
              <tr className="bg-neutral-50/90 dark:bg-neutral-900/50">
                <th className={cellCls}>Resource</th>
                <th className={cellCls}>Change</th>
              </tr>
            </thead>
            <tbody>
              {golden.topologyChanges.map((t) => (
                <tr key={`${t.resource}:${t.changeType}`}>
                  <td className={cellCls}>{t.resource}</td>
                  <td className={cellCls}>{t.changeType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={sectionBoxCls}>
        <h4 className="mb-2 mt-0 text-[15px]">Cost delta</h4>
        {golden.costChanges.length === 0 ? (
          <OperatorEmptyState title="No cost line items">
            <p className="m-0 text-sm">Max monthly cost unchanged or not modeled as a delta row.</p>
          </OperatorEmptyState>
        ) : (
          <table className="mt-2 w-full border-collapse text-sm">
            <thead>
              <tr className="bg-neutral-50/90 dark:bg-neutral-900/50">
                <th className={cellCls}>Base (max monthly)</th>
                <th className={cellCls}>Target (max monthly)</th>
              </tr>
            </thead>
            <tbody>
              {golden.costChanges.map((c, i) => (
                <tr key={`${c.baseCost ?? "n"}-${c.targetCost ?? "n"}-${i}`}>
                  <td className={cellCls}>{c.baseCost ?? "—"}</td>
                  <td className={cellCls}>{c.targetCost ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

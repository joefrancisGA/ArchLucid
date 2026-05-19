import Link from "next/link";

import { planningTableCls, planningThTdCls } from "@/components/planning/planning-table-styles";
import {
  getGovernanceConflictLosers,
  getGovernanceConflictWinner,
  resolveGovernanceConflictWhy,
} from "@/lib/governance-conflict-resolution";
import { policyPacksEditHref } from "@/lib/policy-packs-deep-link";
import type {
  GovernanceConflictRecord,
  GovernanceResolutionDecision,
} from "@/types/governance-resolution";

type GovernanceConflictsTableProps = {
  readonly conflicts: readonly GovernanceConflictRecord[];
  readonly decisions: readonly GovernanceResolutionDecision[];
  readonly canEditPolicyPacks: boolean;
};

export function GovernanceConflictsTable(props: GovernanceConflictsTableProps) {
  if (props.conflicts.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto">
      <table className={planningTableCls} aria-label="Policy pack conflict resolution">
        <thead>
          <tr>
            <th className={planningThTdCls} scope="col">
              Governance item
            </th>
            <th className={planningThTdCls} scope="col">
              Conflict
            </th>
            <th className={planningThTdCls} scope="col">
              Winning pack
            </th>
            <th className={planningThTdCls} scope="col">
              Why it won
            </th>
            <th className={planningThTdCls} scope="col">
              {props.canEditPolicyPacks ? "Edit losing assignment" : "Losing packs"}
            </th>
          </tr>
        </thead>
        <tbody>
          {props.conflicts.map((conflict, index) => {
            const winner = getGovernanceConflictWinner(conflict.candidates);
            const losers = getGovernanceConflictLosers(conflict.candidates, winner);
            const why = resolveGovernanceConflictWhy(conflict, props.decisions);
            const rowKey = `${conflict.itemType}-${conflict.itemKey}-${index}`;

            return (
              <tr key={rowKey}>
                <td className={planningThTdCls}>
                  <div className="font-medium">{conflict.itemType}</div>
                  <code className="text-xs">{conflict.itemKey}</code>
                </td>
                <td className={planningThTdCls}>
                  <div className="font-medium">{conflict.conflictType}</div>
                  <p className="m-0 mt-1 text-xs text-neutral-600 dark:text-neutral-400">{conflict.description}</p>
                </td>
                <td className={planningThTdCls}>
                  {winner === null ? (
                    <span className="text-neutral-500 dark:text-neutral-400">—</span>
                  ) : (
                    <>
                      <div className="font-medium">{winner.policyPackName}</div>
                      <div className="text-xs text-neutral-600 dark:text-neutral-400">
                        v{winner.version} · scope <code>{winner.scopeLevel}</code>
                        {winner.wasSelected ? (
                          <span className="ml-1.5 rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                            selected
                          </span>
                        ) : null}
                      </div>
                    </>
                  )}
                </td>
                <td className={planningThTdCls}>
                  <p className="m-0 text-sm">{why}</p>
                </td>
                <td className={planningThTdCls}>
                  {losers.length === 0 ? (
                    <span className="text-neutral-500 dark:text-neutral-400">—</span>
                  ) : (
                    <ul className="m-0 list-none space-y-1.5 p-0">
                      {losers.map((loser) => (
                        <li key={loser.assignmentId}>
                          <div className="text-sm">
                            {loser.policyPackName}{" "}
                            <span className="text-xs text-neutral-600 dark:text-neutral-400">
                              (v{loser.version}, {loser.scopeLevel})
                            </span>
                          </div>
                          <Link
                            href={policyPacksEditHref(loser.policyPackId)}
                            className="text-sm font-medium text-teal-800 underline dark:text-teal-300"
                          >
                            {props.canEditPolicyPacks ? "Edit assignment" : "View pack"}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

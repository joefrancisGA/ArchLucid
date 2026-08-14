import { cn } from "@/lib/utils";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import Link from "next/link";

import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { planningThTdCls } from "@/components/planning/planning-table-styles";
import {
  getGovernanceConflictLosers,
  getGovernanceConflictWinner,
  resolveGovernanceConflictWhy,
} from "@/lib/governance/governance-conflict-resolution";
import { policyPacksEditHref } from "@/lib/policy/policy-packs-deep-link";
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
    <EnterpriseTable ariaLabel="Policy pack conflict resolution" className={OPERATOR_TYPOGRAPHY.body}>
      <EnterpriseTableHead>
        <EnterpriseTableHeadRow>
          <EnterpriseTableHeaderCell className={planningThTdCls}>Governance item</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell className={planningThTdCls}>Conflict</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell className={planningThTdCls}>Winning pack</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell className={planningThTdCls}>Why it won</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell className={planningThTdCls}>
            {props.canEditPolicyPacks ? "Edit losing assignment" : "Losing packs"}
          </EnterpriseTableHeaderCell>
        </EnterpriseTableHeadRow>
      </EnterpriseTableHead>
      <EnterpriseTableBody>
        {props.conflicts.map((conflict, index) => {
          const winner = getGovernanceConflictWinner(conflict.candidates);
          const losers = getGovernanceConflictLosers(conflict.candidates, winner);
          const why = resolveGovernanceConflictWhy(conflict, props.decisions);
          const rowKey = `${conflict.itemType}-${conflict.itemKey}-${index}`;

          return (
            <EnterpriseTableRow key={rowKey}>
              <EnterpriseTableCell className={planningThTdCls}>
                <div className="font-medium">{conflict.itemType}</div>
                <code className={OPERATOR_TYPOGRAPHY.helper}>{conflict.itemKey}</code>
              </EnterpriseTableCell>
              <EnterpriseTableCell className={planningThTdCls}>
                <div className="font-medium">{conflict.conflictType}</div>
                <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{conflict.description}</p>
              </EnterpriseTableCell>
              <EnterpriseTableCell className={planningThTdCls}>
                {winner === null ? (
                  <span className="text-neutral-500 dark:text-neutral-400">—</span>
                ) : (
                  <>
                    <div className="font-medium">{winner.policyPackName}</div>
                    <div className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                      v{winner.version} · scope <code>{winner.scopeLevel}</code>
                      {winner.wasSelected ? (
                        <span className="ml-1.5 rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                          selected
                        </span>
                      ) : null}
                    </div>
                  </>
                )}
              </EnterpriseTableCell>
              <EnterpriseTableCell className={planningThTdCls}>
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{why}</p>
              </EnterpriseTableCell>
              <EnterpriseTableCell className={planningThTdCls}>
                {losers.length === 0 ? (
                  <span className="text-neutral-500 dark:text-neutral-400">—</span>
                ) : (
                  <ul className="m-0 list-none space-y-1.5 p-0">
                    {losers.map((loser) => (
                      <li key={loser.assignmentId}>
                        <div className={OPERATOR_TYPOGRAPHY.body}>
                          {loser.policyPackName}{" "}
                          <span className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                            (v{loser.version}, {loser.scopeLevel})
                          </span>
                        </div>
                        <Link
                          href={policyPacksEditHref(loser.policyPackId)}
                          className={OPERATOR_BODY_INLINE_LINK_CLASS}
                        >
                          {props.canEditPolicyPacks ? "Edit assignment" : "View pack"}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </EnterpriseTableCell>
            </EnterpriseTableRow>
          );
        })}
      </EnterpriseTableBody>
    </EnterpriseTable>
  );
}

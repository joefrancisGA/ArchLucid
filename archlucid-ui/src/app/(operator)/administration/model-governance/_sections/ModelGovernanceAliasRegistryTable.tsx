"use client";

import Link from "next/link";
import { Fragment } from "react";

import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import {
  MODEL_GOVERNANCE_CONNECTION_STATEMENT_COPY,
  MODEL_GOVERNANCE_CONNECTION_TRUST_CENTER_LABEL,
} from "@/lib/model-governance-copy";
import {
  modelGovernanceAgentTypeLabel,
  modelGovernanceCapabilityTagLabel,
} from "@/lib/model-governance-labels";
import type { ModelAliasRegistryEntryResponse } from "@/lib/model-governance-types";

const trustCenterHref = "/administration/security-trust";

export function GovernedAliasRegistryTable(props: { entries: ModelAliasRegistryEntryResponse[] }) {
  return (
    <Fragment>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {MODEL_GOVERNANCE_CONNECTION_STATEMENT_COPY}{" "}
        <Link className={OPERATOR_LINK.inline} href={trustCenterHref}>
          {MODEL_GOVERNANCE_CONNECTION_TRUST_CENTER_LABEL}
        </Link>
        .
      </p>
      <EnterpriseTable ariaLabel="Governed model aliases" data-testid="model-governance-registry-table">
        <EnterpriseTableHead>
          <EnterpriseTableHeadRow>
            <EnterpriseTableHeaderCell>Alias</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Capabilities</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Approved tasks</EnterpriseTableHeaderCell>
          </EnterpriseTableHeadRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody>
          {props.entries.map((entry) => (
            <EnterpriseTableRow key={entry.aliasId}>
              <EnterpriseTableCell>
                <span className="font-mono">{entry.aliasId}</span>
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                {entry.capabilityTags.length === 0 ? (
                  " — "
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {entry.capabilityTags.map((tag) => (
                      <StatusTag
                        key={`${entry.aliasId}-${tag}`}
                        kind="neutral"
                        label={modelGovernanceCapabilityTagLabel(tag)}
                      />
                    ))}
                  </div>
                )}
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                {entry.approvedTaskTypes.length === 0
                  ? " — "
                  : entry.approvedTaskTypes.map((task) => modelGovernanceAgentTypeLabel(task)).join(", ")}
              </EnterpriseTableCell>
            </EnterpriseTableRow>
          ))}
        </EnterpriseTableBody>
      </EnterpriseTable>
    </Fragment>
  );
}

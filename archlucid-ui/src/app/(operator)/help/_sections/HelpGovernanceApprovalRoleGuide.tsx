"use client";

import { useState, type ReactElement } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GOVERNANCE_APPROVAL_HELP_ROLES,
  type GovernanceApprovalHelpRoleId,
} from "@/lib/governance-approval-help-guide-content";
import { OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const DEFAULT_ROLE_ID: GovernanceApprovalHelpRoleId = "solution-architect";

export function HelpGovernanceApprovalRoleGuide(): ReactElement {
  const [activeRole, setActiveRole] = useState<GovernanceApprovalHelpRoleId>(DEFAULT_ROLE_ID);

  return (
    <Tabs
      value={activeRole}
      onValueChange={(value) => {
        setActiveRole(value as GovernanceApprovalHelpRoleId);
      }}
      syncUrlParam="role"
      className="w-full"
      data-testid="help-governance-approval-role-tabs"
    >
      <TabsList aria-label="Governance approval roles" className="flex-wrap gap-1">
        {GOVERNANCE_APPROVAL_HELP_ROLES.map((role) => (
          <TabsTrigger key={role.id} value={role.id} data-testid={`help-governance-approval-role-tab-${role.id}`}>
            {role.title}
          </TabsTrigger>
        ))}
      </TabsList>

      {GOVERNANCE_APPROVAL_HELP_ROLES.map((role) => (
        <TabsContent key={role.id} value={role.id} data-testid={`help-governance-approval-role-panel-${role.id}`}>
          <div
            id={role.id}
            className={cn(
              OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
              "scroll-mt-24 rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800",
            )}
          >
            <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{role.title}</h3>
            <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>{role.description}</p>
            <p className={cn("m-0 mt-4 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.label)}>
              Typical tasks
            </p>
            <ul className="m-0 mt-2 list-disc space-y-1.5 pl-6">
              {role.tasks.map((task) => (
                <li key={task} className={OPERATOR_TYPOGRAPHY.body}>
                  {task}
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}

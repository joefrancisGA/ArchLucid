import {
  GOVERNANCE_APPROVAL_HELP_ROLES,
} from "@/lib/governance-approval-help-guide-content";
import { OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function HelpGovernanceApprovalRoleGuide(): React.ReactElement {
  return (
    <div className="space-y-4" data-testid="help-governance-approval-role-guides">
      {GOVERNANCE_APPROVAL_HELP_ROLES.map((role) => (
        <section
          key={role.id}
          id={role.id}
          className={cn(
            OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
            "scroll-mt-24 rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800",
          )}
          data-testid={`help-governance-approval-role-panel-${role.id}`}
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
        </section>
      ))}
    </div>
  );
}

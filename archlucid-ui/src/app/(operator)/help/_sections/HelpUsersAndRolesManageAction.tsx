"use client";

import Link from "next/link";

import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { Button } from "@/components/ui/button";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { roleDisplayLabel } from "@/lib/role-display-labels";
import {
  USERS_AND_ROLES_AUTHORITY_LOADING_LABEL,
  USERS_AND_ROLES_MANAGE_ACTION_LABEL,
  USERS_AND_ROLES_ROLE_OVERVIEW_HASH,
  USERS_AND_ROLES_UNAUTHORIZED_BODY,
  USERS_AND_ROLES_UNAUTHORIZED_NEXT_STEP_LABEL,
} from "@/lib/users-and-roles-help-copy";
import { USERS_AND_ROLES_MANAGE_HREF } from "@/lib/users-and-roles-help-manifest";
import { cn } from "@/lib/utils";

export function HelpUsersAndRolesManageAction(): React.ReactElement {
  const { callerAuthorityRank, currentPrincipal, isAuthorityLoading } = useOperatorNavAuthority();

  // Do not use useNavCallerAuthorityRank here: while /me is in flight it returns Read and would
  // flash "Your current role is Reader" for admins before claims settle.
  if (isAuthorityLoading) {
    return (
      <p
        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="users-and-roles-authority-loading"
      >
        {USERS_AND_ROLES_AUTHORITY_LOADING_LABEL}
      </p>
    );
  }

  const canManageUsers = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;

  if (canManageUsers) {
    return (
      <div data-testid="users-and-roles-manage-action">
        <Button asChild size="sm" variant="primary">
          <Link href={USERS_AND_ROLES_MANAGE_HREF}>{USERS_AND_ROLES_MANAGE_ACTION_LABEL}</Link>
        </Button>
      </div>
    );
  }

  const currentRoleLabel = roleDisplayLabel(currentPrincipal.primaryAppRole ?? "Reader");

  return (
    <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="users-and-roles-unauthorized-action">
      Your current role is{" "}
      <span className="font-medium text-al-text-primary" data-testid="users-and-roles-current-role">
        {currentRoleLabel}
      </span>
      . {USERS_AND_ROLES_UNAUTHORIZED_BODY}{" "}
      <Link className={OPERATOR_LINK.inline} href={USERS_AND_ROLES_ROLE_OVERVIEW_HASH}>
        {USERS_AND_ROLES_UNAUTHORIZED_NEXT_STEP_LABEL}
      </Link>
      .
    </p>
  );
}

"use client";

import Link from "next/link";

import { useNavCallerAuthorityRank } from "@/components/OperatorNavAuthorityProvider";
import { Button } from "@/components/ui/button";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import {
  USERS_AND_ROLES_MANAGE_ACTION_LABEL,
  USERS_AND_ROLES_UNAUTHORIZED_ACTION,
} from "@/lib/users-and-roles-help-copy";
import { USERS_AND_ROLES_MANAGE_HREF } from "@/lib/users-and-roles-help-manifest";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function HelpUsersAndRolesManageAction(): React.ReactElement {
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const canManageUsers = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;

  if (canManageUsers) {
    return (
      <div data-testid="users-and-roles-manage-action">
        <Button asChild>
          <Link href={USERS_AND_ROLES_MANAGE_HREF}>{USERS_AND_ROLES_MANAGE_ACTION_LABEL}</Link>
        </Button>
      </div>
    );
  }

  return (
    <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="users-and-roles-unauthorized-action">
      {USERS_AND_ROLES_UNAUTHORIZED_ACTION}
    </p>
  );
}

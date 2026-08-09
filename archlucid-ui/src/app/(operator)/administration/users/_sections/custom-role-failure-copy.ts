export type CustomRoleFailureKind = "load" | "save" | "create";

export type CustomRoleFailureCopy = {
  readonly title: string;
  readonly description: string;
};

const ROLE_NOT_FOUND: CustomRoleFailureCopy = {
  title: "That role no longer exists",
  description: "Another administrator may have removed it. Refresh the role matrix and try again.",
};

const NOT_PERMITTED: CustomRoleFailureCopy = {
  title: "You cannot change roles in this workspace",
  description: "Managing roles and permissions requires workspace administrator access.",
};

function unavailableCopy(action: string): CustomRoleFailureCopy {
  return {
    title: `Could not ${action}`,
    description: "The workspace role service did not respond. Check system health and try again.",
  };
}

/**
 * Buyer-facing copy for admin role failures.
 *
 * HTTP status codes stay out of the visible text: UI_DESIGN_SYSTEM requires technical detail to sit
 * behind a disclosure rather than in a toast or banner.
 */
export function customRoleFailureCopy(kind: CustomRoleFailureKind, status: number | null): CustomRoleFailureCopy {
  if (status === 403)
    return NOT_PERMITTED;

  if (status === 404 && kind !== "create")
    return ROLE_NOT_FOUND;

  if (kind === "create" && status === 409)
    return {
      title: "A role with that name already exists",
      description: "Choose a different role name, or edit the existing role in the matrix below.",
    };

  if (kind === "create" && status === 400)
    return {
      title: "That role name was rejected",
      description: "Use a shorter name made up of ordinary text characters, then create the role again.",
    };

  if (kind === "save" && status === 400)
    return {
      title: "Those permissions were rejected",
      description: "The combination is not allowed for a custom role. Adjust the selection and save again.",
    };

  if (kind === "load")
    return unavailableCopy("load roles");

  if (kind === "create")
    return unavailableCopy("create the role");

  return unavailableCopy("save the role");
}

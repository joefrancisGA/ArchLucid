import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const PROJECTS_RECYCLE_BIN_CANONICAL_PATH = "/administration/tenant/recycle-bin" as const;

export const PROJECTS_RECYCLE_BIN_CLAIM_DISCIPLINE =
  "This Projects recycle bin lists soft-deleted architecture projects you can restore - it is not a signed-review diligence Sources package. Open Tenant settings, Architectures, or Audit when you need workspace scope or governed trails.";

export const PROJECTS_RECYCLE_BIN_SOURCES_INTRO =
  "Use these follow-ups when restored projects turn into architecture drafts, tenant scope checks, or audit cites.";

export type ProjectsRecycleBinSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources - no self-href to recycle bin. */
export const PROJECTS_RECYCLE_BIN_SOURCES: readonly ProjectsRecycleBinSourceLink[] = [
  { label: "Tenant settings", href: "/administration/tenant" },
  { label: "Workspace and scope help", href: inAppHelpHref("scope") },
  { label: "Architectures", href: "/architecture/architectures" },
  { label: "Audit", href: "/governance/audit" },
  { label: "Users", href: "/administration/users" },
] as const;

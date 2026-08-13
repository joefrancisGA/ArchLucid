import { ARCHITECTURE_DRAFTS_LIST_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";

export const PROJECTS_RECYCLE_BIN_CANONICAL_PATH = "/administration/workspace-settings/recycle-bin" as const;

export const PROJECTS_RECYCLE_BIN_CLAIM_DISCIPLINE =
  "This Projects recycle bin lists soft-deleted architecture projects you can restore - it is not a signed-review diligence Sources package. Open Tenant settings, Architecture drafts, or Audit when you need workspace scope or governed trails.";

export const PROJECTS_RECYCLE_BIN_SOURCES_INTRO =
  "Use these follow-ups when restored projects turn into architecture drafts, tenant scope checks, or audit cites.";


/** Operator Sources - no self-href to recycle bin. */
export const PROJECTS_RECYCLE_BIN_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Tenant settings", href: "/administration/workspace-settings" },
  { label: "Workspace and scope help", href: inAppHelpHref("scope") },
  { label: ARCHITECTURE_DRAFTS_LIST_LABEL, href: "/architecture/architectures" },
  { label: "Audit", href: GOVERNANCE_AUDIT_PATH },
  { label: "Users", href: "/administration/users" },
] as const;

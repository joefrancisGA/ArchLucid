/**
 * TB-2252 — Tenant / System / Workspace health vocabulary triad.
 *
 * Three related health surfaces:
 * - Tenant health (`/internal/tenant-health`) is the internal customer-success
 *   view of engagement and governance posture per tenant scope.
 * - System health (`/administration/system-health`) is the platform readiness
 *   and dependency probe dashboard for this deployment.
 * - Workspace health (`/architecture/executive-dashboard#workspace-health`) is
 *   the executive KPI strip for the current workspace / project scope.
 *
 * They stay separate because tenant CS scores are not platform probes, and
 * platform probes are not workspace executive KPIs. Operators need all three
 * with deep links so they do not treat one “health” surface as the other.
 */

import { ADMINISTRATION_SYSTEM_HEALTH_PATH } from "@/lib/administration-route-paths";
import { EXECUTIVE_DASHBOARD_WORKSPACE_HEALTH_HREF } from "@/lib/executive/executive-dashboard-route";
import { INTERNAL_TENANT_HEALTH_PATH } from "@/lib/internal-ops-route-paths";

export type TenantSystemWorkspaceHealthSurfaceId =
  | "tenant-health"
  | "system-health"
  | "workspace-health";

export type TenantSystemWorkspaceHealthLink = {
  readonly id: TenantSystemWorkspaceHealthSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type TenantSystemWorkspaceHealthVocabularyModel = {
  readonly heading: string;
  readonly whyThree: string;
  readonly compactLine: string;
  readonly tenantLink: TenantSystemWorkspaceHealthLink;
  readonly systemLink: TenantSystemWorkspaceHealthLink;
  readonly workspaceLink: TenantSystemWorkspaceHealthLink;
};

export const TENANT_SYSTEM_WORKSPACE_HEALTH_HEADING =
  "Tenant, system, and workspace health are three different views" as const;

export const TENANT_SYSTEM_WORKSPACE_HEALTH_WHY_THREE =
  "Tenant health is the internal customer-success view of engagement and governance per tenant. System health shows platform readiness and dependency probes for this deployment. Workspace health is the executive KPI strip for the current workspace. One health surface does not replace the others — open the peer link when you need that view." as const;

export const TENANT_SYSTEM_WORKSPACE_HEALTH_COMPACT_LINE =
  "Tenant health is CS posture; system health is platform probes; workspace health is executive KPIs — open the other when you need that view." as const;

export const TENANT_SYSTEM_WORKSPACE_HEALTH_TENANT_LINK: TenantSystemWorkspaceHealthLink = {
  id: "tenant-health",
  label: "Tenant health",
  href: INTERNAL_TENANT_HEALTH_PATH,
  whenToUse: "Review engagement and governance posture per tenant scope.",
};

export const TENANT_SYSTEM_WORKSPACE_HEALTH_SYSTEM_LINK: TenantSystemWorkspaceHealthLink = {
  id: "system-health",
  label: "System health",
  href: ADMINISTRATION_SYSTEM_HEALTH_PATH,
  whenToUse: "Check platform readiness and critical dependency probes.",
};

export const TENANT_SYSTEM_WORKSPACE_HEALTH_WORKSPACE_LINK: TenantSystemWorkspaceHealthLink = {
  id: "workspace-health",
  label: "Workspace health",
  href: EXECUTIVE_DASHBOARD_WORKSPACE_HEALTH_HREF,
  whenToUse: "Review executive KPIs for the current workspace.",
};

const ALL_LINKS: readonly TenantSystemWorkspaceHealthLink[] = [
  TENANT_SYSTEM_WORKSPACE_HEALTH_TENANT_LINK,
  TENANT_SYSTEM_WORKSPACE_HEALTH_SYSTEM_LINK,
  TENANT_SYSTEM_WORKSPACE_HEALTH_WORKSPACE_LINK,
];

/** Full triad vocabulary model (heading, why-three, and deep links). */
export function buildTenantSystemWorkspaceHealthVocabulary(): TenantSystemWorkspaceHealthVocabularyModel {
  return {
    heading: TENANT_SYSTEM_WORKSPACE_HEALTH_HEADING,
    whyThree: TENANT_SYSTEM_WORKSPACE_HEALTH_WHY_THREE,
    compactLine: TENANT_SYSTEM_WORKSPACE_HEALTH_COMPACT_LINE,
    tenantLink: TENANT_SYSTEM_WORKSPACE_HEALTH_TENANT_LINK,
    systemLink: TENANT_SYSTEM_WORKSPACE_HEALTH_SYSTEM_LINK,
    workspaceLink: TENANT_SYSTEM_WORKSPACE_HEALTH_WORKSPACE_LINK,
  };
}

/** Resolve the link for the current surface (null when unknown). */
export function resolveTenantSystemWorkspaceHealthLink(
  surfaceId: TenantSystemWorkspaceHealthSurfaceId,
): TenantSystemWorkspaceHealthLink | null {
  const match = ALL_LINKS.find((link) => link.id === surfaceId);

  if (match === undefined) {
    return null;
  }

  return match;
}

/** Peer deep-links for the surfaces you are not currently on. */
export function resolveTenantSystemWorkspaceHealthPeerLinks(
  currentSurfaceId: TenantSystemWorkspaceHealthSurfaceId,
): readonly TenantSystemWorkspaceHealthLink[] {
  return ALL_LINKS.filter((link) => link.id !== currentSurfaceId);
}

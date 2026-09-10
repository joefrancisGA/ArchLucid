/**
 * TB-2317 — Workspace scope ≠ Tenant settings vocabulary rail.
 *
 * Why two surfaces exist:
 * - Workspace scope (top-bar scope switcher) selects the active workspace and
 *   project for the operator shell session.
 * - Tenant settings (`/administration/workspace-settings`) configures tenant-wide defaults
 *   (quality gates, cost settings, workspace projects list) — not the active
 *   session scope.
 *
 * They stay separate because switching active scope is not the same task as
 * editing tenant-wide configuration. Distinct from Tenant system ≠ Workspace
 * health vocabulary and Projects recycle vs drafts package vocabulary.
 */

import { SETTINGS_TENANT_PATH } from "@/lib/settings-admin-route-paths";
import type { PairwiseVocabularyRailModel } from "@/lib/vocabulary/create-pairwise-vocabulary-rail";

/**
 * Scope switcher has no dedicated route.
 * Hash targets {@link ScopeSwitcher} trigger `id` for same-page focus/scroll.
 */
export const WORKSPACE_SCOPE_SWITCHER_HREF = "#operator-scope-switcher" as const;

export type WorkspaceScopeTenantSettingsSurfaceId =
  | "workspace-scope"
  | "tenant-settings";

export type WorkspaceScopeTenantSettingsLink = {
  readonly id: WorkspaceScopeTenantSettingsSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type WorkspaceScopeTenantSettingsVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly workspaceScopeLink: WorkspaceScopeTenantSettingsLink;
  readonly tenantSettingsLink: WorkspaceScopeTenantSettingsLink;
};

export const WORKSPACE_SCOPE_TENANT_SETTINGS_HEADING =
  "Workspace scope and Workspace settings serve different purposes" as const;

export const WORKSPACE_SCOPE_TENANT_SETTINGS_WHY_TWO =
  "Workspace scope selects the active workspace and project for this session from the top-bar switcher. Workspace settings configures workspace defaults and tenant-wide cost rates. Switching scope is not the same as editing workspace configuration." as const;

export const WORKSPACE_SCOPE_TENANT_SETTINGS_COMPACT_LINE =
  "Workspace scope sets the active session; Workspace settings edits defaults and tenant-wide cost rates." as const;

export const WORKSPACE_SCOPE_TENANT_SETTINGS_SCOPE_LINK: WorkspaceScopeTenantSettingsLink =
  {
    id: "workspace-scope",
    label: "Workspace scope",
    href: WORKSPACE_SCOPE_SWITCHER_HREF,
    whenToUse: "Select the active workspace and project for this operator session.",
  };

export const WORKSPACE_SCOPE_TENANT_SETTINGS_TENANT_LINK: WorkspaceScopeTenantSettingsLink =
  {
    id: "tenant-settings",
    label: "Workspace settings",
    href: SETTINGS_TENANT_PATH,
    whenToUse: "Configure workspace defaults, tenant-wide cost rates, and quality gates.",
  };

/** Pairwise model for Workspace scope ↔ Tenant settings (fixed routes). */
export function buildWorkspaceScopeTenantSettingsPairwiseRail(): PairwiseVocabularyRailModel<WorkspaceScopeTenantSettingsSurfaceId> {
  return {
    heading: WORKSPACE_SCOPE_TENANT_SETTINGS_HEADING,
    whyTwo: WORKSPACE_SCOPE_TENANT_SETTINGS_WHY_TWO,
    compactLine: WORKSPACE_SCOPE_TENANT_SETTINGS_COMPACT_LINE,
    currentLink: WORKSPACE_SCOPE_TENANT_SETTINGS_SCOPE_LINK,
    peerLink: WORKSPACE_SCOPE_TENANT_SETTINGS_TENANT_LINK,
  };
}

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildWorkspaceScopeTenantSettingsVocabulary(): WorkspaceScopeTenantSettingsVocabularyModel {
  const rail = buildWorkspaceScopeTenantSettingsPairwiseRail();

  return {
    heading: rail.heading,
    whyTwo: rail.whyTwo,
    compactLine: rail.compactLine,
    workspaceScopeLink: rail.currentLink,
    tenantSettingsLink: rail.peerLink,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveWorkspaceScopeTenantSettingsPeerLink(
  currentSurfaceId: WorkspaceScopeTenantSettingsSurfaceId,
): WorkspaceScopeTenantSettingsLink {
  if (currentSurfaceId === "workspace-scope") {
    return WORKSPACE_SCOPE_TENANT_SETTINGS_TENANT_LINK;
  }

  return WORKSPACE_SCOPE_TENANT_SETTINGS_SCOPE_LINK;
}

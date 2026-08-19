import type { RequiredAuthority } from "@/lib/nav-authority";

export type SettingsMasterScopeKind = "tenant" | "workspace" | "project" | "user" | "browser";

export type SettingsMasterSourceKind = "default" | "inherited" | "overridden" | "local";

export type SettingsMasterEditability = "editable" | "read-only" | "admin-only";

export type SettingsMasterTier = "common" | "advanced" | "internal";

/**
 * Which surface a destination belongs to. `self` settings write only the caller's own record and are
 * published from the top-bar account menu (`SELF_SETTINGS_DESTINATIONS`); `workspace-admin` settings
 * write shared tenant state and belong to this hub.
 */
export type SettingsMasterAudience = "self" | "workspace-admin";

/** Destination page linked from the master settings hub. */
export type SettingsMasterDestination = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly href: string;
  readonly cta: string;
  readonly keywords: readonly string[];
  readonly requiredAuthority: RequiredAuthority;
  readonly tier: SettingsMasterTier;
  readonly scope: SettingsMasterScopeKind;
  readonly source: SettingsMasterSourceKind;
  readonly editability: SettingsMasterEditability;
  readonly saveBehavior?: string;
  readonly highImpact?: boolean;
  /** Only set when emptiness is verified for this destination; never a static catalog lie. */
  readonly emptyStateHint?: string;
};

export type SettingsMasterSection = {
  readonly id: string;
  readonly navLabel: string;
  readonly title: string;
  readonly description: string;
  readonly keywords: readonly string[];
  readonly tier: SettingsMasterTier;
  readonly destinations: readonly SettingsMasterDestination[];
};

export type SettingsMasterInlineSectionId = "general-appearance" | "support-bundle";

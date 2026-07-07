import type { RequiredAuthority } from "@/lib/nav-authority";

export type SettingsMasterScopeKind = "tenant" | "workspace" | "project" | "user" | "browser";

export type SettingsMasterSourceKind = "default" | "inherited" | "overridden" | "local";

export type SettingsMasterEditability = "editable" | "read-only" | "admin-only";

export type SettingsMasterTier = "common" | "advanced" | "internal";

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

export type SettingsMasterInlineSectionId = "general-appearance" | "general-help" | "support-bundle";

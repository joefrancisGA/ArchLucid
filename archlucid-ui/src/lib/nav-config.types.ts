import type { LucideIcon } from "lucide-react";

import type { RequiredAuthority } from "@/lib/nav-authority";
import type { NavTier } from "@/lib/nav-tier";

/** Shell composition: buyer review journey vs tenant/platform administration (see SidebarNav / CommandPalette). */
export type NavShellSurface = "review-workflow" | "platform-admin" | "system-admin";

/**
 * One sidebar / palette / mobile-drawer row. Tier and authority interact per
 * **`docs/NAV_CONFIG_CONTRACT.md`** and **`nav-shell-visibility.ts`**.
 */
export type NavLinkItem = {
  href: string;
  label: string;
  title: string;
  /**
   * Legacy progressive-disclosure tag (essential / extended / advanced).
   * **Not used for sidebar visibility** (owner 2026-08-03) — authority/`requiredAuthority` gates the shell.
   */
  tier: NavTier;
  /**
   * Minimum API policy tier this destination assumes (see `ArchLucidPolicies` on the server).
   * **Pilot essentials** omit this (broad default path). **Operate** nav links set it — see **`docs/NAV_CONFIG_CONTRACT.md`**.
   * The only sidebar visibility gate — see **`nav-shell-visibility.ts`** (`filterNavLinksForOperatorShell`).
   */
  requiredAuthority?: RequiredAuthority;
  /** Registry combo for `aria-keyshortcuts`, e.g. `alt+n` */
  keyShortcut?: string;
  /** Optional icon for sidebar and mobile drawer. */
  icon?: LucideIcon;
  /** Optional badge shown beside the label (e.g. Preview). */
  navBadge?: string;
  /** When true, render a non-navigable sidebar row (e.g. gated feature below privacy threshold). */
  navLinkDisabled?: boolean;
  /** Screen-reader supplemental hint for disabled nav rows (never native `title`). */
  navLinkDisabledTitle?: string;
  /** Visible adjacent copy for disabled nav rows (AO-40 / LS-11). */
  navLinkDisabledReason?: string;
  /** Visible helper copy for disabled nav rows (AO-40 — not title-only). */
  navLinkDisabledVisibleHint?: string;
};

/**
 * Stable group (`id` keys localStorage). **`docs/NAV_CONFIG_CONTRACT.md`** maps IDs to buyer layers.
 */
export type NavGroupConfig = {
  id: string;
  label: string;
  surface: NavShellSurface;
  /** One line under the group title — what this layer is for (see docs/library/OPERATOR_DECISION_GUIDE.md). */
  caption?: string;
  /** When true, group renders only in ArchLucid staff/internal operator shells. */
  staffInternalOnly?: boolean;
  links: NavLinkItem[];
};

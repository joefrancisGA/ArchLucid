import { AUTHORITY_RANK, requiredAuthorityRank, type RequiredAuthority } from "@/lib/nav-authority";
import { isApiKeysSettingsSurfaceEnabled } from "@/lib/api-keys-settings-access";
import { DEFAULT_PRODUCT_LINE_ID, type ProductLineId } from "@/lib/product-line/product-line-id";
import type { ProductLineAssignment } from "@/lib/product-line/product-line-assignment";
import { isPathAllowedForProductLine } from "@/lib/product-line/product-line-path-access";

import { settingsMasterAudienceForScope } from "./settings-master-audience";
import type { SettingsMasterDestination, SettingsMasterSection, SettingsMasterTier } from "./settings-master-types";

export type SettingsMasterPageModelInput = {
  readonly callerAuthorityRank: number;
  readonly isAuthorityLoading: boolean;
  readonly showInternalShell: boolean;
  readonly searchQuery: string;
  readonly showAdvanced: boolean;
  readonly productLine?: ProductLineId;
  readonly productLineAssignmentOverrides?: Readonly<Record<string, ProductLineAssignment>>;
};

export type SettingsMasterVisibleSection = SettingsMasterSection & {
  readonly destinations: readonly SettingsMasterDestination[];
  readonly showSupportBundle: boolean;
};

function normalizeSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

function destinationMatchesQuery(destination: SettingsMasterDestination, normalizedQuery: string): boolean {
  if (normalizedQuery.length === 0) {
    return true;
  }

  const haystack = [
    destination.title,
    destination.description,
    destination.keywords.join(" "),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedQuery);
}

function sectionMatchesQuery(section: SettingsMasterSection, normalizedQuery: string): boolean {
  if (normalizedQuery.length === 0) {
    return true;
  }

  const haystack = [section.title, section.description, section.navLabel, section.keywords.join(" ")]
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedQuery);
}

function tierVisible(tier: SettingsMasterTier, showAdvanced: boolean, showInternalShell: boolean, isSearching: boolean): boolean {
  if (tier === "internal") {
    return showInternalShell;
  }

  if (tier === "advanced") {
    return showAdvanced || isSearching;
  }

  return true;
}

function destinationVisibleForRank(
  destination: SettingsMasterDestination,
  callerAuthorityRank: number,
): boolean {
  return callerAuthorityRank >= requiredAuthorityRank(destination.requiredAuthority);
}

/**
 * This hub is the tenant-administration surface; personal settings are published from the account menu.
 *
 * Internal-tier rows are exempt: internal developer tools are user-scoped but are ArchLucid employee chrome
 * rather than a tenant user's personal settings, and `showInternalShell` already gates them.
 */
export function destinationVisibleForHubAudience(destination: SettingsMasterDestination): boolean {
  if (destination.tier === "internal") {
    return true;
  }

  return settingsMasterAudienceForScope(destination.scope) === "workspace-admin";
}

function inlineCardMatchesQuery(normalizedQuery: string, terms: readonly string[]): boolean {
  if (normalizedQuery.length === 0) {
    return true;
  }

  return terms.join(" ").toLowerCase().includes(normalizedQuery);
}

export function buildSettingsMasterVisibleSections(
  sections: readonly SettingsMasterSection[],
  input: SettingsMasterPageModelInput,
): readonly SettingsMasterVisibleSection[] {
  const normalizedQuery = normalizeSearchQuery(input.searchQuery);
  const isSearching = normalizedQuery.length > 0;
  const executePlus = input.callerAuthorityRank >= AUTHORITY_RANK.ExecuteAuthority;

  return sections
    .filter((section) => tierVisible(section.tier, input.showAdvanced, input.showInternalShell, isSearching))
    .map((section) => {
      const destinations = section.destinations.filter((destination) => {
        if (!destinationVisibleForHubAudience(destination)) {
          return false;
        }

        if (!tierVisible(destination.tier, input.showAdvanced, input.showInternalShell, isSearching)) {
          return false;
        }

        if (!destinationVisibleForRank(destination, input.callerAuthorityRank)) {
          return false;
        }

        if (destination.id === "api-keys" && !isApiKeysSettingsSurfaceEnabled()) {
          return false;
        }

        if (
          !isPathAllowedForProductLine(destination.href, input.productLine ?? DEFAULT_PRODUCT_LINE_ID, {
            assignmentOverrides: input.productLineAssignmentOverrides,
          })
        ) {
          return false;
        }

        if (!destinationMatchesQuery(destination, normalizedQuery) && !sectionMatchesQuery(section, normalizedQuery)) {
          return false;
        }

        return true;
      });

      const showSupportBundle =
        section.id === "support"
        && executePlus
        && inlineCardMatchesQuery(normalizedQuery, ["support", "bundle", "diagnostics", "ticket"]);

      return {
        ...section,
        destinations,
        showSupportBundle,
      };
    })
    .filter((section) => {
      if (section.destinations.length > 0) {
        return true;
      }

      return section.showSupportBundle;
    });
}

export function formatSettingsAuthorityLabel(required: RequiredAuthority): string {
  if (required === "AdminAuthority") {
    return "Admins";
  }

  if (required === "ExecuteAuthority") {
    return "Operators";
  }

  return "All workspace readers";
}

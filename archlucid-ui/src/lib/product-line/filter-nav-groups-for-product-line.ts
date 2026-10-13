import type { NavGroupConfig, NavLinkItem } from "@/lib/nav-config.types";
import { GOVERNANCE_INFRASTRUCTURE_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { productLineAssignmentIncludes, type ProductLineAssignment } from "@/lib/product-line/product-line-assignment";
import { resolveProductLineAssignmentForPath } from "@/lib/product-line/product-line-path-access";
import { reshapeNavGroupsForSecureNow } from "@/lib/product-line/securenow-nav-reshape";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { resolveSecureNowEditionNavOverlay, applySecureNowEditionNavOverlay, type SecureNowEditionNavOverlay } from "@/lib/editions/securenow-edition-nav-overlay";
import { resolveSecureNowEditionIdFromEnv } from "@/lib/product-line/resolve-securenow-edition-id";
import { isSecureNowInTenantHosting } from "@/lib/product-line/securenow-hosting-mode";

export type ProductLineNavGroupRow = {
  readonly group: NavGroupConfig;
  visibleLinks: NavLinkItem[];
};

export type FilterNavGroupsForProductLineOptions = {
  readonly assignmentOverrides?: Readonly<Record<string, ProductLineAssignment>>;
  readonly editionNavOverlay?: SecureNowEditionNavOverlay;
};

function shapeNavLinksForProductLine(
  group: NavGroupConfig,
  links: readonly NavLinkItem[],
  productLine: ProductLineId,
): NavLinkItem[] {
  if (productLine !== "security" || group.id !== "operate-infrastructure") {
    return [...links];
  }

  return links.filter((link) => link.href !== GOVERNANCE_INFRASTRUCTURE_PATH);
}

function shapeSecureNowAdministrationLinks(
  rows: readonly ProductLineNavGroupRow[],
): ProductLineNavGroupRow[] {
  const adminRow = rows.find((row) => row.group.id === "operator-admin");

  if (adminRow === undefined) {
    return [...rows];
  }

  const systemHealth = adminRow.visibleLinks.filter((link) => link.href === "/administration/system-health");
  const identityProviders = adminRow.visibleLinks.filter((link) => link.href === "/administration/identity-providers");
  const remaining = adminRow.visibleLinks.filter(
    (link) =>
      link.href !== "/administration/system-health" &&
      link.href !== "/administration/identity-providers" &&
      link.href !== "/administration/billing",
  );
  const links = [...systemHealth, ...identityProviders, ...remaining];

  return rows.map((row) =>
    row.group.id === "operator-admin"
      ? {
          group: {
            ...row.group,
            caption: "Users, identity, notifications, AI models, and system health.",
          },
          visibleLinks: links,
        }
      : row,
  );
}

/**
 * SecureNow hosted mode keeps vendor Internal destinations in Administration.
 * In-tenant mode has no vendor operator, so it removes those links and reshapes the tenant cluster.
 */
export function mergeInternalNavUnderAdministration(
  rows: readonly ProductLineNavGroupRow[],
): ProductLineNavGroupRow[] {
  const adminIndex = rows.findIndex((row) => row.group.id === "operator-admin");
  const internalIndex = rows.findIndex((row) => row.group.id === "operator-system-admin");

  if (adminIndex < 0 || internalIndex < 0) {
    return [...rows];
  }

  const adminRow = rows[adminIndex];
  const internalRow = rows[internalIndex];
  const adminHrefs = new Set(adminRow.visibleLinks.map((link) => link.href));
  const mergedLinks = [
    ...adminRow.visibleLinks,
    ...internalRow.visibleLinks.filter((link) => !adminHrefs.has(link.href)),
  ];

  const mergedAdminRow: ProductLineNavGroupRow = {
    group: adminRow.group,
    visibleLinks: mergedLinks,
  };

  return rows
    .filter((row) => row.group.id !== "operator-system-admin")
    .map((row) => (row.group.id === "operator-admin" ? mergedAdminRow : row));
}

/**
 * Drops sidebar rows that are not assigned to the active product.
 * Unlisted hrefs default to Architecture, so the Architecture shell keeps the full catalog
 * until a href is explicitly moved to `security`.
 */
export function filterNavGroupsForProductLine(
  rows: readonly ProductLineNavGroupRow[],
  productLine: ProductLineId,
  options: FilterNavGroupsForProductLineOptions = {},
): ProductLineNavGroupRow[] {
  const filtered = rows
    .filter((row) => !(productLine === "security" && row.group.id === "pilot"))
    .map((row) => ({
      group: row.group,
      visibleLinks: row.visibleLinks.filter((link) => {
        const assignment = resolveProductLineAssignmentForPath(link.href, options.assignmentOverrides);

        return productLineAssignmentIncludes(assignment, productLine);
      }),
    }))
    .filter((row) => row.visibleLinks.length > 0);

  const shaped = filtered
    .map((row) => ({
      group: row.group,
      visibleLinks: shapeNavLinksForProductLine(row.group, row.visibleLinks, productLine),
    }));

  if (productLine === "security") {
    const reshaped = reshapeNavGroupsForSecureNow(shaped);
    const overlay = options.editionNavOverlay
      ?? resolveSecureNowEditionNavOverlay(resolveSecureNowEditionIdFromEnv());
    const editionShaped = applySecureNowEditionNavOverlay(reshaped, overlay, options.assignmentOverrides);

    if (isSecureNowInTenantHosting()) {
      const rowsWithoutVendorInternal = editionShaped.filter((row) => row.group.id !== "operator-system-admin");

      return shapeSecureNowAdministrationLinks(rowsWithoutVendorInternal);
    }

    return mergeInternalNavUnderAdministration(
      editionShaped,
    );
  }

  return shaped;
}

export function productLineSkipsReviewLifecycleNavShaping(productLine: ProductLineId): boolean {
  return productLine === "security";
}

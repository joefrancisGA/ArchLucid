import { Home } from "lucide-react";

import type { NavGroupConfig, NavLinkItem } from "@/lib/nav-config.types";
import { GOVERNANCE_INFRASTRUCTURE_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { productLineAssignmentIncludes, type ProductLineAssignment } from "@/lib/product-line/product-line-assignment";
import { resolveProductLineAssignmentForPath } from "@/lib/product-line/product-line-path-access";
import type { ProductLineId } from "@/lib/product-line/product-line-id";

export type ProductLineNavGroupRow = {
  readonly group: NavGroupConfig;
  visibleLinks: NavLinkItem[];
};

export type FilterNavGroupsForProductLineOptions = {
  readonly assignmentOverrides?: Readonly<Record<string, ProductLineAssignment>>;
};

const SECURITY_INFRASTRUCTURE_HOME_LINK: NavLinkItem = {
  href: "/",
  label: OPERATOR_NAV_LINK_LABELS.home,
  title: "Infrastructure evidence overview and workbench directory",
  icon: Home,
  tier: "extended",
  requiredAuthority: "ReadAuthority",
};

function shapeNavLinksForProductLine(
  group: NavGroupConfig,
  links: readonly NavLinkItem[],
  productLine: ProductLineId,
): NavLinkItem[] {
  if (productLine !== "security" || group.id !== "operate-infrastructure") {
    return [...links];
  }

  const workbenchLinks = links.filter((link) => link.href !== GOVERNANCE_INFRASTRUCTURE_PATH);

  return [SECURITY_INFRASTRUCTURE_HOME_LINK, ...workbenchLinks];
}

/**
 * SecureNow keeps one Administration cluster — vendor Internal destinations append after tenant admin links.
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

function reorderNavGroupsForProductLine(
  rows: readonly ProductLineNavGroupRow[],
  productLine: ProductLineId,
): ProductLineNavGroupRow[] {
  if (productLine !== "security") {
    return [...rows];
  }

  const infrastructureIndex = rows.findIndex((row) => row.group.id === "operate-infrastructure");

  if (infrastructureIndex <= 0) {
    return [...rows];
  }

  const reordered = [...rows];
  const [infrastructureRow] = reordered.splice(infrastructureIndex, 1);

  reordered.unshift(infrastructureRow);

  return reordered;
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
    .filter((row) => row.visibleLinks.length > 0)
    .map((row) => ({
      group: row.group,
      visibleLinks: shapeNavLinksForProductLine(row.group, row.visibleLinks, productLine),
    }));

  const reordered = reorderNavGroupsForProductLine(filtered, productLine);

  if (productLine === "security") {
    return mergeInternalNavUnderAdministration(reordered);
  }

  return reordered;
}

export function productLineSkipsReviewLifecycleNavShaping(productLine: ProductLineId): boolean {
  return productLine === "security";
}

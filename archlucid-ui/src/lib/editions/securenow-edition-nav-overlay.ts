import type { ProductLineAssignment } from "@/lib/product-line/product-line-assignment";
import { productLineAssignmentIncludes } from "@/lib/product-line/product-line-assignment";
import type { ProductLineNavGroupRow } from "@/lib/product-line/filter-nav-groups-for-product-line";
import { resolveProductLineAssignmentForPath } from "@/lib/product-line/product-line-path-access";
import type { SecureNowEditionId } from "@/lib/product-line/securenow-edition-id";
import { SECURENOW_GENERIC_NAV_OVERLAY } from "@/lib/editions/generic/securenow-generic-nav-overlay";
import { SECURENOW_UHG_NAV_OVERLAY } from "@/lib/editions/uhg/securenow-uhg-nav-overlay";

export type SecureNowEditionNavOverlay = () => readonly ProductLineNavGroupRow[];

export function resolveSecureNowEditionNavOverlay(
  edition: SecureNowEditionId,
): SecureNowEditionNavOverlay {
  switch (edition) {
    case "generic":
      return SECURENOW_GENERIC_NAV_OVERLAY;
    case "uhg":
      return SECURENOW_UHG_NAV_OVERLAY;
    default: {
      const exhaustiveEdition: never = edition;

      return exhaustiveEdition;
    }
  }
}

export function applySecureNowEditionNavOverlay(
  rows: readonly ProductLineNavGroupRow[],
  overlay: SecureNowEditionNavOverlay,
  assignmentOverrides: Readonly<Record<string, ProductLineAssignment>> = {},
): ProductLineNavGroupRow[] {
  const overlayRows = overlay()
    .map((row) => ({
      group: row.group,
      visibleLinks: row.visibleLinks.filter((link) =>
        productLineAssignmentIncludes(
          resolveProductLineAssignmentForPath(link.href, assignmentOverrides),
          "security",
        ),
      ),
    }))
    .filter((row) => row.visibleLinks.length > 0);

  if (overlayRows.length === 0) {
    return [...rows];
  }

  const adminIndex = rows.findIndex((row) => row.group.id === "operator-admin");

  if (adminIndex < 0) {
    return [...rows, ...overlayRows];
  }

  return [...rows.slice(0, adminIndex), ...overlayRows, ...rows.slice(adminIndex)];
}

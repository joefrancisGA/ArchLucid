import { navHrefPathPart } from "@/lib/nav-href-path-part";
import { pathMatchesRoutePrefix } from "@/lib/governance/governance-route-paths";
import {
  DEFAULT_PRODUCT_LINE_ASSIGNMENT,
  productLineAssignmentIncludes,
  type ProductLineAssignment,
} from "@/lib/product-line/product-line-assignment";
import {
  PRODUCT_LINE_ALWAYS_ALLOWED_PREFIXES,
  PRODUCT_LINE_EXTRA_ASSIGNMENTS,
  PRODUCT_LINE_NAV_ASSIGNMENTS,
  PRODUCT_LINE_NESTED_PREFIXES,
} from "@/lib/product-line/product-line-catalog";
import type { ProductLineId } from "@/lib/product-line/product-line-id";

export type ProductLinePathAccessOptions = {
  readonly assignmentOverrides?: Readonly<Record<string, ProductLineAssignment>>;
};

function mergedAssignmentMap(
  assignmentOverrides: Readonly<Record<string, ProductLineAssignment>> | undefined,
): Readonly<Record<string, ProductLineAssignment>> {
  if (assignmentOverrides === undefined) {
    return { ...PRODUCT_LINE_NAV_ASSIGNMENTS, ...PRODUCT_LINE_EXTRA_ASSIGNMENTS };
  }

  return {
    ...PRODUCT_LINE_NAV_ASSIGNMENTS,
    ...PRODUCT_LINE_EXTRA_ASSIGNMENTS,
    ...assignmentOverrides,
  };
}

function longestMatchingPrefix(pathname: string, prefixes: readonly string[]): string | null {
  let best: string | null = null;

  for (const prefix of prefixes) {
    if (!pathMatchesRoutePrefix(pathname, prefix)) {
      continue;
    }

    if (best === null || prefix.length > best.length) {
      best = prefix;
    }
  }

  return best;
}

export function resolveProductLineAssignmentForPath(
  pathnameOrHref: string,
  assignmentOverrides?: Readonly<Record<string, ProductLineAssignment>>,
): ProductLineAssignment {
  const pathname = navHrefPathPart(pathnameOrHref);
  const assignments = mergedAssignmentMap(assignmentOverrides);
  const exact = assignments[pathname];

  if (exact !== undefined) {
    return exact;
  }

  const nestedPrefix = longestMatchingPrefix(pathname, PRODUCT_LINE_NESTED_PREFIXES);

  if (nestedPrefix !== null) {
    const nestedAssignment = assignments[nestedPrefix];

    if (nestedAssignment !== undefined) {
      return nestedAssignment;
    }
  }

  return DEFAULT_PRODUCT_LINE_ASSIGNMENT;
}

export function isAlwaysAllowedProductLinePath(pathnameOrHref: string): boolean {
  const pathname = navHrefPathPart(pathnameOrHref);

  return PRODUCT_LINE_ALWAYS_ALLOWED_PREFIXES.some((prefix) => pathMatchesRoutePrefix(pathname, prefix));
}

export function isPathAllowedForProductLine(
  pathnameOrHref: string,
  productLine: ProductLineId,
  options: ProductLinePathAccessOptions = {},
): boolean {
  if (isAlwaysAllowedProductLinePath(pathnameOrHref)) {
    return true;
  }

  const assignment = resolveProductLineAssignmentForPath(pathnameOrHref, options.assignmentOverrides);

  return productLineAssignmentIncludes(assignment, productLine);
}

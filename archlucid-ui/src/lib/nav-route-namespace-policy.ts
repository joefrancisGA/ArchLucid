/** Canonical URL prefix policy for operator nav groups (TB-404). */

export type NavGroupCanonicalPrefixPolicy = {
  readonly navGroupId: string;
  /**
   * When `null`, the group uses heterogeneous top-level routes and prefix enforcement is skipped
   * (Pilot essentials and Operate analysis).
   */
  readonly canonicalPrefixes: readonly string[] | null;
};

export type NavRouteNamespaceException = {
  readonly navGroupId: string;
  readonly href: string;
  readonly canonicalPrefixes: readonly string[];
  readonly exceptionReason: string;
};

/** Nav group → expected URL prefix(es). Route moves are TB-405–408; exceptions are explicit until then. */
export const NAV_GROUP_CANONICAL_PREFIX_POLICIES: readonly NavGroupCanonicalPrefixPolicy[] = [
  { navGroupId: "pilot", canonicalPrefixes: null },
  { navGroupId: "operate-analysis", canonicalPrefixes: null },
  { navGroupId: "operate-architect-advanced", canonicalPrefixes: null },
  { navGroupId: "operate-governance", canonicalPrefixes: ["/governance"] },
  { navGroupId: "operate-integrations", canonicalPrefixes: ["/integrations"] },
  { navGroupId: "operator-admin", canonicalPrefixes: ["/administration"] },
  { navGroupId: "operator-system-admin", canonicalPrefixes: ["/internal"] },
];

export function hrefMatchesCanonicalPrefix(href: string, prefix: string): boolean {
  if (href === prefix) {
    return true;
  }

  return href.startsWith(`${prefix}/`);
}

export function hrefMatchesAnyCanonicalPrefix(href: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => hrefMatchesCanonicalPrefix(href, prefix));
}

export function findNavRouteNamespaceException(
  navGroupId: string,
  href: string,
  exceptions: readonly NavRouteNamespaceException[],
): NavRouteNamespaceException | undefined {
  return exceptions.find((row) => row.navGroupId === navGroupId && row.href === href);
}

export function isNavHrefNamespaceAligned(
  navGroupId: string,
  href: string,
  policies: readonly NavGroupCanonicalPrefixPolicy[],
  exceptions: readonly NavRouteNamespaceException[],
): boolean {
  const policy = policies.find((row) => row.navGroupId === navGroupId);

  if (policy === undefined) {
    return false;
  }

  if (policy.canonicalPrefixes === null) {
    return true;
  }

  if (hrefMatchesAnyCanonicalPrefix(href, policy.canonicalPrefixes)) {
    return true;
  }

  const exception = findNavRouteNamespaceException(navGroupId, href, exceptions);

  return exception !== undefined && exception.exceptionReason.trim().length > 0;
}

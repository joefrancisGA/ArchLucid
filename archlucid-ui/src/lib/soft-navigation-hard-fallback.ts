import { softNavigationTargetPathname } from "@/lib/soft-navigation-target-pathname";

/**
 * When App Router soft navigation never commits, recover with a same-origin full navigation.
 * Returns null when the browser is already on the target (avoids reload loops).
 */
export function resolveSoftNavigationHardFallbackAssignUrl(
  stuckHref: string,
  currentPathname: string,
  currentSearch: string = "",
  origin: string = "http://localhost",
): string | null {
  const trimmed = stuckHref.trim();

  if (trimmed.length === 0 || trimmed.startsWith("#")) {
    return null;
  }

  try {
    const target = new URL(trimmed, origin);

    if (target.origin !== new URL(origin).origin) {
      return null;
    }

    const currentKey = `${currentPathname}${currentSearch}`;
    const targetKey = `${target.pathname}${target.search}`;

    if (targetKey === currentKey) {
      return null;
    }

    // Path-only equality is not enough (`/architecture/reviews` vs `/architecture/reviews`).
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    const pathname = softNavigationTargetPathname(trimmed, origin);

    if (pathname.length === 0 || pathname === currentPathname) {
      return null;
    }

    return pathname;
  }
}

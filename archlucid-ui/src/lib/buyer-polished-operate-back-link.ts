import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

/**
 * Buyer-polished shell: contextual return link from golden-path satellite routes to the canonical showcase package.
 */
export function buyerPolishedOperateBackLink(pathnameWithSearch: string): {
  readonly label: string;
  readonly href: string;
} | null {
  const path = (pathnameWithSearch.split("?")[0] ?? "").trim().replace(/\/$/, "") || "/";
  const packageHref = `/reviews/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`;

  if (path === "/" || path.startsWith(`${packageHref}/`) || path === packageHref) {
    return null;
  }

  if (
    path.startsWith("/graph") ||
    path.startsWith("/governance") ||
    path.startsWith("/audit") ||
    path.startsWith("/manifests/") ||
    path.startsWith("/showcase/")
  ) {
    return { label: "Back to review package", href: packageHref };
  }

  return null;
}

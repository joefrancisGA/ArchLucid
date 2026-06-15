/**
 * Builds stable in-app URLs operators can copy for sponsors and teammates.
 */

export function buildShareableOperatorUrl(pathname: string, searchParams?: URLSearchParams | null): string {
  if (typeof window === "undefined") {
    const query = searchParams?.toString() ?? "";

    return query.length > 0 ? `${pathname}?${query}` : pathname;
  }

  const origin = window.location.origin;
  const query = searchParams?.toString() ?? "";

  return query.length > 0 ? `${origin}${pathname}?${query}` : `${origin}${pathname}`;
}

export async function copyShareableOperatorLink(href: string): Promise<boolean> {
  if (typeof navigator === "undefined" || navigator.clipboard === undefined) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(href);

    return true;
  }
  catch {
    return false;
  }
}

"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type ArchitectureNestedToolScopeSeedProps = {
  readonly architectureId: string;
  readonly queryParam: string;
};

/** Seeds a query param on nested desk tool routes when the URL omits architecture scope. */
export function ArchitectureNestedToolScopeSeed(
  props: ArchitectureNestedToolScopeSeedProps,
): null {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const architectureId = props.architectureId.trim();

  useEffect(() => {
    if (architectureId.length === 0) {
      return;
    }

    const current = searchParams.get(props.queryParam)?.trim() ?? "";

    if (current === architectureId) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set(props.queryParam, architectureId);
    const query = params.toString();

    router.replace(query.length > 0 ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [architectureId, pathname, props.queryParam, router, searchParams]);

  return null;
}

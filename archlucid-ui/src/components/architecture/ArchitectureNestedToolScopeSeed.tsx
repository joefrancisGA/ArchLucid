"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";

export type ArchitectureNestedToolScopeSeedProps = {
  readonly architectureId: string;
  readonly queryParam: string;
};

/** Seeds a query param on nested desk tool routes when the URL omits architecture scope. */
export function ArchitectureNestedToolScopeSeed(
  props: ArchitectureNestedToolScopeSeedProps,
): null {
  const pathname = usePathname() ?? "/";
  const architectureId = props.architectureId.trim();

  useEffect(() => {
    if (architectureId.length === 0) {
      return;
    }

    const current = new URLSearchParams(readWindowLocationSearch()).get(props.queryParam)?.trim() ?? "";

    if (current === architectureId) {
      return;
    }

    const params = new URLSearchParams(readWindowLocationSearch());
    params.set(props.queryParam, architectureId);
    const query = params.toString();
    const nextHref = query.length > 0 ? `${pathname}?${query}` : pathname;

    commitHrefIfChanged(nextHref, { notify: false });
  }, [architectureId, pathname, props.queryParam]);

  return null;
}

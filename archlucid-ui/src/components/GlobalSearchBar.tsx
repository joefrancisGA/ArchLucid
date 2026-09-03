"use client";

import { GlobalSearchBarShell } from "@/components/GlobalSearchBarShell";
import {
  FOCUS_GLOBAL_SEARCH_EVENT,
  OPEN_GLOBAL_SEARCH_EVENT,
  useGlobalSearchBar,
} from "@/components/use-global-search-bar";

export { FOCUS_GLOBAL_SEARCH_EVENT, OPEN_GLOBAL_SEARCH_EVENT };

type GlobalSearchBarProps = {
  readonly className?: string;
};

export function GlobalSearchBar(props: GlobalSearchBarProps) {
  const controller = useGlobalSearchBar();

  return <GlobalSearchBarShell controller={controller} className={props.className} />;
}

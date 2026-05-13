"use client";

import { SearchPageView } from "./SearchPageView";
import { useSearchPage } from "./use-search-page";

export function SearchPageMain() {
  const model = useSearchPage();

  return <SearchPageView model={model} />;
}

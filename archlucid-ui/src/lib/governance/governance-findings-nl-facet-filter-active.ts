import type { FindingsNaturalLanguageFacets } from "@/lib/findings/findings-natural-language-filter";

export function hasGovernanceFindingsNlFacetFilterActive(nlFacets: FindingsNaturalLanguageFacets): boolean {
  return nlFacets.severity !== null || nlFacets.status !== null || nlFacets.titleKeywords.length > 0;
}
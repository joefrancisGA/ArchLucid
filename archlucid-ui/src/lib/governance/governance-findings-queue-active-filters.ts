import {
  RISK_REGISTER_FILTER_LABELS,
  type RiskRegisterFilter,
} from "@/lib/architecture/architecture-risk-register-page";
import {
  DEFAULT_FINDING_JOB_VIEW,
  FINDING_JOB_VIEW_LABELS,
  type FindingJobView,
} from "@/lib/findings/finding-job-view";
import {
  describeFindingsNaturalLanguageFacets,
  findingsNaturalLanguageFacetsAreEmpty,
  type FindingsNaturalLanguageFacets,
} from "@/lib/findings/findings-natural-language-filter";

export type GovernanceFindingsQueueActiveFilterChip = {
  readonly id: string;
  readonly label: string;
};

export function governanceFindingsQueueActiveFilterChips(args: {
  readonly registerFilter: RiskRegisterFilter;
  readonly jobView: FindingJobView;
  readonly nlFacets: FindingsNaturalLanguageFacets;
  readonly jobViewFilterActive: boolean;
}): GovernanceFindingsQueueActiveFilterChip[] {
  const chips: GovernanceFindingsQueueActiveFilterChip[] = [];

  if (args.registerFilter !== "all") {
    chips.push({
      id: `register-${args.registerFilter}`,
      label: RISK_REGISTER_FILTER_LABELS[args.registerFilter],
    });
  }

  if (args.jobViewFilterActive && args.jobView !== DEFAULT_FINDING_JOB_VIEW) {
    chips.push({
      id: `job-view-${args.jobView}`,
      label: FINDING_JOB_VIEW_LABELS[args.jobView],
    });
  }

  if (!findingsNaturalLanguageFacetsAreEmpty(args.nlFacets)) {
    chips.push({
      id: "nl-facets",
      label: describeFindingsNaturalLanguageFacets(args.nlFacets),
    });
  }

  return chips;
}

export function governanceFindingsQueueActiveFiltersSummary(
  chips: readonly GovernanceFindingsQueueActiveFilterChip[],
): string | null {
  if (chips.length === 0) {
    return null;
  }

  return chips.map((chip) => chip.label).join(", ");
}

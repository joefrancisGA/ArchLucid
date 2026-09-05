"use client";

import { Button } from "@/components/ui/button";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableHeadRow,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  parseRecommendationLearningWeightSortAscFromSearch,
  parseRecommendationLearningWeightSortKeyFromSearch,
  recommendationLearningWeightSortHrefFromSearch,
  type RecommendationLearningWeightSortKey,
} from "@/lib/internal/recommendation-learning-weight-sort-url";
import { cn } from "@/lib/utils";
import type { RecommendationLearningWeightDelta } from "@/types/recommendation-learning-operational";
import { RECOMMENDATION_LEARNING_CANONICAL_PATH } from "@/types/recommendation-learning-operational";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { copyOperationalIdentifier } from "./recommendation-learning-ops-display";

export function RecommendationLearningFieldRow(props: {
  readonly label: string;
  readonly value: string;
  readonly testId?: string;
  readonly copyable?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-al-border/60 py-2 sm:grid-cols-[12rem_1fr] sm:gap-4">
      <dt className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{props.label}</dt>
      <dd className={cn("m-0 break-all font-mono text-al-text-primary", OPERATOR_TYPOGRAPHY.body)} data-testid={props.testId}>
        <span>{props.value}</span>
        {props.copyable ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ml-2 h-7 px-2"
            onClick={() => void copyOperationalIdentifier(props.value)}
          >
            Copy
          </Button>
        ) : null}
      </dd>
    </div>
  );
}

export function RecommendationLearningWeightTable(props: { readonly deltas: RecommendationLearningWeightDelta[] }) {
  const router = useRouter();
  const pathname = usePathname() ?? RECOMMENDATION_LEARNING_CANONICAL_PATH;
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();
  const urlSortKey = parseRecommendationLearningWeightSortKeyFromSearch(searchParams.get("sort"));
  const urlSortAsc = parseRecommendationLearningWeightSortAscFromSearch(searchParams.get("dir"));
  const [sortKey, setSortKey] = useState<RecommendationLearningWeightSortKey>(urlSortKey);
  const [sortAsc, setSortAsc] = useState(urlSortAsc);

  useEffect(() => {
    setSortKey(urlSortKey);
  }, [urlSortKey]);

  useEffect(() => {
    setSortAsc(urlSortAsc);
  }, [urlSortAsc]);

  const replaceSortInUrl = useCallback(
    (nextSortKey: RecommendationLearningWeightSortKey, nextSortAsc: boolean) => {
      router.replace(
        recommendationLearningWeightSortHrefFromSearch(currentSearch, nextSortKey, nextSortAsc, pathname),
        { scroll: false },
      );
    },
    [currentSearch, pathname, router],
  );

  const sorted = useMemo(() => {
    const copy = [...props.deltas];

    copy.sort((a, b) => {
      const left = a[sortKey];
      const right = b[sortKey];

      if (typeof left === "number" && typeof right === "number") {
        return sortAsc ? left - right : right - left;
      }

      return sortAsc
        ? String(left).localeCompare(String(right))
        : String(right).localeCompare(String(left));
    });

    return copy;
  }, [props.deltas, sortAsc, sortKey]);

  function onSort(key: RecommendationLearningWeightSortKey) {
    if (sortKey === key) {
      const nextSortAsc = !sortAsc;
      setSortAsc(nextSortAsc);
      replaceSortInUrl(sortKey, nextSortAsc);

      return;
    }

    setSortKey(key);
    setSortAsc(false);
    replaceSortInUrl(key, false);
  }

  return (
    <EnterpriseTable ariaLabel="Recommendation learning weight deltas">
      <EnterpriseTableHead>
        <EnterpriseTableHeadRow>
          {[
            ["featureGroup", "Group"],
            ["feature", "Feature"],
            ["currentWeight", "Current"],
            ["proposedWeight", "Proposed"],
            ["absoluteDelta", "Delta"],
            ["observationCount", "Obs."],
          ].map(([key, label]) => (
            <EnterpriseTableHeaderCell key={key}>
              <button type="button" className="hover:underline" onClick={() => onSort(key as RecommendationLearningWeightSortKey)}>
                {label}
              </button>
            </EnterpriseTableHeaderCell>
          ))}
        </EnterpriseTableHeadRow>
      </EnterpriseTableHead>
      <EnterpriseTableBody>
        {sorted.map((row) => (
          <EnterpriseTableRow key={`${row.featureGroup}:${row.feature}`}>
            <EnterpriseTableCell>{row.featureGroup}</EnterpriseTableCell>
            <EnterpriseTableCell className="font-mono">{row.feature}</EnterpriseTableCell>
            <EnterpriseTableCell className="font-mono">{row.currentWeight.toFixed(3)}</EnterpriseTableCell>
            <EnterpriseTableCell className="font-mono">{row.proposedWeight.toFixed(3)}</EnterpriseTableCell>
            <EnterpriseTableCell className="font-mono">{row.absoluteDelta.toFixed(3)}</EnterpriseTableCell>
            <EnterpriseTableCell>{row.observationCount}</EnterpriseTableCell>
          </EnterpriseTableRow>
        ))}
      </EnterpriseTableBody>
    </EnterpriseTable>
  );
}

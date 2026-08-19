"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  fetchFeaturedCompletedSampleCandidatesClient,
  putTenantHomepageSettingsClient,
} from "@/lib/fetch-tenant-homepage-settings-client";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import type { FeaturedCompletedSampleCandidate } from "@/types/tenant-homepage-settings";
import { cn } from "@/lib/utils";

type OperatorHomeFeaturedSamplePickerDialogProps = {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
};

function formatCompletedDate(completedUtc: string): string {
  const parsed = Date.parse(completedUtc);

  if (Number.isNaN(parsed)) {
    return "Completion date unavailable";
  }

  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(parsed));
}

/** Workspace-owner picker for the featured completed sample review. */
export function OperatorHomeFeaturedSamplePickerDialog(
  props: OperatorHomeFeaturedSamplePickerDialogProps,
): React.JSX.Element {
  const queryClient = useQueryClient();
  const candidatesQuery = useQuery({
    queryKey: operatorQueryKeys.featuredCompletedSampleCandidates,
    queryFn: fetchFeaturedCompletedSampleCandidatesClient,
    enabled: props.open,
  });

  const saveMutation = useMutation({
    mutationFn: (runId: string) => putTenantHomepageSettingsClient({ selectedRunId: runId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: operatorQueryKeys.tenantHomepageSettings });
      props.onOpenChange(false);
    },
  });

  const candidates = candidatesQuery.data ?? [];

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent data-testid="operator-home-featured-sample-picker">
        <DialogHeader>
          <DialogTitle>Choose sample review</DialogTitle>
          <DialogDescription>
            Select a completed review to open from the homepage explore path.
          </DialogDescription>
        </DialogHeader>

        {candidatesQuery.isPending ? (
          <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}>Loading eligible reviews…</p>
        ) : null}

        {candidatesQuery.isError ? (
          <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}>
            Unable to load eligible reviews. Try again later.
          </p>
        ) : null}

        {candidatesQuery.isSuccess && candidates.length === 0 ? (
          <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}>
            No eligible completed reviews are available yet.
          </p>
        ) : null}

        {candidates.length > 0 ? (
          <ul className="m-0 max-h-72 list-none space-y-2 overflow-y-auto p-0">
            {candidates.map((candidate: FeaturedCompletedSampleCandidate) => (
              <li key={candidate.runId}>
                <button
                  type="button"
                  className={cn(
                    "w-full rounded-md border border-neutral-200 p-3 text-left transition hover:border-teal-700/40 dark:border-neutral-800",
                    saveMutation.isPending && "pointer-events-none opacity-60",
                  )}
                  data-testid={`operator-home-featured-sample-option-${candidate.runId}`}
                  onClick={() => saveMutation.mutate(candidate.runId)}
                >
                  <p className={cn("m-0", OPERATOR_TYPE_SCALE.sectionTitle)}>{candidate.reviewTitle}</p>
                  <p className={cn("m-0 mt-1", OPERATOR_TYPE_SCALE.micro, "text-al-text-secondary")}>
                    {candidate.architectureName} · {formatCompletedDate(candidate.completedUtc)}
                    {candidate.isSampleApproved ? " · Sample approved" : ""}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

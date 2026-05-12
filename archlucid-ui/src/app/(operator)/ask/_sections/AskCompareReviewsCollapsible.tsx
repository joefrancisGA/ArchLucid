import { ChevronDown } from "lucide-react";

import { AskRunIdPicker } from "@/components/AskRunIdPicker";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export type AskCompareReviewsCollapsibleProps = {
  buyerPolishedShell: boolean;
  compareOpen: boolean;
  onCompareOpenChange: (open: boolean) => void;
  selectedThreadId: string;
  baseRunId: string;
  onBaseRunIdChange: (value: string) => void;
  targetRunId: string;
  onTargetRunIdChange: (value: string) => void;
};

export function AskCompareReviewsCollapsible(props: AskCompareReviewsCollapsibleProps) {
  const {
    buyerPolishedShell,
    compareOpen,
    onCompareOpenChange,
    selectedThreadId,
    baseRunId,
    onBaseRunIdChange,
    targetRunId,
    onTargetRunIdChange,
  } = props;

  return (
    <Collapsible open={compareOpen} onOpenChange={onCompareOpenChange}>
      <div className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 text-sm text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-200">
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="h-auto w-full justify-between gap-2 p-0 font-medium text-neutral-900 hover:bg-transparent dark:text-neutral-100"
            aria-expanded={compareOpen}
          >
            <span>{buyerPolishedShell ? "Optional comparison review" : "Compare against another review"}</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-neutral-600 transition-transform dark:text-neutral-400",
                compareOpen && "rotate-180",
              )}
              aria-hidden
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 grid gap-3">
          <AskRunIdPicker
            value={baseRunId}
            onChange={onBaseRunIdChange}
            selectedThreadId={selectedThreadId}
            preferAutoPick={false}
            label="Baseline review"
            fieldId="ask-compare-base"
          />
          <AskRunIdPicker
            value={targetRunId}
            onChange={onTargetRunIdChange}
            selectedThreadId={selectedThreadId}
            preferAutoPick={false}
            label="Updated review"
            fieldId="ask-compare-target"
          />
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

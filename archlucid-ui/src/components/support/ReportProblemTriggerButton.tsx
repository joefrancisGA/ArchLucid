"use client";

import { Button } from "@/components/ui/button";
import { REPORT_PROBLEM_ACTION_LABEL } from "@/lib/report-problem-copy";
import { cn } from "@/lib/utils";

export type ReportProblemTriggerButtonProps = {
  readonly onClick: () => void;
  readonly disabled?: boolean;
  readonly className?: string;
  readonly variant?: "default" | "primary" | "outline" | "secondary" | "ghost" | "link" | "destructive";
};

/** Opens `ReportProblemDialog` from error shells and fatal page failures (TB-784). */
export function ReportProblemTriggerButton({
  onClick,
  disabled = false,
  className,
  variant = "outline",
}: ReportProblemTriggerButtonProps): React.JSX.Element {
  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      disabled={disabled}
      className={cn(className)}
      data-testid="report-problem-trigger"
      onClick={onClick}
    >
      {REPORT_PROBLEM_ACTION_LABEL}
    </Button>
  );
}

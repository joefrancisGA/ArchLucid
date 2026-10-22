"use client";

import { Button, type ButtonProps } from "@/components/ui/button";
import { REPORT_PROBLEM_ACTION_LABEL } from "@/lib/report-problem-copy";
import { cn } from "@/lib/utils";

export type ReportProblemTriggerButtonProps = {
  readonly onClick: () => void;
  readonly disabled?: boolean;
  readonly className?: string;
  readonly variant?: "default" | "primary" | "outline" | "secondary" | "ghost" | "link" | "destructive";
};

/** Maps legacy shadcn variant names to canonical operator Button variants (TB-2290). */
function reportProblemButtonVariant(
  variant: ReportProblemTriggerButtonProps["variant"],
): ButtonProps["variant"] {
  switch (variant) {
    case "link":
    case "ghost":
      return "outline";
    case undefined:
      return undefined;
    default:
      return variant;
  }
}

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
      variant={reportProblemButtonVariant(variant)}
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

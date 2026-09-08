"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { buildPinReviewToDeskHref } from "@/lib/reviews/review-pin-run-url";

export type PinReviewToDeskButtonProps = {
  readonly pinRunId: string;
  readonly primaryRunId?: string | null;
  readonly architectureId?: string | null;
  readonly label?: string;
  readonly testId?: string;
  readonly size?: "sm" | "default";
};

/** Entry affordance for DR-11 pin — opens primary review with `pinRunId` query when a desk target exists. */
export function PinReviewToDeskButton(props: PinReviewToDeskButtonProps): React.JSX.Element | null {
  const { isWorkingMode } = useWorkspaceMode();

  if (!isWorkingMode) {
    return null;
  }

  const href = buildPinReviewToDeskHref({
    pinRunId: props.pinRunId,
    primaryRunId: props.primaryRunId,
    architectureId: props.architectureId,
  });

  return (
    <Button
      type="button"
      variant="outline"
      size={props.size ?? "sm"}
      asChild
      data-testid={props.testId ?? `pin-review-to-desk-${props.pinRunId}`}
    >
      <Link href={href}>{props.label ?? "Pin this review"}</Link>
    </Button>
  );
}

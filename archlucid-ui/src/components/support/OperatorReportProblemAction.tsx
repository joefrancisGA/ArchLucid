"use client";

import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

import { ReportProblemDialog } from "@/components/support/ReportProblemDialog";
import {
  ReportProblemTriggerButton,
  type ReportProblemTriggerButtonProps,
} from "@/components/support/ReportProblemTriggerButton";
import { submitReportProblemIntake } from "@/lib/api/report-problem-intake-api";
import {
  buildReportProblemContext,
  type BuildReportProblemContextInput,
} from "@/lib/report-problem-context";

export type OperatorReportProblemActionProps = BuildReportProblemContextInput & {
  readonly enabled: boolean;
  readonly triggerVariant?: ReportProblemTriggerButtonProps["variant"];
};

/** Report problem trigger + dialog prefilled from operator error context (TB-785). */
export function OperatorReportProblemAction(
  props: OperatorReportProblemActionProps,
): React.JSX.Element | null {
  const { enabled, routePath, reviewId, scope, productVersion, correlationId, clientRequestId, problem, errorCode, errorTitle, httpStatus, submittedAtUtc, triggerVariant } =
    props;
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const context = useMemo(
    () =>
      buildReportProblemContext({
        routePath: routePath ?? pathname,
        reviewId,
        scope,
        productVersion,
        correlationId,
        clientRequestId,
        problem,
        errorCode,
        errorTitle,
        httpStatus,
        submittedAtUtc,
      }),
    [
      clientRequestId,
      correlationId,
      errorCode,
      errorTitle,
      httpStatus,
      pathname,
      problem,
      productVersion,
      reviewId,
      routePath,
      scope,
      submittedAtUtc,
    ],
  );

  if (!enabled) {
    return null;
  }

  return (
    <>
      <ReportProblemTriggerButton
        variant={triggerVariant}
        onClick={() => {
          setOpen(true);
        }}
      />
      <ReportProblemDialog
        open={open}
        onOpenChange={setOpen}
        context={context}
        onSubmit={submitReportProblemIntake}
      />
    </>
  );
}

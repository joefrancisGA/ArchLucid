"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState, type SetStateAction } from "react";

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
import {
  parseReportProblemOpenFromSearch,
  reportProblemDialogHrefFromSearch,
} from "@/lib/support/report-problem-dialog-url";

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
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const reportProblemOpenParam = searchParams.get("reportProblemOpen");
  const [open, setOpenState] = useState(() => parseReportProblemOpenFromSearch(reportProblemOpenParam));

  const syncReportProblemOpenToUrl = useCallback(
    (nextOpen: boolean) => {
      router.replace(reportProblemDialogHrefFromSearch(searchParams.toString(), nextOpen, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      setOpenState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncReportProblemOpenToUrl(next);

        return next;
      });
    },
    [syncReportProblemOpenToUrl],
  );

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

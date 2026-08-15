import { cn } from "@/lib/utils";
import Link from "next/link";

import { OperatorMalformedCallout } from "@/components/operator/OperatorShellMessage";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { FatalPageReportProblemSupportRow } from "@/components/support/FatalPageReportProblemAction";
import { RunDetailMinimalChromeMount } from "@/components/runs/RunDetailMinimalChromeMount";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export function RunDetailPageMalformedResponseView(props: { readonly message: string }): React.JSX.Element {
  return (
    <RunDetailMinimalChromeMount>
      <div
        className="w-full max-w-[1200px] space-y-4 px-1 py-2 sm:px-0"
        data-testid="run-detail-load-failure"
      >
        <OperatorPageHeader title="Review detail" headingLevel="h1" />
        <OperatorMalformedCallout>
          <strong>Review detail response was not usable.</strong>
          <p className="mt-2">{props.message}</p>
          <p className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            The review record could not be displayed. Try reloading.
          </p>
        </OperatorMalformedCallout>
        <FatalPageReportProblemSupportRow
          surfaceId="review-detail-hard-load-failure"
          errorTitle="Review detail response was not usable."
          errorCode="malformed-response"
        />
        <p>
          <Link className={OPERATOR_LINK.nav} href="/architecture/reviews">
            ← Back to reviews
          </Link>
        </p>
      </div>
    </RunDetailMinimalChromeMount>
  );
}

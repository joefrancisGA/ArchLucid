"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SECURENOW_PILOT_SPINE_PATH,
  SECURENOW_PILOT_WALKTHROUGH_BEAT_PARAM,
  secureNowPilotSpineStepForBeat,
} from "@/lib/product-line/securenow-pilot-spine-copy";
import { cn } from "@/lib/utils";

type SecureNowPilotWalkthroughBannerProps = {
  readonly productLine: string;
};

/** Shows beat context when the operator followed a pilot-spine or public-sample handoff link. */
export function SecureNowPilotWalkthroughBanner(props: SecureNowPilotWalkthroughBannerProps): React.JSX.Element | null {
  const { productLine } = props;
  const searchParams = useSearchParams();
  const beatRaw = searchParams.get(SECURENOW_PILOT_WALKTHROUGH_BEAT_PARAM);

  if (productLine !== "security" || beatRaw === null) {
    return null;
  }

  const beat = Number.parseInt(beatRaw, 10);
  const step = secureNowPilotSpineStepForBeat(beat);

  if (step === null) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-md border border-amber-200 bg-amber-50/90 p-3 dark:border-amber-900 dark:bg-amber-950/40",
      )}
      data-testid="securenow-pilot-walkthrough-banner"
      role="status"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
        <span className="font-medium">
          Pilot walkthrough beat {step.beat}/{6} — {step.title}
        </span>
        . Synthetic fixture. Not a customer result.
      </p>
      <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>{step.body}</p>
      <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>
        <Link className={OPERATOR_LINK.inline} href={`${SECURENOW_PILOT_SPINE_PATH}#${step.anchorId}`}>
          Back to pilot checklist
        </Link>
      </p>
    </div>
  );
}

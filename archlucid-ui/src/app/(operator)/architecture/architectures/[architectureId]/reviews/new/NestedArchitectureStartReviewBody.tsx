"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { FirstPilotIntakeWizard } from "@/app/(operator)/architecture/reviews/new/FirstPilotIntakeWizard";
import { SocraticIntakeWizard } from "@/app/(operator)/architecture/reviews/new/SocraticIntakeWizard";
import {
  startReviewFromArchitectureNestedGuidedHref,
} from "@/lib/architecture/architecture-routes";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { REVIEWS_NEW_GUIDED_INTAKE_PATH_TOKEN, REVIEWS_NEW_GUIDED_QUESTIONS_LABEL } from "@/lib/reviews-new-path-copy";

type NestedArchitectureStartReviewBodyProps = {
  readonly architectureId: string;
};

/** Working nested start-review intake — expert quick start by default; Guided questions on explicit opt-in (WS-11). */
export function NestedArchitectureStartReviewBody(
  props: NestedArchitectureStartReviewBodyProps,
): React.JSX.Element {
  const searchParams = useSearchParams();
  const pathQuery = searchParams?.get("path")?.trim().toLowerCase() ?? "";
  const guidedIntakeHref = startReviewFromArchitectureNestedGuidedHref(props.architectureId);

  if (pathQuery === REVIEWS_NEW_GUIDED_INTAKE_PATH_TOKEN) {
    return (
      <div data-testid="nested-architecture-start-review" data-architecture-id={props.architectureId}>
        <SocraticIntakeWizard />
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="nested-architecture-start-review" data-architecture-id={props.architectureId}>
      <FirstPilotIntakeWizard />
      <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="nested-architecture-guided-intake-secondary">
        Need structured clarifying questions instead?{" "}
        <Link href={guidedIntakeHref} className={OPERATOR_LINK.nav}>
          {REVIEWS_NEW_GUIDED_QUESTIONS_LABEL}
        </Link>
      </p>
    </div>
  );
}

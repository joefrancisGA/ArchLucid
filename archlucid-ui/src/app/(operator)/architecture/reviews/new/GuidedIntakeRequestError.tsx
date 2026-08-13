"use client";

import { useEffect, useRef } from "react";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { isApiRequestError } from "@/lib/api-request-error";
import { GUIDED_INTAKE_REQUEST_FAILED_FALLBACK } from "@/lib/guided-intake-copy";

type GuidedIntakeRequestErrorProps = {
  readonly error: unknown;
};

/**
 * Keeps a failed request next to the control that triggered it. The wizard's primary CTA sits at the
 * bottom of a long step, so an error rendered at the page top lands off-screen on click.
 */
export function GuidedIntakeRequestError(props: GuidedIntakeRequestErrorProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    // jsdom has no layout engine, so scrollIntoView is absent under unit tests.
    if (container === null || typeof container.scrollIntoView !== "function") {
      return;
    }

    container.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [props.error]);

  return (
    <div ref={containerRef} data-testid="guided-intake-request-error">
      <OperatorApiProblem
        problem={isApiRequestError(props.error) ? props.error.problem : null}
        fallbackMessage={
          isApiRequestError(props.error) ? props.error.message : GUIDED_INTAKE_REQUEST_FAILED_FALLBACK
        }
      />
    </div>
  );
}

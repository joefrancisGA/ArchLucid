import Link from "next/link";

import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { RunDetailMinimalChromeMount } from "@/components/RunDetailMinimalChromeMount";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";

export function RunDetailPageFetchErrorView(props: {
  readonly loadFailure: ApiLoadFailureState | null;
  readonly fallbackMessage: string;
}): React.JSX.Element {
  return (
    <RunDetailMinimalChromeMount>
      <div className="mx-auto max-w-4xl space-y-4 px-1 py-2 sm:px-0">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Review detail</h1>
        <OperatorApiProblem
          problem={props.loadFailure?.problem ?? null}
          fallbackMessage={props.fallbackMessage}
          correlationId={props.loadFailure?.correlationId ?? null}
        />
        <p>
          <Link className="text-teal-800 underline dark:text-teal-300" href="/reviews?projectId=default">
            ← Back to reviews
          </Link>
        </p>
      </div>
    </RunDetailMinimalChromeMount>
  );
}

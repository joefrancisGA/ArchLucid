import Link from "next/link";

import { OperatorMalformedCallout } from "@/components/OperatorShellMessage";
import { RunDetailMinimalChromeMount } from "@/components/RunDetailMinimalChromeMount";

export function RunDetailPageMalformedResponseView(props: { readonly message: string }): React.JSX.Element {
  return (
    <RunDetailMinimalChromeMount>
      <div className="mx-auto max-w-4xl space-y-4 px-1 py-2 sm:px-0">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Review detail</h1>
        <OperatorMalformedCallout>
          <strong>Review detail response was not usable.</strong>
          <p className="mt-2">{props.message}</p>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            The review record could not be displayed. Try reloading.
          </p>
        </OperatorMalformedCallout>
        <p>
          <Link className="text-teal-800 underline dark:text-teal-300" href="/reviews?projectId=default">
            ← Back to reviews
          </Link>
        </p>
      </div>
    </RunDetailMinimalChromeMount>
  );
}

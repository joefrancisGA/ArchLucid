import Link from "next/link";

import { OperatorBrandedNotFound } from "@/components/OperatorBrandedNotFound";

/** Review detail not-found — stale or unknown review id. */
export default function ReviewDetailNotFound() {
  return (
    <div className="mx-auto max-w-4xl px-1 py-6 sm:px-0">
      <OperatorBrandedNotFound showProcessingHint retryLabel="Refresh" />
      <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
        Return to your{" "}
        <Link href="/reviews?projectId=default" className="font-medium text-teal-800 underline dark:text-teal-300">
          review packages list
        </Link>{" "}
        to pick an active architecture review.
      </p>
    </div>
  );
}

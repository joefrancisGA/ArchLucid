import Link from "next/link";

import { OperatorBrandedNotFound } from "@/components/OperatorBrandedNotFound";

/** Signed manifest not-found — stale or unknown manifest id. */
export default function ManifestDetailNotFound() {
  return (
    <div className="mx-auto max-w-4xl px-1 py-6 sm:px-0">
      <OperatorBrandedNotFound showProcessingHint />
      <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
        Open a finalized review package from{" "}
        <Link href="/reviews?projectId=default" className="font-medium text-teal-800 underline dark:text-teal-300">
          review packages
        </Link>{" "}
        to reach its signed manifest.
      </p>
    </div>
  );
}

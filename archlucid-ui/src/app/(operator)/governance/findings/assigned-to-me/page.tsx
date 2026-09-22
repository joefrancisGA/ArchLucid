import { redirect } from "next/navigation";
import { Suspense } from "react";

import { GovernanceFindingsQueueSkeleton } from "../GovernanceFindingsQueueSkeleton";

import { GovernanceFindingsQueueClientDeferred } from "../governance-findings-deferred-chunks";
import { GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import { assignedToMeFindingsPathForProductLine } from "@/lib/product-line/securenow-assigned-to-me-route";
import { resolveProductLineIdFromEnv } from "@/lib/product-line/resolve-product-line-id";

type AssignedToMeFindingsPageProps = {
  readonly searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/** Personal assigned-to-me findings queue (TB-2195). */
export default async function AssignedToMeFindingsPage(props: AssignedToMeFindingsPageProps) {
  const canonicalPath = assignedToMeFindingsPathForProductLine(resolveProductLineIdFromEnv());

  if (canonicalPath !== GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH) {
    const searchParams = props.searchParams !== undefined ? await props.searchParams : {};
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(searchParams)) {
      if (value === undefined) {
        continue;
      }

      if (Array.isArray(value)) {
        for (const entry of value) {
          params.append(key, entry);
        }
      } else {
        params.set(key, value);
      }
    }

    const query = params.toString();

    redirect(query.length === 0 ? canonicalPath : `${canonicalPath}?${query}`);
  }

  return (
    <Suspense fallback={<GovernanceFindingsQueueSkeleton />}>
      <GovernanceFindingsQueueClientDeferred mode="assigned-to-me" />
    </Suspense>
  );
}

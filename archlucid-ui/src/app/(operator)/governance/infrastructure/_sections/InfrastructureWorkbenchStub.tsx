"use client";

import Link from "next/link";

import { LayerHeader } from "@/components/LayerHeader";
import type { LayerGuidancePageKey } from "@/lib/layer-guidance";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type InfrastructureWorkbenchStubProps = {
  pageKey: LayerGuidancePageKey;
  shippedInBatch: string;
  lead: string;
};

/** Thin placeholder for IE-UX-00 route stubs until sibling workbench batches land. */
export function InfrastructureWorkbenchStub({
  pageKey,
  shippedInBatch,
  lead,
}: InfrastructureWorkbenchStubProps) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
      <LayerHeader pageKey={pageKey} density="compact" />
      <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>{lead}</p>
      <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        Full workbench ships in <strong>{shippedInBatch}</strong>. Contract: infrastructure evidence plane
        (one Azure collector; AI explains evidence, it is not the evidence).
      </p>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
        <Link className="text-al-link hover:underline" href="/governance/infrastructure">
          Back to Infrastructure overview
        </Link>
      </p>
    </div>
  );
}

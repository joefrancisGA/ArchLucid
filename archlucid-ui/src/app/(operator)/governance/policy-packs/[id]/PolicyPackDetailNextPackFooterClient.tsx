"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import { listPolicyPacks } from "@/lib/api";
import { policyPacksHubPathFromPathname } from "@/lib/product-line/securenow-compliance-routes";
import { resolveNextPolicyPackInList } from "@/lib/resolve-next-policy-pack-in-list";
import type { PolicyPack } from "@/types/policy-packs";

import { PolicyPackDetailNextPackFooter } from "./PolicyPackDetailNextPackFooter";

export type PolicyPackDetailNextPackFooterClientProps = {
  readonly policyPackId: string;
  readonly reviewId?: string;
};

/** Loads workspace pack list context and renders the next-pack footer when available. */
export function PolicyPackDetailNextPackFooterClient(
  props: PolicyPackDetailNextPackFooterClientProps,
): React.JSX.Element | null {
  const [packs, setPacks] = useState<readonly PolicyPack[]>([]);

  const loadPacks = useCallback(async () => {
    try {
      const rows = await listPolicyPacks();
      setPacks(rows);
    } catch {
      setPacks([]);
    }
  }, []);

  useEffect(() => {
    void loadPacks();
  }, [loadPacks]);

  const hubPath = policyPacksHubPathFromPathname(usePathname());
  const nextPack = useMemo(
    () => resolveNextPolicyPackInList(packs, props.policyPackId, props.reviewId, hubPath),
    [hubPath, packs, props.policyPackId, props.reviewId],
  );

  if (nextPack === null) {
    return null;
  }

  return <PolicyPackDetailNextPackFooter target={nextPack} />;
}

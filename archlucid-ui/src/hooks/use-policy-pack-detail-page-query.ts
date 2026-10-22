"use client";

import { getPolicyPackVersion, listPolicyPacks, listPolicyPackWorkspaceSelection } from "@/lib/api";
import { parsePolicyPackContentDocument } from "@/lib/policy/policy-pack-impact-preview";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import type {
  PolicyPack,
  PolicyPackContentDocument,
  PolicyPackWorkspaceSelectionItem,
} from "@/types/policy-packs";

export type PolicyPackDetailPageQueryResult = {
  readonly packRecord: PolicyPack | null;
  readonly packContent: PolicyPackContentDocument | null;
  readonly workspaceSelection: readonly PolicyPackWorkspaceSelectionItem[];
};

async function fetchPolicyPackDetailPage(policyPackId: string): Promise<PolicyPackDetailPageQueryResult> {
  const trimmed = policyPackId.trim();
  const [packs, selection] = await Promise.all([
    listPolicyPacks(),
    listPolicyPackWorkspaceSelection().catch(() => [] as PolicyPackWorkspaceSelectionItem[]),
  ]);
  const match = packs.find((pack) => pack.policyPackId.trim() === trimmed) ?? null;
  let packContent: PolicyPackContentDocument | null = null;

  if (match !== null) {
    const version = match.currentVersion?.trim() ?? "";

    if (version.length > 0) {
      try {
        const versionDetail = await getPolicyPackVersion(trimmed, version);
        packContent = parsePolicyPackContentDocument(versionDetail.contentJson);
      } catch {
        packContent = null;
      }
    }
  }

  return {
    packRecord: match,
    packContent,
    workspaceSelection: selection,
  };
}

type UsePolicyPackDetailPageQueryOptions = {
  readonly enabled?: boolean;
};

export function usePolicyPackDetailPageQuery(
  policyPackId: string,
  options?: UsePolicyPackDetailPageQueryOptions,
) {
  const trimmed = policyPackId.trim();

  return createOperatorQueryHook<PolicyPackDetailPageQueryResult>({
    queryKey: operatorQueryKeys.policyPackDetailPage(trimmed),
    queryFn: () => fetchPolicyPackDetailPage(trimmed),
    enabled: (options?.enabled ?? true) && trimmed.length > 0,
  });
}

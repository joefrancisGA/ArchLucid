import { isUuidLike } from "@/lib/resolve-governance-finding-resource-group";

/** Authority and pilot APIs persist runs under GUID route keys — demo slugs must not hit the live surface. */
export function isLiveAuthorityRunId(runId: string): boolean {
  return isUuidLike(runId.trim());
}

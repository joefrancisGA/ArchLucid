import { parseIsoUtcMs } from "@/lib/format-iso-utc";
import type { PolicyPack } from "@/types/policy-packs";

function policyPackRecencyMs(pack: PolicyPack): number {
  const activatedMs = parseIsoUtcMs(pack.activatedUtc ?? "");
  if (!Number.isNaN(activatedMs)) {
    return activatedMs;
  }

  const createdMs = parseIsoUtcMs(pack.createdUtc ?? "");
  return Number.isNaN(createdMs) ? Number.NEGATIVE_INFINITY : createdMs;
}

export function sortPolicyPacksByRecency(packs: readonly PolicyPack[]): PolicyPack[] {
  return packs
    .map((pack) => ({ pack, recencyMs: policyPackRecencyMs(pack) }))
    .sort((left, right) => left.recencyMs === right.recencyMs ? 0 : right.recencyMs - left.recencyMs)
    .map(({ pack }) => pack);
}

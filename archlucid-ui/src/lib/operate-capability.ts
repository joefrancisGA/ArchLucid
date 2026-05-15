import { AUTHORITY_RANK } from "@/lib/nav-authority";

/**
 * Whether the caller’s numeric rank should **soft-enable** Execute-class POST/toggle controls on **Operate** routes.
 *
 * **UI shaping only — API authoritative:** success/failure is still enforced with **`[Authorize(Policy = …)]`** on **ArchLucid.Api**.
 */
export function operateCapabilityFromRank(rank: number): boolean {
  return rank >= AUTHORITY_RANK.ExecuteAuthority;
}

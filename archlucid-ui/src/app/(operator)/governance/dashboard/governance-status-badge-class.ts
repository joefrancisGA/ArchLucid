import { governanceDomainBadgeClass } from "@/lib/status-pill-domain-classes";

/**
 * @deprecated Prefer `<StatusPill status={status} domain="governance" />` from `@/components/StatusPill`.
 *   Kept one release for external call sites that still compose `Badge` with raw Tailwind strings.
 */
export function governanceStatusBadgeClass(status: string): string {
  return governanceDomainBadgeClass(status);
}

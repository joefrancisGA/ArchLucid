import type { SecurityDeclaredConnectionRow, SecurityDeclaredConnectionStatus } from "@/lib/security-declared-connection-types";
import { parseIsoUtcMs } from "@/lib/format-iso-utc";

const NEAR_EXPIRY_MS = 14 * 24 * 60 * 60 * 1000;

export type DeclaredConnectionDisplayStatus = SecurityDeclaredConnectionStatus | "NearExpiry";

export function resolveDeclaredConnectionDisplayStatus(
  row: SecurityDeclaredConnectionRow,
  nowMs: number = Date.now(),
): DeclaredConnectionDisplayStatus {
  const status = readDeclaredConnectionStatus(row.status);

  switch (status) {
    case "Expired":
    case "Revoked":
      return status;
    case "Active":
      return resolveActiveDeclaredConnectionDisplayStatus(row.expirationUtc, nowMs);
    default: {
      const unexpected: never = status;

      return unexpected;
    }
  }
}

function readDeclaredConnectionStatus(
  status: SecurityDeclaredConnectionStatus | undefined,
): SecurityDeclaredConnectionStatus {
  // TypeScript 7 keeps `undefined` on property access after a negative status check.
  if (status === "Active" || status === "Expired" || status === "Revoked") {
    return status;
  }

  return "Active";
}

function resolveActiveDeclaredConnectionDisplayStatus(
  expirationUtc: string,
  nowMs: number,
): DeclaredConnectionDisplayStatus {
  const expiryMs = parseIsoUtcMs(expirationUtc);

  if (!Number.isNaN(expiryMs) && expiryMs > nowMs && expiryMs - nowMs <= NEAR_EXPIRY_MS) {
    return "NearExpiry";
  }

  return "Active";
}

export function countActiveDeclaredConnections(rows: readonly SecurityDeclaredConnectionRow[]): number {
  return rows.filter((row) => row.status === "Active").length;
}

export function sortDeclaredConnectionsByExpiry(
  rows: readonly SecurityDeclaredConnectionRow[],
): SecurityDeclaredConnectionRow[] {
  return [...rows].sort((left, right) => {
    const leftMs = parseIsoUtcMs(left.expirationUtc);
    const rightMs = parseIsoUtcMs(right.expirationUtc);

    if (Number.isNaN(leftMs) && Number.isNaN(rightMs)) {
      return 0;
    }

    if (Number.isNaN(leftMs)) {
      return 1;
    }

    if (Number.isNaN(rightMs)) {
      return -1;
    }

    return leftMs - rightMs;
  });
}

export function isExpirationUtcInFuture(value: string, nowMs: number = Date.now()): boolean {
  const ms = parseIsoUtcMs(value.trim());

  return !Number.isNaN(ms) && ms > nowMs;
}

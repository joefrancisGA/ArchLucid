import type { ArchLucidAppRole } from "@/lib/current-principal";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

export type AdminDirectoryUserRow = {
  userId: string;
  displayName: string;
  email: string;
  authorityLabel: string;
  /** Present when the API returned `authorityRank` alongside a synthetic label. */
  authorityRank?: number;
};

export type AdminDirectoryApiKeyRow = {
  credentialId: string;
  displayName: string;
  hint: string;
  authorityLabel: string;
  authorityRank?: number;
};

/**
 * Maps directory / authority strings and optional API ranks to ArchLucid app roles shown in admin UIs.
 * Falls back to Reader when the payload is ambiguous (server policies remain authoritative).
 */
export function archLucidAppRoleFromDirectoryFields(authorityLabel: string, authorityRank?: unknown): ArchLucidAppRole {
  const fromLabel = normalizeArchLucidAppRole(authorityLabel);

  if (fromLabel !== null) {
    return fromLabel;
  }

  if (typeof authorityRank === "number" && Number.isFinite(authorityRank)) {
    if (authorityRank >= AUTHORITY_RANK.AdminAuthority) {
      return "Admin";
    }

    if (authorityRank >= AUTHORITY_RANK.ExecuteAuthority) {
      return "Operator";
    }

    if (authorityRank >= AUTHORITY_RANK.ReadAuthority) {
      return "Reader";
    }
  }

  const rankMatch = /^Rank\s*(\d+)/i.exec(authorityLabel);

  if (rankMatch !== null) {
    const rankValue = Number.parseInt(rankMatch[1] ?? "0", 10);

    if (rankValue === AUTHORITY_RANK.AdminAuthority) {
      return "Admin";
    }

    if (rankValue === AUTHORITY_RANK.ExecuteAuthority) {
      return "Operator";
    }

    if (rankValue === AUTHORITY_RANK.ReadAuthority) {
      return "Reader";
    }
  }

  return "Reader";
}

function normalizeArchLucidAppRole(value: string | null | undefined): ArchLucidAppRole | null {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed === "Admin" || trimmed === "AdminAuthority") {
    return "Admin";
  }

  if (trimmed === "Operator" || trimmed === "ExecuteAuthority") {
    return "Operator";
  }

  if (trimmed === "Reader" || trimmed === "ReadAuthority") {
    return "Reader";
  }

  if (trimmed === "Auditor") {
    return "Auditor";
  }

  return null;
}

/** Parses GET /v1/admin/users style payloads (`users` or `items` arrays). */
export function parseAdminUsersDirectoryPayload(json: unknown): AdminDirectoryUserRow[] {
  if (json === null || typeof json !== "object") {
    return [];
  }

  const root = json as { users?: unknown; items?: unknown };
  const raw = Array.isArray(root.users) ? root.users : Array.isArray(root.items) ? root.items : null;

  if (raw === null) {
    return [];
  }

  const rows: AdminDirectoryUserRow[] = [];

  for (const entry of raw) {
    if (entry === null || typeof entry !== "object") {
      continue;
    }

    const record = entry as Record<string, unknown>;
    const userId = String(record.userId ?? record.id ?? "");

    if (userId.length === 0) {
      continue;
    }

    const displayName = String(record.displayName ?? record.name ?? "—");
    const email = String(record.email ?? "—");
    const rank = record.authorityRank;
    const role = record.role ?? record.maxAuthority;
    const authorityLabel =
      typeof role === "string" && role.length > 0
        ? role
        : typeof rank === "number" && Number.isFinite(rank)
          ? `Rank ${rank}`
          : "—";
    const rankNumber = typeof rank === "number" && Number.isFinite(rank) ? rank : undefined;

    rows.push({ userId, displayName, email, authorityLabel, authorityRank: rankNumber });
  }

  return rows;
}

/**
 * Parses optional GET /v1/admin/api-keys style payloads. Shape varies by implementation; tolerant of common keys.
 */
export function parseAdminApiKeysDirectoryPayload(json: unknown): AdminDirectoryApiKeyRow[] {
  if (json === null || typeof json !== "object") {
    return [];
  }

  const root = json as { items?: unknown; apiKeys?: unknown; keys?: unknown };
  const raw = Array.isArray(root.apiKeys)
    ? root.apiKeys
    : Array.isArray(root.keys)
      ? root.keys
      : Array.isArray(root.items)
        ? root.items
        : null;

  if (raw === null) {
    return [];
  }

  const rows: AdminDirectoryApiKeyRow[] = [];

  for (const entry of raw) {
    if (entry === null || typeof entry !== "object") {
      continue;
    }

    const record = entry as Record<string, unknown>;
    const credentialId = String(record.credentialId ?? record.apiKeyId ?? record.keyId ?? record.id ?? "");

    if (credentialId.length === 0) {
      continue;
    }

    const displayName = String(record.displayName ?? record.name ?? record.label ?? "API key");
    const hint = String(record.maskedKey ?? record.keyHint ?? record.hint ?? record.preview ?? "—");
    const rank = record.authorityRank;
    const role = record.role ?? record.maxAuthority ?? record.appRole;
    const authorityLabel =
      typeof role === "string" && role.length > 0
        ? role
        : typeof rank === "number" && Number.isFinite(rank)
          ? `Rank ${rank}`
          : "—";

    const rankNumber = typeof rank === "number" && Number.isFinite(rank) ? rank : undefined;

    rows.push({ credentialId, displayName, hint, authorityLabel, authorityRank: rankNumber });
  }

  return rows;
}

import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

export const ADMIN_USER_INVITE_PATH = "/api/proxy/v1/admin/users/invite";
export const ADMIN_USER_INVITATIONS_PATH = "/api/proxy/v1/admin/users/invitations";

export type AdminUserInvitationRow = {
  id: string;
  email: string;
  appRole: string;
  status: string;
  tenantName: string;
  workspaceId: string;
  invitedByActorId: string;
  message: string | null;
  createdUtc: string;
  expiresUtc: string;
  invitationToken?: string | null;
  acceptPath?: string | null;
  acceptUrl?: string | null;
};

export type SendAdminUserInvitationResult =
  | { ok: true; invitation: AdminUserInvitationRow }
  | { ok: false; reason: "http_error" | "network_error" | "invalid_response" };

export function parseAdminUserInvitation(json: unknown): AdminUserInvitationRow | null {
  if (json === null || typeof json !== "object") {
    return null;
  }

  const record = json as Record<string, unknown>;
  const id = String(record.id ?? "");

  if (id.length === 0) {
    return null;
  }

  return {
    id,
    email: String(record.email ?? ""),
    appRole: String(record.appRole ?? ""),
    status: String(record.status ?? ""),
    tenantName: String(record.tenantName ?? ""),
    workspaceId: String(record.workspaceId ?? ""),
    invitedByActorId: String(record.invitedByActorId ?? ""),
    message: typeof record.message === "string" ? record.message : null,
    createdUtc: String(record.createdUtc ?? ""),
    expiresUtc: String(record.expiresUtc ?? ""),
    invitationToken: typeof record.invitationToken === "string" ? record.invitationToken : null,
    acceptPath: typeof record.acceptPath === "string" ? record.acceptPath : null,
    acceptUrl: typeof record.acceptUrl === "string" ? record.acceptUrl : null,
  };
}

export function parseAdminUserInvitationsList(json: unknown): AdminUserInvitationRow[] {
  if (json === null || typeof json !== "object") {
    return [];
  }

  const root = json as { invitations?: unknown };
  const raw = Array.isArray(root.invitations) ? root.invitations : null;

  if (raw === null) {
    return [];
  }

  const rows: AdminUserInvitationRow[] = [];

  for (const entry of raw) {
    const parsed = parseAdminUserInvitation(entry);

    if (parsed !== null) {
      rows.push(parsed);
    }
  }

  return rows;
}

export async function sendAdminUserInvitation(
  email: string,
  appRole: string,
  message: string,
  fetchFn: typeof fetch = fetch,
): Promise<SendAdminUserInvitationResult> {
  try {
    const res = await fetchFn(
      ADMIN_USER_INVITE_PATH,
      mergeRegistrationScopeForProxy({
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ email, appRole, message: message || undefined }),
      }),
    );

    if (!res.ok) {
      return { ok: false, reason: "http_error" };
    }

    const json: unknown = await res.json();
    const invitation = parseAdminUserInvitation(json);

    if (invitation === null) {
      return { ok: false, reason: "invalid_response" };
    }

    return { ok: true, invitation };
  } catch {
    return { ok: false, reason: "network_error" };
  }
}

export async function fetchAdminUserInvitations(
  fetchFn: typeof fetch = fetch,
): Promise<AdminUserInvitationRow[] | null> {
  try {
    const res = await fetchFn(
      ADMIN_USER_INVITATIONS_PATH,
      mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }),
    );

    if (!res.ok) {
      return null;
    }

    const json: unknown = await res.json();

    return parseAdminUserInvitationsList(json);
  } catch {
    return null;
  }
}

export async function revokeAdminUserInvitation(
  invitationId: string,
  fetchFn: typeof fetch = fetch,
): Promise<boolean> {
  const id = invitationId.trim();

  if (id.length === 0) {
    return false;
  }

  try {
    const res = await fetchFn(
      `${ADMIN_USER_INVITATIONS_PATH}/${encodeURIComponent(id)}`,
      mergeRegistrationScopeForProxy({ method: "DELETE" }),
    );

    return res.status === 204;
  } catch {
    return false;
  }
}

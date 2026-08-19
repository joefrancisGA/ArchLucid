import type { components } from "@/lib/openapi-schemas";

export type AdminTenantRecord = components["schemas"]["TenantRecord"];
export type AdminTenantProvisionRequest = components["schemas"]["TenantProvisionAdminRequest"];
export type AdminTenantProvisioningResult = components["schemas"]["TenantProvisioningResult"];
export type AdminTenantTier = components["schemas"]["TenantTier"];

async function readProblemDetail(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { detail?: string; title?: string };
    const detail = body.detail?.trim() ?? "";

    if (detail.length > 0) {
      return detail;
    }

    const title = body.title?.trim() ?? "";

    if (title.length > 0) {
      return title;
    }
  } catch {
    // fall through
  }

  return `Request failed (${res.status})`;
}

export async function listAdminTenants(): Promise<AdminTenantRecord[]> {
  const res = await fetch("/api/proxy/v1/internal/tenants", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(await readProblemDetail(res));
  }

  return (await res.json()) as AdminTenantRecord[];
}

export async function provisionAdminTenant(
  body: AdminTenantProvisionRequest,
): Promise<AdminTenantProvisioningResult> {
  const res = await fetch("/api/proxy/v1/internal/tenants", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(await readProblemDetail(res));
  }

  return (await res.json()) as AdminTenantProvisioningResult;
}

export async function suspendAdminTenant(tenantId: string): Promise<void> {
  const res = await fetch(`/api/proxy/v1/internal/tenants/${encodeURIComponent(tenantId)}/suspend`, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(await readProblemDetail(res));
  }
}

export async function unsuspendAdminTenant(tenantId: string): Promise<void> {
  const res = await fetch(`/api/proxy/v1/internal/tenants/${encodeURIComponent(tenantId)}/unsuspend`, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(await readProblemDetail(res));
  }
}

export type AdminTenantLifecycleStatus = "active" | "suspended" | "erasure-quarantine";

export function resolveAdminTenantLifecycleStatus(row: AdminTenantRecord): AdminTenantLifecycleStatus {
  if (row.offboardedUtc != null && String(row.offboardedUtc).trim().length > 0) {
    return "erasure-quarantine";
  }

  if (row.suspendedUtc != null && String(row.suspendedUtc).trim().length > 0) {
    return "suspended";
  }

  return "active";
}

export function canProvisionAdminTenantForm(name: string, adminEmail: string): boolean {
  const trimmedName = name.trim();
  const trimmedEmail = adminEmail.trim();

  if (trimmedName.length === 0 || trimmedEmail.length === 0) {
    return false;
  }

  return trimmedEmail.includes("@");
}

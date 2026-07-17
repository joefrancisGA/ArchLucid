import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

export type TenantAuthDomainRecord = {
  tenantId: string;
  displayDomain: string;
  normalizedDomain: string;
  verificationStatus: string;
  enforcementMode: string;
  dnsVerificationToken?: string | null;
  requireEnterpriseSso: boolean;
  allowEmailOtpRecovery: boolean;
  createdUtc: string;
  verificationPendingUtc?: string | null;
  verifiedUtc?: string | null;
  verificationFailedUtc?: string | null;
  removedUtc?: string | null;
  updatedUtc?: string | null;
  routingTestPassedUtc?: string | null;
  enforcementEnabledUtc?: string | null;
  isEnforcementActive: boolean;
};

export type TenantAuthDomainAdminResponse = {
  domain: TenantAuthDomainRecord;
  dnsVerificationInstruction: string;
};

export type TenantAuthDomainRecoveryAdminRecord = {
  tenantId: string;
  normalizedDomain: string;
  normalizedRecoveryAdminEmail: string;
  displayRecoveryAdminEmail: string;
  createdUtc: string;
  createdByActorId: string;
  authenticationVerifiedUtc?: string | null;
};

export type TenantAuthDomainEnforcementChecklistItem = {
  key: string;
  label: string;
  complete: boolean;
  required: boolean;
  detail?: string | null;
};

export type TenantAuthDomainEnforcementReadiness = {
  canEnableEnforcement: boolean;
  hasRecoveryRoute: boolean;
  blockEnforcement: boolean;
  blockReason?: string | null;
  checklist: TenantAuthDomainEnforcementChecklistItem[];
};

export type TenantAuthDomainRecoveryAdminRemovalResult = {
  removed: boolean;
  wasLastRecoveryAdmin: boolean;
  warningMessage?: string | null;
};

export type AuthSignInRoutingPreviewResponse = {
  allowEmailCode: boolean;
  ssoRequired: boolean;
  message?: string | null;
};

async function authDomainsFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const opts = mergeRegistrationScopeForProxy({
    headers: { Accept: "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
    ...init,
  });

  const response = await fetch(path, opts);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Auth domain request failed (HTTP ${response.status}).`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function fetchTenantAuthDomains(): Promise<TenantAuthDomainRecord[]> {
  return authDomainsFetch<TenantAuthDomainRecord[]>("/api/proxy/v1/admin/identity/domains");
}

export async function proposeTenantAuthDomain(domain: string): Promise<TenantAuthDomainAdminResponse> {
  return authDomainsFetch<TenantAuthDomainAdminResponse>("/api/proxy/v1/admin/identity/domains", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ domain }),
  });
}

export async function startTenantAuthDomainVerification(
  normalizedDomain: string,
): Promise<TenantAuthDomainAdminResponse> {
  return authDomainsFetch<TenantAuthDomainAdminResponse>(
    `/api/proxy/v1/admin/identity/domains/${encodeURIComponent(normalizedDomain)}/verification/start`,
    { method: "POST" },
  );
}

export async function checkTenantAuthDomainVerification(
  normalizedDomain: string,
): Promise<TenantAuthDomainAdminResponse> {
  return authDomainsFetch<TenantAuthDomainAdminResponse>(
    `/api/proxy/v1/admin/identity/domains/${encodeURIComponent(normalizedDomain)}/verification/check`,
    { method: "POST" },
  );
}

export async function testTenantAuthDomainRouting(
  normalizedDomain: string,
  testEmail: string,
): Promise<AuthSignInRoutingPreviewResponse> {
  return authDomainsFetch<AuthSignInRoutingPreviewResponse>(
    `/api/proxy/v1/admin/identity/domains/${encodeURIComponent(normalizedDomain)}/routing/test`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ testEmail }),
    },
  );
}

export async function markTenantAuthDomainRoutingTested(
  normalizedDomain: string,
  testEmail: string,
): Promise<TenantAuthDomainAdminResponse> {
  return authDomainsFetch<TenantAuthDomainAdminResponse>(
    `/api/proxy/v1/admin/identity/domains/${encodeURIComponent(normalizedDomain)}/routing/mark-tested`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ testEmail }),
    },
  );
}

export async function setTenantAuthDomainEnforcement(
  normalizedDomain: string,
  enforcementMode: string,
  allowEmailOtpRecovery: boolean,
): Promise<TenantAuthDomainAdminResponse> {
  return authDomainsFetch<TenantAuthDomainAdminResponse>(
    `/api/proxy/v1/admin/identity/domains/${encodeURIComponent(normalizedDomain)}/enforcement`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enforcementMode, allowEmailOtpRecovery }),
    },
  );
}

export async function enableTenantAuthDomainEnforcement(
  normalizedDomain: string,
  confirmTested: boolean,
): Promise<TenantAuthDomainAdminResponse> {
  return authDomainsFetch<TenantAuthDomainAdminResponse>(
    `/api/proxy/v1/admin/identity/domains/${encodeURIComponent(normalizedDomain)}/enforcement/enable`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmTested }),
    },
  );
}

export async function fetchTenantAuthDomainEnforcementReadiness(
  normalizedDomain: string,
): Promise<TenantAuthDomainEnforcementReadiness> {
  return authDomainsFetch<TenantAuthDomainEnforcementReadiness>(
    `/api/proxy/v1/admin/identity/domains/${encodeURIComponent(normalizedDomain)}/enforcement-readiness`,
  );
}

export async function removeTenantAuthDomainRecoveryAdmin(
  normalizedDomain: string,
  normalizedRecoveryAdminEmail: string,
  confirmRemoveLast: boolean,
): Promise<TenantAuthDomainRecoveryAdminRemovalResult> {
  const query = confirmRemoveLast ? "?confirmRemoveLast=true" : "?confirmRemoveLast=false";

  return authDomainsFetch<TenantAuthDomainRecoveryAdminRemovalResult>(
    `/api/proxy/v1/admin/identity/domains/${encodeURIComponent(normalizedDomain)}/recovery-admins/${encodeURIComponent(normalizedRecoveryAdminEmail)}${query}`,
    { method: "DELETE" },
  );
}

export async function fetchTenantAuthDomainRecoveryAdmins(
  normalizedDomain: string,
): Promise<TenantAuthDomainRecoveryAdminRecord[]> {
  return authDomainsFetch<TenantAuthDomainRecoveryAdminRecord[]>(
    `/api/proxy/v1/admin/identity/domains/${encodeURIComponent(normalizedDomain)}/recovery-admins`,
  );
}

export async function addTenantAuthDomainRecoveryAdmin(
  normalizedDomain: string,
  email: string,
): Promise<TenantAuthDomainRecoveryAdminRecord> {
  return authDomainsFetch<TenantAuthDomainRecoveryAdminRecord>(
    `/api/proxy/v1/admin/identity/domains/${encodeURIComponent(normalizedDomain)}/recovery-admins`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    },
  );
}

export async function removeTenantAuthDomain(
  normalizedDomain: string,
): Promise<TenantAuthDomainAdminResponse> {
  return authDomainsFetch<TenantAuthDomainAdminResponse>(
    `/api/proxy/v1/admin/identity/domains/${encodeURIComponent(normalizedDomain)}`,
    { method: "DELETE" },
  );
}

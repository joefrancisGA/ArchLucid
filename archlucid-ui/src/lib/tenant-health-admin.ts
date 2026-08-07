export type AdminTenantHealthSummaryItem = {
  tenantId: string;
  workspaceId: string;
  projectId: string;
  engagementScore: number;
  governanceScore: number;
  pilotFunnelStage: string;
  runsLast7d: number;
  commitsLast7d: number;
  lastActivityUtc: string | null;
};

export type AdminTenantHealthListResponse = {
  items: AdminTenantHealthSummaryItem[];
};

export async function fetchAdminTenantHealthList(): Promise<AdminTenantHealthListResponse> {
  const res = await fetch("/api/proxy/v1/internal/tenant-health", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`tenant-health ${res.status}`);
  }

  const json = (await res.json()) as {
    items?: Array<{
      tenantId?: string;
      workspaceId?: string;
      projectId?: string;
      engagementScore?: number;
      governanceScore?: number;
      pilotFunnelStage?: string;
      runsLast7d?: number;
      commitsLast7d?: number;
      lastActivityUtc?: string | null;
    }>;
  };

  const items = (json.items ?? []).map((row) => ({
    tenantId: row.tenantId ?? "",
    workspaceId: row.workspaceId ?? "",
    projectId: row.projectId ?? "",
    engagementScore: row.engagementScore ?? 0,
    governanceScore: row.governanceScore ?? 0,
    pilotFunnelStage: row.pilotFunnelStage ?? "",
    runsLast7d: row.runsLast7d ?? 0,
    commitsLast7d: row.commitsLast7d ?? 0,
    lastActivityUtc: row.lastActivityUtc ?? null,
  }));

  return { items };
}

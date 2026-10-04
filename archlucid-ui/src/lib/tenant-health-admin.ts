export type AdminTenantHealthSummaryItem = {
  tenantId: string;
  workspaceId: string;
  projectId: string;
  engagementScore: number | null;
  governanceScore: number | null;
  pilotFunnelStage: string;
  runsLast7d: number | null;
  commitsLast7d: number | null;
  lastActivityUtc: string | null;
};

function finiteAdminMetric(value: number | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return value;
}

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
    engagementScore: finiteAdminMetric(row.engagementScore),
    governanceScore: finiteAdminMetric(row.governanceScore),
    pilotFunnelStage: row.pilotFunnelStage ?? "",
    runsLast7d: finiteAdminMetric(row.runsLast7d),
    commitsLast7d: finiteAdminMetric(row.commitsLast7d),
    lastActivityUtc: row.lastActivityUtc ?? null,
  }));

  return { items };
}

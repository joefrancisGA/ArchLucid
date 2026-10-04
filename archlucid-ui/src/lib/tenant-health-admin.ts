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
    engagementScore:
      typeof row.engagementScore === "number" && Number.isFinite(row.engagementScore)
        ? row.engagementScore
        : null,
    governanceScore:
      typeof row.governanceScore === "number" && Number.isFinite(row.governanceScore)
        ? row.governanceScore
        : null,
    pilotFunnelStage: row.pilotFunnelStage ?? "",
    runsLast7d:
      typeof row.runsLast7d === "number" && Number.isFinite(row.runsLast7d) ? row.runsLast7d : null,
    commitsLast7d:
      typeof row.commitsLast7d === "number" && Number.isFinite(row.commitsLast7d)
        ? row.commitsLast7d
        : null,
    lastActivityUtc: row.lastActivityUtc ?? null,
  }));

  return { items };
}

export type TrialFunnelOperationalSummary = {
  activeSelfServiceTrials: number;
  signupAttempts30Days: number;
  signupFailures30Days: number;
  firstCommittedReviews30Days: number;
  trialConversions30Days: number;
  billingCheckouts30Days: number;
  medianSignupToFirstCommitSeconds: number | null;
  estimatedFirstReviewCogsUsdLow: number | null;
  estimatedFirstReviewCogsUsdMid: number | null;
  estimatedFirstReviewCogsUsdHigh: number | null;
  llmBudgetCutoffEvents30Days: number;
  cogsBasisLabel: string;
};

export async function fetchTrialFunnelOperationalSummary(): Promise<TrialFunnelOperationalSummary | null> {
  const res = await fetch("/api/proxy/v1/admin/operational/trial-funnel-summary", {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (res.status === 401 || res.status === 403) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`trial-funnel-summary ${res.status}`);
  }

  const json = (await res.json()) as Record<string, unknown>;

  return {
    activeSelfServiceTrials: Number(json.activeSelfServiceTrials ?? 0),
    signupAttempts30Days: Number(json.signupAttempts30Days ?? 0),
    signupFailures30Days: Number(json.signupFailures30Days ?? 0),
    firstCommittedReviews30Days: Number(json.firstCommittedReviews30Days ?? 0),
    trialConversions30Days: Number(json.trialConversions30Days ?? 0),
    billingCheckouts30Days: Number(json.billingCheckouts30Days ?? 0),
    medianSignupToFirstCommitSeconds:
      typeof json.medianSignupToFirstCommitSeconds === "number"
        ? json.medianSignupToFirstCommitSeconds
        : null,
    estimatedFirstReviewCogsUsdLow:
      typeof json.estimatedFirstReviewCogsUsdLow === "number" ? json.estimatedFirstReviewCogsUsdLow : null,
    estimatedFirstReviewCogsUsdMid:
      typeof json.estimatedFirstReviewCogsUsdMid === "number" ? json.estimatedFirstReviewCogsUsdMid : null,
    estimatedFirstReviewCogsUsdHigh:
      typeof json.estimatedFirstReviewCogsUsdHigh === "number" ? json.estimatedFirstReviewCogsUsdHigh : null,
    llmBudgetCutoffEvents30Days: Number(json.llmBudgetCutoffEvents30Days ?? 0),
    cogsBasisLabel: typeof json.cogsBasisLabel === "string" ? json.cogsBasisLabel : "estimated",
  };
}

export async function acknowledgePricingQuoteRequest(id: string, assignedOwner?: string): Promise<void> {
  const res = await fetch(`/api/proxy/v1/admin/marketing/pricing-quote-requests/${encodeURIComponent(id)}/acknowledge`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ assignedOwner: assignedOwner ?? null }),
  });

  if (!res.ok) {
    throw new Error(`acknowledge quote ${res.status}`);
  }
}

export async function closePricingQuoteRequest(id: string): Promise<void> {
  const res = await fetch(`/api/proxy/v1/admin/marketing/pricing-quote-requests/${encodeURIComponent(id)}/close`, {
    method: "POST",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`close quote ${res.status}`);
  }
}

export type AdminFleetLlmCogsRow = {
  tenantId: string;
  tenantName: string;
  estimatedUsdPressureUtcMonth: number;
  hardCapUsdUtcMonth: number | null;
  blocksAdditionalLlmExecution: boolean;
  hardCapUtilizationFraction: number | null;
  grossMarginRiskLabel: string;
  trialFirstManifestCommittedUtc: string | null;
  costBasisLabel: string;
};

export type AdminFleetLlmCogsDashboard = {
  rows: AdminFleetLlmCogsRow[];
  utcMonth: string;
  costBasisLabel: string;
};

export async function fetchAdminFleetLlmCogsDashboard(): Promise<AdminFleetLlmCogsDashboard | null> {
  const res = await fetch("/api/proxy/v1/admin/operational/fleet-llm-cogs", {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (res.status === 401 || res.status === 403) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`fleet-llm-cogs ${res.status}`);
  }

  const json = (await res.json()) as Record<string, unknown>;
  const rawRows = Array.isArray(json.rows) ? json.rows : [];

  return {
    utcMonth: typeof json.utcMonth === "string" ? json.utcMonth : "",
    costBasisLabel: typeof json.costBasisLabel === "string" ? json.costBasisLabel : "estimated",
    rows: rawRows.map((entry) => {
      const row = entry as Record<string, unknown>;

      return {
        tenantId: String(row.tenantId ?? ""),
        tenantName: String(row.tenantName ?? ""),
        estimatedUsdPressureUtcMonth: Number(row.estimatedUsdPressureUtcMonth ?? 0),
        hardCapUsdUtcMonth:
          typeof row.hardCapUsdUtcMonth === "number" ? row.hardCapUsdUtcMonth : null,
        blocksAdditionalLlmExecution: Boolean(row.blocksAdditionalLlmExecution),
        hardCapUtilizationFraction:
          typeof row.hardCapUtilizationFraction === "number" ? row.hardCapUtilizationFraction : null,
        grossMarginRiskLabel: String(row.grossMarginRiskLabel ?? "healthy"),
        trialFirstManifestCommittedUtc:
          typeof row.trialFirstManifestCommittedUtc === "string" ? row.trialFirstManifestCommittedUtc : null,
        costBasisLabel: String(row.costBasisLabel ?? "estimated"),
      };
    }),
  };
}

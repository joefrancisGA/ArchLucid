export type PricingQuoteAgingRow = {
  id: string;
  createdUtc: string;
  ageHours: number;
  breachStatus: string;
  workEmail: string;
  companyName: string;
  tierInterest: string;
};

export type PricingQuoteAgingDashboard = {
  rows: PricingQuoteAgingRow[];
  warnCount: number;
  breachCount: number;
};

const BREACH_STATUS_RANK: Record<string, number> = {
  "breach at 24h": 0,
  "warn at 18h": 1,
  ok: 2,
};

/** Sorts breach → warn → ok, then oldest requests first within each band. */
export function sortPricingQuoteAgingRows(rows: PricingQuoteAgingRow[]): PricingQuoteAgingRow[] {
  return [...rows].sort((left, right) => {
    const leftRank = BREACH_STATUS_RANK[left.breachStatus] ?? 99;
    const rightRank = BREACH_STATUS_RANK[right.breachStatus] ?? 99;

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return right.ageHours - right.ageHours;
  });
}

export async function fetchPricingQuoteAgingDashboard(): Promise<PricingQuoteAgingDashboard | null> {
  const res = await fetch("/api/proxy/v1/admin/marketing/pricing-quote-aging", {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (res.status === 403 || res.status === 401) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`pricing-quote-aging ${res.status}`);
  }

  const json = (await res.json()) as {
    rows?: Array<{
      id?: string;
      createdUtc?: string;
      ageHours?: number;
      breachStatus?: string;
      workEmail?: string;
      companyName?: string;
      tierInterest?: string;
    }>;
    warnCount?: number;
    breachCount?: number;
  };

  const rows: PricingQuoteAgingRow[] = (json.rows ?? []).map((row) => ({
    id: row.id ?? "",
    createdUtc: row.createdUtc ?? "",
    ageHours: row.ageHours ?? 0,
    breachStatus: row.breachStatus ?? "",
    workEmail: row.workEmail ?? "",
    companyName: row.companyName ?? "",
    tierInterest: row.tierInterest ?? "",
  }));

  return {
    rows: sortPricingQuoteAgingRows(rows),
    warnCount: json.warnCount ?? 0,
    breachCount: json.breachCount ?? 0,
  };
}

export function pricingQuoteAgingRowTone(
  breachStatus: string,
): "ok" | "warn" | "breach" | "unknown" {
  if (breachStatus === "breach at 24h") {
    return "breach";
  }

  if (breachStatus === "warn at 18h") {
    return "warn";
  }

  if (breachStatus === "ok") {
    return "ok";
  }

  return "unknown";
}

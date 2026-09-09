import { apiGet } from "./http";
import type { EngineInsightNoveltyRatesResponse } from "@/lib/quality/engine-insight-novelty-rates";

export async function getEngineInsightNoveltyRates(
  fromUtc: string,
  toUtcExclusive: string,
): Promise<EngineInsightNoveltyRatesResponse> {
  const query = new URLSearchParams({
    from: fromUtc,
    to: toUtcExclusive,
  });

  return apiGet<EngineInsightNoveltyRatesResponse>(
    `/v1/tenants/current/insight-density/novelty-rates?${query.toString()}`,
  );
}

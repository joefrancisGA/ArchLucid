import type { PatternInsightCard } from "@/lib/pattern-library-aggregate-threshold";
import { proxyJsonGet } from "@/lib/proxy-json-client";

export async function fetchPatternLibraryInsightCards(): Promise<PatternInsightCard[]> {
  const payload = await proxyJsonGet<PatternInsightCard[]>("/api/proxy/v1/analytics/patterns");

  return payload ?? [];
}

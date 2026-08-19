import type { PatternInsightCard } from "@/lib/pattern-library-aggregate-threshold";

export async function fetchPatternLibraryInsightCards(): Promise<PatternInsightCard[]> {
  const res = await fetch("/api/proxy/v1/analytics/patterns", {
    headers: { Accept: "application/json" },
  });
  const text = await res.text();

  if (!res.ok) {
    throw new Error(text.length > 0 ? text : `Request failed (${res.status})`);
  }

  return text.length > 0 ? (JSON.parse(text) as PatternInsightCard[]) : [];
}

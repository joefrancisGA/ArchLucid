import { applyPathTemplate, parseProvenanceExplanationPayload } from "@/lib/provenance-explanation-payload";

export type ProvenanceNodeExplanationFetchResult = Readonly<{
  message: string;
  aggregateProxyHref: string | null;
}>;

/** Calls the legacy per-node explanation route; 501 returns Problem+JSON with optional aggregate path template. */
export async function fetchProvenanceNodeExplanationViaProxy(
  runId: string,
  nodeId: string,
): Promise<ProvenanceNodeExplanationFetchResult> {
  const url =
    `/api/proxy/v1/architecture/runs/${encodeURIComponent(runId)}/provenance/${encodeURIComponent(nodeId)}/explanation`;

  try {
    const res = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/problem+json, application/json" },
    });

    const raw: unknown = await res.json();
    const parsed = parseProvenanceExplanationPayload(raw);
    const message = parsed.detail ?? parsed.message ?? parsed.title ?? "";

    const aggregateProxyHref =
      res.status === 501 && parsed.aggregateExplanationPathTemplate !== null
        ? `/api/proxy${applyPathTemplate(parsed.aggregateExplanationPathTemplate, runId)}`
        : null;

    if (res.status === 501)
      return {
        message: message.length > 0 ? message : "Per-node explanations are not supported.",
        aggregateProxyHref,
      };

    return {
      message: message.length > 0 ? message : `HTTP ${String(res.status)}`,
      aggregateProxyHref,
    };
  } catch {
    return { message: "Could not reach the explanation endpoint.", aggregateProxyHref: null };
  }
}

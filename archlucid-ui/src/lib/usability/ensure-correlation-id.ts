import { generateCorrelationId, isSafeCorrelationId } from "@/lib/correlation";

/**
 * Returns a server-provided correlation id when present; otherwise generates a client-side id
 * so every error surface can show a copyable Request ID (TB-271).
 */
export function ensureCorrelationId(correlationId: string | null | undefined): string {
  const trimmed = correlationId?.trim();

  if (trimmed !== undefined && trimmed.length > 0 && isSafeCorrelationId(trimmed)) {
    return trimmed;
  }

  return generateCorrelationId();
}

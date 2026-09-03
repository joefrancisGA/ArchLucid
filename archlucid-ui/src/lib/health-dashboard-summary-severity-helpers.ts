import type { CircuitGateRow } from "@/lib/health-dashboard-types";
import type { ConfigLintPayload } from "@/lib/health-config-lint-presentation";

import { presentConfigLintFindings } from "@/lib/health-config-lint-presentation";
import {
  resolveHealthDisplaySeverity,
  type HealthDisplaySeverity,
} from "@/lib/health-readiness-presentation";

export function circuitSeverity(gates: readonly CircuitGateRow[]): HealthDisplaySeverity {
  if (gates.length === 0) {
    return "healthy";
  }

  return gates.reduce<HealthDisplaySeverity>((current, gate) => {
    const severity = resolveHealthDisplaySeverity(gate.state);

    if (severity === "failing" || current === "failing") {
      return "failing";
    }

    if (severity === "degraded" || current === "degraded") {
      return "degraded";
    }

    return current;
  }, "healthy");
}

export function lintSeverity(payload: ConfigLintPayload | null): HealthDisplaySeverity {
  const findings = presentConfigLintFindings(payload);

  if (findings.blocking.length > 0) {
    return "failing";
  }

  if (findings.advisory.length > 0) {
    return "advisory";
  }

  return "healthy";
}

export function worstOf(left: HealthDisplaySeverity, right: HealthDisplaySeverity): HealthDisplaySeverity {
  const rank: Record<HealthDisplaySeverity, number> = {
    failing: 5,
    degraded: 4,
    advisory: 3,
    unknown: 2,
    "not-configured": 1,
    healthy: 0,
  };

  return rank[left] >= rank[right] ? left : right;
}

export function humanizeCircuitGateName(name: string): string {
  const normalized = name.trim().toLowerCase();

  if (normalized.includes("embedding")) {
    return "Embedding service circuit";
  }

  if (normalized.includes("completion") || normalized.includes("chat")) {
    return "Completion service circuit";
  }

  return name
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

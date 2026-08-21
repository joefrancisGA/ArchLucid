export function resolveDeployEnvironmentLabel(): string {
  const deployEnv = process.env.NEXT_PUBLIC_DEPLOY_ENV?.trim();

  if (deployEnv) {
    return deployEnv;
  }

  return process.env.NODE_ENV === "production" ? "Production" : "Development";
}

export function isProductionDeployEnvironment(): boolean {
  const label = resolveDeployEnvironmentLabel().toLowerCase();

  return label === "production" || label === "prod";
}

export function formatOperationalTimestamp(value: string | null | undefined): string {
  if (!value) {
    return " — ";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString(undefined, { timeZoneName: "short" });
}

export async function copyOperationalIdentifier(value: string): Promise<void> {
  if (!value.trim()) {
    return;
  }

  await navigator.clipboard.writeText(value);
}

export function profileStateLabel(state: string): string {
  switch (state) {
    case "NotBuilt":
      return "Not built";
    case "InsufficientData":
      return "Insufficient data";
    case "Active":
      return "Active";
    default:
      return state;
  }
}

export function deployEnvironmentStatusTagKind(): "needs-attention" | "neutral" {
  return isProductionDeployEnvironment() ? "needs-attention" : "neutral";
}

export function profileStateStatusTagKind(
  state: string,
): "ready" | "needs-attention" | "neutral" {
  switch (state) {
    case "Active":
      return "ready";
    case "InsufficientData":
      return "needs-attention";
    case "NotBuilt":
      return "neutral";
    default:
      return "neutral";
  }
}

export function profileVersionStatusTagKind(isActive: boolean): "ready" | "neutral" {
  return isActive ? "ready" : "neutral";
}

export function validationCheckStatusTagKind(result: string): "ready" | "blocked" | "needs-attention" | "neutral" {
  const normalized = result.trim().toLowerCase();

  if (normalized === "pass" || normalized === "passed" || normalized === "ok") {
    return "ready";
  }

  if (normalized === "fail" || normalized === "failed" || normalized === "error") {
    return "blocked";
  }

  if (normalized === "warn" || normalized === "warning") {
    return "needs-attention";
  }

  return "neutral";
}

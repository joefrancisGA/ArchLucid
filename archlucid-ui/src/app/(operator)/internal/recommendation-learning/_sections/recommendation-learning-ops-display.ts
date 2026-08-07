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
    return "—";
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

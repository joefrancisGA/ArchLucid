function parseTriStateBoolean(raw: string | undefined): boolean | undefined {
  const normalized = (raw ?? "").trim().toLowerCase();

  if (normalized === "1" || normalized === "true") {
    return true;
  }

  if (normalized === "0" || normalized === "false") {
    return false;
  }

  return undefined;
}

/**
 * Whether the running UI targets a customer-operated (self-hosted) deployment rather than managed SaaS.
 *
 * Env override: `NEXT_PUBLIC_ARCHLUCID_SELF_HOSTED=true|false|1|0`
 *
 * Defaults:
 * - **development** (`NODE_ENV=development`): **true** (local engineering stacks)
 * - **production / hosted SaaS**: **false** unless env explicitly enables
 */
export function isSelfHostedDeploymentEnv(): boolean {
  const explicit = parseTriStateBoolean(process.env.NEXT_PUBLIC_ARCHLUCID_SELF_HOSTED);

  if (explicit !== undefined) {
    return explicit;
  }

  return process.env.NODE_ENV === "development";
}

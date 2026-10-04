export function presentTenantHealthAdminCount(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "Not returned";
  }

  return String(Math.trunc(value));
}

/** Admin tenant-health table — missing API fields must not read as zero (UU-503). */
export function presentTenantHealthAdminCount(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "Not returned";
  }

  return String(Math.trunc(value));
}

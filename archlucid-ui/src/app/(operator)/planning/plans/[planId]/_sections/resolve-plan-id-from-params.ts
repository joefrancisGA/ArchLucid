export function resolvePlanIdFromRouteParam(planIdRaw: string | string[] | undefined): string {
  if (typeof planIdRaw === "string") {
    return planIdRaw;
  }

  if (Array.isArray(planIdRaw)) {
    return planIdRaw[0] ?? "";
  }

  return "";
}

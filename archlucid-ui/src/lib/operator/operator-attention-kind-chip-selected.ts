/** True when the current location matches an attention-kind chip destination href. */
export function isOperatorAttentionKindDestinationActive(
  pathname: string,
  searchParams: URLSearchParams,
  destinationHref: string,
): boolean {
  const [rawDestPath, rawDestQuery = ""] = destinationHref.split("?");
  const normalizedPath = (pathname ?? "").split("?")[0]?.replace(/\/$/, "") ?? "";
  const normalizedDestPath = rawDestPath.replace(/\/$/, "") || "/";

  if (normalizedPath !== normalizedDestPath) {
    return false;
  }

  if (rawDestQuery.trim().length === 0) {
    return true;
  }

  const destinationParams = new URLSearchParams(rawDestQuery);

  for (const [key, value] of destinationParams.entries()) {
    if (searchParams.get(key) !== value) {
      return false;
    }
  }

  return true;
}

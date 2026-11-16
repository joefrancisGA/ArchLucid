/** Shown when partial-capture recovery linked here with a return path. */
export const CLOUD_CONNECTIONS_RETURN_PATH_HONESTY_LINE =
  "After capture completes, use Return to prior page to resume where you left off — this link does not auto-navigate." as const;

export function formatCloudConnectionsReturnLinkLabel(returnPath: string): string {
  if (returnPath.includes("remediation-factory")) {
    return "Return to remediation factory";
  }

  if (returnPath === "/" || returnPath.startsWith("/?")) {
    return "Return to operator home";
  }

  return "Return to prior page";
}
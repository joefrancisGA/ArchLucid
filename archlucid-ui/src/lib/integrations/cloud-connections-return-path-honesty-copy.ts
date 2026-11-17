/** Shown when partial-capture recovery linked here with a return path. */
export const CLOUD_CONNECTIONS_RETURN_PATH_HONESTY_LINE =
  "After capture completes, use Return to prior page to resume where you left off — this link does not auto-navigate." as const;

export function formatCloudConnectionsReturnLinkLabel(returnPath: string): string {
  const path = returnPath.split("?")[0] ?? returnPath;

  if (path.includes("remediation-factory")) {
    return "Return to remediation factory";
  }

  if (path.includes("governance/findings")) {
    return "Return to findings queue";
  }

  if (path.includes("securenow-sponsor-path")) {
    return "Return to sponsor path";
  }

  if (path.includes("securenow-pilot-decision")) {
    return "Return to pilot decision";
  }

  if (path.includes("securenow-investigation-effort")) {
    return "Return to investigation effort";
  }

  if (path.includes("extract-upload")) {
    return "Return to extract and upload";
  }

  if (path.includes("help/connection-status")) {
    return "Return to connection status help";
  }

  if (path === "/" || returnPath.startsWith("/?")) {
    return "Return to operator home";
  }

  return "Return to prior page";
}
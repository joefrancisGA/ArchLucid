/**
 * Maps API numeric finding severity (contract enum) to a short UI label.
 * Unknown values fall back to their numeric string so future enum additions still render.
 */
export function findingSeverityLabel(severity: number | undefined): string {
  if (severity === undefined) {
    return "—";
  }

  switch (severity) {
    case 0:
      return "Info";

    case 1:
      return "Warning";

    case 2:
      return "Error";

    case 3:
      return "Critical";

    default:
      return String(severity);
  }
}

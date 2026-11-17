/**
 * Maps API numeric finding severity (contract enum) to a short UI label.
 * Unknown values report that the label was not stored instead of showing a bare number.
 */
export function findingSeverityLabel(severity: number | null | undefined): string {
  if (severity === undefined || severity === null) {
    return "Severity was not stored.";
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
      return "Severity label was not stored.";
  }
}

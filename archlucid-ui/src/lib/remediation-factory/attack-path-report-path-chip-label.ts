import {
  PATH_INSPECT_LONG_PATH_ID_OVERFLOW_LINE,
  shouldShowPathInspectLongPathIdHonesty,
} from "@/lib/product-line/path-inspect-long-path-id-honesty-copy";

export function formatAttackPathReportPathChipLabel(pathId: string): string {
  const trimmed = pathId.trim();

  if (trimmed.length <= 28) {
    return trimmed;
  }

  return `${trimmed.slice(0, 10)}…${trimmed.slice(-10)}`;
}

export function attackPathReportPathChipOverflowLine(pathIds: ReadonlyArray<string>): string | null {
  if (!pathIds.some((pathId) => shouldShowPathInspectLongPathIdHonesty(pathId))) {
    return null;
  }

  return PATH_INSPECT_LONG_PATH_ID_OVERFLOW_LINE;
}
export const PATH_INSPECT_LONG_PATH_ID_OVERFLOW_LINE =
  "Long path ids may wrap in this panel. Use copy on the full id row or open the ranked paths table for navigation." as const;

export function shouldShowPathInspectLongPathIdHonesty(pathId: string | null | undefined): boolean {
  return (pathId?.trim().length ?? 0) > 48;
}
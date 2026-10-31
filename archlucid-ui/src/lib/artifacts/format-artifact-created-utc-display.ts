export const ARTIFACT_CREATED_DATE_WAS_NOT_STORED = "Artifact date was not stored." as const;

export const ARTIFACT_CREATED_DATE_STORED_EMPTY = "Artifact date was stored empty." as const;

export const ARTIFACT_CREATED_DATE_NOT_READABLE = "Artifact date was not readable." as const;

export function formatArtifactCreatedUtcForDisplay(createdUtc: string | null | undefined): string {
  if (createdUtc === null || createdUtc === undefined) {
    return ARTIFACT_CREATED_DATE_WAS_NOT_STORED;
  }

  if (createdUtc.trim().length === 0) {
    return ARTIFACT_CREATED_DATE_STORED_EMPTY;
  }

  try {
    const formatted = new Date(createdUtc).toLocaleString();

    if (formatted === "Invalid Date") {
      return ARTIFACT_CREATED_DATE_NOT_READABLE;
    }

    return formatted;
  } catch {
    return ARTIFACT_CREATED_DATE_NOT_READABLE;
  }
}

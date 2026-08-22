const READABLE_EVIDENCE_TEXT_EXTENSIONS = [".md", ".txt", ".json", ".yaml", ".yml"] as const;

const BINARY_ARCHITECTURE_DOCUMENT_EXTENSIONS = [".pdf", ".docx", ".doc"] as const;

export const ARCHITECTURE_DOCUMENT_READ_AFTER_UPLOAD_HELPER =
  "PDF and DOCX files are read after upload to suggest clarification answers. Attach your architecture document now — you can still answer clarifications below.";

export function isReadableEvidenceTextFileName(fileName: string): boolean {
  const lower = fileName.toLowerCase();

  return READABLE_EVIDENCE_TEXT_EXTENSIONS.some((extension) => lower.endsWith(extension));
}

export function isBinaryArchitectureDocumentFileName(fileName: string): boolean {
  const lower = fileName.toLowerCase();

  return BINARY_ARCHITECTURE_DOCUMENT_EXTENSIONS.some((extension) => lower.endsWith(extension));
}

export function evidenceFilesIncludeBinaryArchitectureDocument(files: readonly File[]): boolean {
  return files.some((file) => isBinaryArchitectureDocumentFileName(file.name));
}

/** Builds a single searchable corpus from the brief and any text-readable evidence attachments. */
export async function buildArchitectureIntakeInferenceCorpus(input: {
  readonly briefText: string;
  readonly evidenceFiles: readonly File[];
}): Promise<string> {
  const parts: string[] = [];
  const trimmedBrief = input.briefText.trim();

  if (trimmedBrief.length > 0) {
    parts.push(trimmedBrief);
  }

  for (const file of input.evidenceFiles) {
    if (isReadableEvidenceTextFileName(file.name)) {
      try {
        const text = await file.text();
        const trimmed = text.trim();

        if (trimmed.length > 0) {
          parts.push(trimmed);
        }
      } catch {
        // Ignore unreadable attachments — filename tokens are still added below.
      }
    }

    const fileNameTokens = file.name.replace(/[._-]+/g, " ").trim();

    if (fileNameTokens.length > 0) {
      parts.push(fileNameTokens);
    }
  }

  return parts.join("\n\n");
}

const READABLE_EVIDENCE_TEXT_EXTENSIONS = [".md", ".txt", ".json", ".yaml", ".yml"] as const;

const BINARY_ARCHITECTURE_DOCUMENT_EXTENSIONS = [".pdf", ".docx"] as const;

export const ARCHITECTURE_DOCUMENT_READ_AFTER_UPLOAD_HELPER =
  "We extract text from attached PDF and DOCX files to suggest clarification answers. Large documents may take a moment.";

export const ARCHITECTURE_DOCUMENT_TEXT_EXTRACTION_IN_PROGRESS_HELPER =
  "Extracting text from your document…";

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

async function readBinaryDocumentText(file: File): Promise<string | null> {
  const { extractEvidenceDocumentText } = await import("@/lib/extract-evidence-document-text");
  const result = await extractEvidenceDocumentText(file);

  if (!result.ok) {
    return null;
  }

  return result.text;
}

/** Builds a single searchable corpus from the brief, readable files, and API-extracted PDF/DOCX text. */
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
    else if (isBinaryArchitectureDocumentFileName(file.name)) {
      const extractedText = await readBinaryDocumentText(file);
      const trimmed = extractedText?.trim() ?? "";

      if (trimmed.length > 0) {
        parts.push(trimmed);
      }
    }

    const fileNameTokens = file.name.replace(/[._-]+/g, " ").trim();

    if (fileNameTokens.length > 0) {
      parts.push(fileNameTokens);
    }
  }

  return parts.join("\n\n");
}

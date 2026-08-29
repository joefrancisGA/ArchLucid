import type { EvidenceExtractionStageId } from "@/lib/evidence/evidence-extraction-progress-stages";
import { normalizeClarificationInferenceCorpus } from "@/lib/inferred-clarification-answer-quality";

const READABLE_EVIDENCE_TEXT_EXTENSIONS = [".md", ".txt", ".json", ".yaml", ".yml"] as const;

const BINARY_ARCHITECTURE_DOCUMENT_EXTENSIONS = [".pdf", ".docx"] as const;

/** Per-File cache so brief-text re-inference does not re-post the same PDF/DOCX to the extraction API. */
const binaryDocumentTextCache = new WeakMap<File, string | null>();

export const ARCHITECTURE_DOCUMENT_READ_AFTER_UPLOAD_HELPER =
  "We extract text from attached PDF and DOCX files to suggest clarification answers. Large documents may take a moment.";

export type ArchitectureIntakeInferenceCorpusObserver = {
  readonly onStage?: (stageId: EvidenceExtractionStageId) => void;
  readonly onDocumentTextExtracted?: (input: { readonly fileName: string; readonly characterCount: number }) => void;
};

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

/** True when at least one PDF/DOCX attachment still needs a server-side text extraction round trip. */
export function evidenceFilesNeedDocumentTextExtraction(files: readonly File[]): boolean {
  return files.some(
    (file) => isBinaryArchitectureDocumentFileName(file.name) && !binaryDocumentTextCache.has(file),
  );
}

async function readBinaryDocumentText(file: File): Promise<string | null> {
  if (binaryDocumentTextCache.has(file)) {
    return binaryDocumentTextCache.get(file) ?? null;
  }

  const { extractEvidenceDocumentText } = await import("@/lib/extract-evidence-document-text");
  const result = await extractEvidenceDocumentText(file);
  const text = result.ok ? result.text : null;

  binaryDocumentTextCache.set(file, text);

  return text;
}

/** Builds a single searchable corpus from the brief, readable files, and API-extracted PDF/DOCX text. */
export async function buildArchitectureIntakeInferenceCorpus(
  input: {
    readonly briefText: string;
    readonly evidenceFiles: readonly File[];
  },
  observer?: ArchitectureIntakeInferenceCorpusObserver,
): Promise<string> {
  const parts: string[] = [];
  const trimmedBrief = input.briefText.trim();

  if (trimmedBrief.length > 0) {
    parts.push(trimmedBrief);
  }

  observer?.onStage?.("reading-evidence");

  let reportedExtractionStage = false;

  for (const file of input.evidenceFiles) {
    if (isReadableEvidenceTextFileName(file.name)) {
      try {
        const text = await file.text();
        const trimmed = text.trim();

        if (trimmed.length > 0) {
          parts.push(trimmed);
          observer?.onDocumentTextExtracted?.({
            fileName: file.name,
            characterCount: trimmed.length,
          });
        }
      }
      catch {
        // Ignore unreadable attachments — filename tokens are still added below.
      }
    }
    else if (isBinaryArchitectureDocumentFileName(file.name)) {
      if (!reportedExtractionStage) {
        observer?.onStage?.("extracting-document-text");
        reportedExtractionStage = true;
      }

      const extractedText = await readBinaryDocumentText(file);
      const trimmed = extractedText?.trim() ?? "";

      if (trimmed.length > 0) {
        parts.push(trimmed);
        observer?.onDocumentTextExtracted?.({
          fileName: file.name,
          characterCount: trimmed.length,
        });
      }
    }

    const fileNameTokens = file.name.replace(/[._-]+/g, " ").trim();

    if (fileNameTokens.length > 0) {
      parts.push(fileNameTokens);
    }
  }

  return normalizeClarificationInferenceCorpus(parts.join("\n\n"));
}

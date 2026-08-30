import type { CreateArchitectureRunDocumentPayload } from "@/lib/api/architecture-runs-mutate";
import {
  isBinaryArchitectureDocumentFileName,
  isReadableEvidenceTextFileName,
  peekBinaryArchitectureDocumentText,
} from "@/lib/evidence-readable-text";
import { extractEvidenceDocumentText } from "@/lib/extract-evidence-document-text";

/** Mirrors API `ContextDocumentRequest` content max (500_000). Extraction already caps PDF/DOCX at 100_000. */
const INTAKE_CONTEXT_DOCUMENT_MAX_CHARS = 500_000;

const INTAKE_CONTEXT_DOCUMENT_NAME_MAX_CHARS = 500;

/**
 * Turns intake attachments into inline context documents the authority pipeline can parse.
 *
 * Context ingestion only accepts text/plain and text/markdown. PDF/DOCX bytes are not parseable
 * there, so this sends the extracted text under the original file name.
 */
export async function buildIntakeContextDocumentsFromEvidenceFiles(
  files: readonly File[],
): Promise<CreateArchitectureRunDocumentPayload[]> {
  const documents: CreateArchitectureRunDocumentPayload[] = [];

  for (const file of files) {
    const document = await toIntakeContextDocument(file);

    if (document !== null) {
      documents.push(document);
    }
  }

  return documents;
}

async function toIntakeContextDocument(file: File): Promise<CreateArchitectureRunDocumentPayload | null> {
  const name = file.name.trim().slice(0, INTAKE_CONTEXT_DOCUMENT_NAME_MAX_CHARS);

  if (name.length === 0) {
    return null;
  }

  if (isReadableEvidenceTextFileName(file.name)) {
    return readReadableTextDocument(name, file);
  }

  if (isBinaryArchitectureDocumentFileName(file.name)) {
    return readExtractedBinaryDocument(name, file);
  }

  return null;
}

async function readReadableTextDocument(
  name: string,
  file: File,
): Promise<CreateArchitectureRunDocumentPayload | null> {
  try {
    const text = (await file.text()).trim();

    if (text.length === 0) {
      return null;
    }

    return {
      name,
      contentType: file.name.toLowerCase().endsWith(".md") ? "text/markdown" : "text/plain",
      content: text.slice(0, INTAKE_CONTEXT_DOCUMENT_MAX_CHARS),
    };
  } catch {
    return null;
  }
}

async function readExtractedBinaryDocument(
  name: string,
  file: File,
): Promise<CreateArchitectureRunDocumentPayload | null> {
  const cached = peekBinaryArchitectureDocumentText(file);
  const cachedText = cached?.trim() ?? "";

  if (cached !== undefined) {
    if (cachedText.length === 0) {
      return null;
    }

    return {
      name,
      contentType: "text/plain",
      content: cachedText.slice(0, INTAKE_CONTEXT_DOCUMENT_MAX_CHARS),
    };
  }

  try {
    const result = await extractEvidenceDocumentText(file);

    if (!result.ok) {
      return null;
    }

    const text = result.text.trim();

    if (text.length === 0) {
      return null;
    }

    return {
      name,
      contentType: "text/plain",
      content: text.slice(0, INTAKE_CONTEXT_DOCUMENT_MAX_CHARS),
    };
  } catch {
    return null;
  }
}

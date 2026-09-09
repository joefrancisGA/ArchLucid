import type { CreateArchitectureRunDocumentPayload } from "@/lib/api/architecture-runs-mutate";
import {
  buildIntakePixelDiagramContextDocument,
  isPixelDiagramIntakeFileName,
} from "@/lib/architecture-spine/intake-pixel-diagram-context-document";
import {
  isMermaidIntakeFileName,
  looksLikeMermaidSource,
  MERMAID_CONTEXT_DOCUMENT_CONTENT_TYPE,
} from "@/lib/architecture-spine/intake-mermaid-context-document";
import {
  isSvgIntakeFileName,
  STRUCTURED_DIAGRAM_SVG_CONTEXT_CONTENT_TYPE,
} from "@/lib/architecture-spine/intake-svg-context-document";
import {
  isDrawIoIntakeFileName,
  DRAW_IO_CONTEXT_DOCUMENT_CONTENT_TYPE,
} from "@/lib/architecture-spine/intake-drawio-context-document";
import {
  isArchLucidDiagramJsonIntakeFileName,
  looksLikeArchLucidDiagramJson,
  STRUCTURED_DIAGRAM_CONTEXT_CONTENT_TYPE,
} from "@/lib/architecture-spine/intake-archlucid-diagram-json-context-document";
import {
  isBinaryArchitectureDocumentFileName,
  isReadableEvidenceTextFileName,
  peekBinaryArchitectureDocumentText,
} from "@/lib/evidence-readable-text";
import { extractEvidenceDocumentText } from "@/lib/extract-evidence-document-text";

/** Mirrors API `ContextDocumentRequest` content max (500_000). Extraction already caps PDF/DOCX at 100_000. */
const INTAKE_CONTEXT_DOCUMENT_MAX_CHARS = 500_000;

const INTAKE_CONTEXT_DOCUMENT_NAME_MAX_CHARS = 500;

export type BuildIntakeContextDocumentsOptions = {
  /** ESI catalog ids keyed by trimmed attachment file name (AS-014 binds after upload). */
  readonly storedEvidenceIdsByFileName?: Readonly<Record<string, string>>;
};

/**
 * Turns intake attachments into inline context documents the authority pipeline can parse.
 *
 * Readable text and PDF/DOCX extract bridge to text/plain or text/markdown. Pixel diagrams emit
 * structured diagram JSON stubs (ExtractionMethod=None, NotVerifiable) — never raster bytes.
 */
export async function buildIntakeContextDocumentsFromEvidenceFiles(
  files: readonly File[],
  options?: BuildIntakeContextDocumentsOptions,
): Promise<CreateArchitectureRunDocumentPayload[]> {
  const documents = await Promise.all(
    files.map((file) => toIntakeContextDocument(file, options)),
  );

  return documents.filter(
    (document): document is CreateArchitectureRunDocumentPayload => document !== null,
  );
}

async function toIntakeContextDocument(
  file: File,
  options?: BuildIntakeContextDocumentsOptions,
): Promise<CreateArchitectureRunDocumentPayload | null> {
  const trimmedName = file.name.trim();
  const name = trimmedName.slice(0, INTAKE_CONTEXT_DOCUMENT_NAME_MAX_CHARS);

  if (name.length === 0) {
    return null;
  }

  if (isReadableEvidenceTextFileName(trimmedName)) {
    return readReadableTextDocument(name, trimmedName, file);
  }

  if (isBinaryArchitectureDocumentFileName(trimmedName)) {
    return readExtractedBinaryDocument(name, file);
  }

  if (isPixelDiagramIntakeFileName(trimmedName)) {
    return readPixelDiagramDocument(name, trimmedName, file, options);
  }

  if (isMermaidIntakeFileName(trimmedName)) {
    return readMermaidDocument(name, file);
  }

  if (isSvgIntakeFileName(trimmedName)) {
    return readSvgDocument(name, file);
  }

  if (isDrawIoIntakeFileName(trimmedName)) {
    return readDrawIoDocument(name, file);
  }

  if (isArchLucidDiagramJsonIntakeFileName(trimmedName)) {
    return readArchLucidDiagramJsonDocument(name, file);
  }

  return null;
}

function readMermaidDocument(
  name: string,
  file: File,
): Promise<CreateArchitectureRunDocumentPayload | null> {
  return readMermaidSourceDocument(name, file);
}

async function readMermaidSourceDocument(
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
      contentType: MERMAID_CONTEXT_DOCUMENT_CONTENT_TYPE,
      content: text.slice(0, INTAKE_CONTEXT_DOCUMENT_MAX_CHARS),
    };
  } catch {
    return null;
  }
}

function readSvgDocument(
  name: string,
  file: File,
): Promise<CreateArchitectureRunDocumentPayload | null> {
  return readSvgSourceDocument(name, file);
}

async function readSvgSourceDocument(
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
      contentType: STRUCTURED_DIAGRAM_SVG_CONTEXT_CONTENT_TYPE,
      content: text.slice(0, INTAKE_CONTEXT_DOCUMENT_MAX_CHARS),
    };
  } catch {
    return null;
  }
}

function readDrawIoDocument(
  name: string,
  file: File,
): Promise<CreateArchitectureRunDocumentPayload | null> {
  return readDrawIoSourceDocument(name, file);
}

async function readDrawIoSourceDocument(
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
      contentType: DRAW_IO_CONTEXT_DOCUMENT_CONTENT_TYPE,
      content: text.slice(0, INTAKE_CONTEXT_DOCUMENT_MAX_CHARS),
    };
  } catch {
    return null;
  }
}

function readArchLucidDiagramJsonDocument(
  name: string,
  file: File,
): Promise<CreateArchitectureRunDocumentPayload | null> {
  return readArchLucidDiagramJsonSourceDocument(name, file);
}

async function readArchLucidDiagramJsonSourceDocument(
  name: string,
  file: File,
): Promise<CreateArchitectureRunDocumentPayload | null> {
  try {
    const text = (await file.text()).trim();

    if (!looksLikeArchLucidDiagramJson(text)) {
      return null;
    }

    return {
      name,
      contentType: STRUCTURED_DIAGRAM_CONTEXT_CONTENT_TYPE,
      content: text.slice(0, INTAKE_CONTEXT_DOCUMENT_MAX_CHARS),
    };
  } catch {
    return null;
  }
}

function readPixelDiagramDocument(
  name: string,
  trimmedName: string,
  file: File,
  options?: BuildIntakeContextDocumentsOptions,
): CreateArchitectureRunDocumentPayload | null {
  if (file.size <= 0) {
    return null;
  }

  const evidenceItemId = options?.storedEvidenceIdsByFileName?.[trimmedName] ?? null;

  return buildIntakePixelDiagramContextDocument(name, file, { evidenceItemId });
}

async function readReadableTextDocument(
  name: string,
  trimmedName: string,
  file: File,
): Promise<CreateArchitectureRunDocumentPayload | null> {
  try {
    const text = (await file.text()).trim();

    if (text.length === 0) {
      return null;
    }

    if (!trimmedName.toLowerCase().endsWith(".md") && looksLikeMermaidSource(text)) {
      return {
        name,
        contentType: MERMAID_CONTEXT_DOCUMENT_CONTENT_TYPE,
        content: text.slice(0, INTAKE_CONTEXT_DOCUMENT_MAX_CHARS),
      };
    }

    if (looksLikeArchLucidDiagramJson(text)) {
      return {
        name,
        contentType: STRUCTURED_DIAGRAM_CONTEXT_CONTENT_TYPE,
        content: text.slice(0, INTAKE_CONTEXT_DOCUMENT_MAX_CHARS),
      };
    }

    return {
      name,
      contentType: trimmedName.toLowerCase().endsWith(".md") ? "text/markdown" : "text/plain",
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

  if (cached !== undefined) {
    const cachedText = cached?.trim() ?? "";

    if (cachedText.length > 0) {
      return {
        name,
        contentType: "text/plain",
        content: cachedText.slice(0, INTAKE_CONTEXT_DOCUMENT_MAX_CHARS),
      };
    }
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

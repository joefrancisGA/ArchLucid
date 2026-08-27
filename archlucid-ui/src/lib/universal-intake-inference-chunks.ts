/** Splits corpus into inference chunks on sentence boundaries and newlines. */
export function splitInferenceChunks(corpus: string): readonly string[] {
  const chunks: string[] = [];

  for (const line of corpus.split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (trimmedLine.length === 0) {
      continue;
    }

    const sentences = trimmedLine
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length > 0);

    if (sentences.length === 0) {
      continue;
    }

    for (const sentence of sentences) {
      chunks.push(sentence);
    }
  }

  return chunks;
}

export function truncateAtWordBoundary(text: string, maxLength = 320): string {
  if (text.length <= maxLength) {
    return text;
  }

  const slice = text.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(" ");

  if (lastSpace > maxLength * 0.6) {
    return slice.slice(0, lastSpace).trimEnd();
  }

  return slice.slice(0, maxLength).trimEnd();
}

export function isHeadingOnlyChunk(chunk: string): boolean {
  const trimmed = chunk.trim();

  if (trimmed.length === 0) {
    return true;
  }

  if (/^#+\s/.test(trimmed)) {
    return true;
  }

  if (/^\d+\.\s+[A-Z]/.test(trimmed)) {
    return true;
  }

  if (/^FinOps and capacity drivers$/i.test(trimmed)) {
    return true;
  }

  if (/^Diagram\s*[—\-]/i.test(trimmed)) {
    return true;
  }

  return false;
}

export const ARCHITECTURE_NARRATIVE_PREVIEW_WORD_LIMIT = 200;

const WORD_SPLIT_PATTERN = /\s+/;

export function countWords(text: string): number {
  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return 0;
  }

  return trimmed.split(WORD_SPLIT_PATTERN).filter((word) => word.length > 0).length;
}

export function truncateToWordLimit(text: string, wordLimit: number): { readonly preview: string; readonly truncated: boolean } {
  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return { preview: "", truncated: false };
  }

  const words = trimmed.split(WORD_SPLIT_PATTERN).filter((word) => word.length > 0);

  if (words.length <= wordLimit) {
    return { preview: trimmed, truncated: false };
  }

  return {
    preview: `${words.slice(0, wordLimit).join(" ")}…`,
    truncated: true,
  };
}

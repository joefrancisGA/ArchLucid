const SECURENOW_CONNECTING_WORDS = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "by",
  "for",
  "in",
  "of",
  "on",
  "or",
  "the",
  "to",
  "via",
  "with",
]);

function capitalizeWord(word: string): string {
  if (word.length === 0) {
    return word;
  }

  return `${word[0].toUpperCase()}${word.slice(1)}`;
}

export function secureNowTitleCase(value: string): string {
  return value
    .split(" ")
    .map((word, index) => {
      const normalizedWord = word.toLocaleLowerCase();

      if (index > 0 && SECURENOW_CONNECTING_WORDS.has(normalizedWord)) {
        return normalizedWord;
      }

      return capitalizeWord(word);
    })
    .join(" ");
}

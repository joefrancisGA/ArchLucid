/**
 * Repairs UTF-8 punctuation that was decoded as Windows-1252 mojibake (for example em dash stored as `â€"`).
 * Mirrors `ArchLucid.Application.Bootstrap.Utf8MojibakeRepair`.
 */
export function repairUtf8MojibakeOptional(value: string): string {
  if (value.length === 0) {
    return value;
  }

  if (!value.includes("â")) {
    return value;
  }

  let repaired = "";
  let index = 0;

  while (index < value.length) {
    const consumed = tryConsumeMojibake(value, index);

    if (consumed !== null) {
      repaired += consumed.replacement;
      index += consumed.length;

      continue;
    }

    repaired += value[index] ?? "";
    index += 1;
  }

  return repaired;
}

function tryConsumeMojibake(
  value: string,
  index: number,
): { readonly replacement: string; readonly length: number } | null {
  if (index + 2 >= value.length || value[index] !== "â") {
    return null;
  }

  if (value[index + 1] === "€") {
    const third = value[index + 2];

    if (third === "\u201C" || third === "\u0093") {
      return { replacement: "–", length: 3 };
    }

    if (third === "\u201D" || third === "\u0094") {
      return { replacement: "—", length: 3 };
    }
  }

  if (value[index + 1] === "†" && index + 2 < value.length) {
    const third = value[index + 2];

    if (third === "'" || third === "\u2019") {
      return { replacement: "→", length: 3 };
    }
  }

  return null;
}

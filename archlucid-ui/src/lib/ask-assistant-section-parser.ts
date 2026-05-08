export type AskAssistantSectionKey = "risk" | "evidence" | "mitigation" | "validation";

export type AskAssistantSection = {
  readonly key: AskAssistantSectionKey;
  /** Display label, e.g. "Risk". */
  readonly title: string;
  readonly body: string;
};

const SECTION_KEY_BY_WORD: Readonly<Record<string, AskAssistantSectionKey>> = {
  risk: "risk",
  evidence: "evidence",
  mitigation: "mitigation",
  validation: "validation",
};

/** Line is only a section header (optional markdown heading / bold). */
const SECTION_HEADER_LINE_RE =
  /^(?:#{1,3}\s+)?(?:\*\*)?\s*(Risk|Evidence|Mitigation|Validation)(?:\*\*)?\s*[:：]?\s*$/i;

function toTitleCase(word: string): string {
  const t = word.trim();

  if (t.length === 0) {
    return t;
  }

  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

/**
 * Parses optional executive-oriented blocks introduced by Risk:/Evidence:/Mitigation:/Validation: headers.
 * Returns null when no such headers are found (caller should render the string as a single body).
 */
export function parseAskAssistantStructuredSections(content: string): {
  readonly preamble: string;
  readonly sections: AskAssistantSection[];
} | null {
  const normalized = content.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");

  type Hit = { readonly lineIndex: number; readonly key: AskAssistantSectionKey; readonly title: string };
  const hits: Hit[] = [];

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(SECTION_HEADER_LINE_RE);

    if (m === null) {
      continue;
    }

    const word = m[1].trim();
    const key = SECTION_KEY_BY_WORD[word.toLowerCase()];

    if (key === undefined) {
      continue;
    }

    hits.push({ lineIndex: i, key, title: toTitleCase(word) });
  }

  if (hits.length === 0) {
    return null;
  }

  const preamble = lines.slice(0, hits[0].lineIndex).join("\n").trim();
  const sections: AskAssistantSection[] = [];

  for (let h = 0; h < hits.length; h++) {
    let bodyStart = hits[h].lineIndex + 1;

    while (bodyStart < lines.length && lines[bodyStart].trim() === "") {
      bodyStart++;
    }

    const endLine = h + 1 < hits.length ? hits[h + 1].lineIndex : lines.length;
    const body = lines.slice(bodyStart, endLine).join("\n").trim();

    sections.push({
      key: hits[h].key,
      title: hits[h].title,
      body,
    });
  }

  return { preamble, sections };
}

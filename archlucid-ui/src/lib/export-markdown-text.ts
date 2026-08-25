export function isRecord(data: unknown): data is Record<string, unknown> {
  return typeof data === "object" && data !== null && !Array.isArray(data);
}

export function normalizeInlineText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const t = value.replace(/\s+/g, " ").trim();

  if (t.length === 0) {
    return null;
  }

  return t;
}

export function pushBulletLines(target: string[], items: unknown, labelForEmpty?: string): void {
  if (!Array.isArray(items) || items.length === 0) {
    if (labelForEmpty) {
      target.push(`- ${labelForEmpty}`);
    }

    return;
  }

  for (const item of items) {
    const line = normalizeInlineText(item);

    if (line) {
      target.push(`- ${line}`);
    }
  }
}

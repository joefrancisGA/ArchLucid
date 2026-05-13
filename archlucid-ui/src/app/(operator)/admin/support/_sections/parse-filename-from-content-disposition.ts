export function parseFilenameFromContentDisposition(header: string): string | null {
  if (header.length === 0) return null;

  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(header);

  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim());
    } catch {
      // fall through to plain filename match
    }
  }

  const plainMatch = /filename="?([^";]+)"?/i.exec(header);

  return plainMatch?.[1]?.trim() ?? null;
}

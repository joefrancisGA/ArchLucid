import { sha256Hex } from "@/lib/cto-demo-audit-integrity-chain";

export async function formatExtractorScriptSha256Digest(scriptText: string): Promise<string | null> {
  const trimmed = scriptText.trim();

  if (trimmed.length === 0) {
    return null;
  }

  return sha256Hex(trimmed);
}

export function truncateExtractorScriptSha256Digest(digest: string): string {
  const trimmed = digest.trim();

  if (trimmed.length <= 16) {
    return trimmed;
  }

  return `${trimmed.slice(0, 12)}…${trimmed.slice(-8)}`;
}

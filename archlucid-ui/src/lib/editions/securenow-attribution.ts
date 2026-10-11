import type { SecureNowEditionId } from "@/lib/product-line/securenow-edition-id";

export function resolveSecureNowAttribution(edition: SecureNowEditionId): string | null {
  if (edition === "generic") {
    return "Powered by ArchLucid";
  }

  return null;
}

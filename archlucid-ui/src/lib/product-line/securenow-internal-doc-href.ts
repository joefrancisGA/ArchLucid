import { resolveInAppDocHref } from "@/lib/in-app-doc-href";

/** Resolve SecureNow internal markdown under `docs/securenow/` to an in-app operator href. */
export function securenowInternalDocHref(fileName: string): string {
  const normalized = fileName.trim().replace(/^\/+/, "");

  return resolveInAppDocHref(`docs/securenow/${normalized}`);
}

import type { HelpDocSearchRecord } from "@/lib/help/help-index";
import { resolveInAppDocHref } from "@/lib/in-app-doc-href";

export function helpSlugFromHref(href: string): string | null {
  const match = /^\/help\/([^#?]+)/.exec(href);

  return match?.[1] ?? null;
}

export function helpRecordHref(record: HelpDocSearchRecord): string {
  const path = record.docPath.startsWith("/") ? record.docPath : `/${record.docPath}`;
  const hash = record.sectionSlug.length > 0 ? `#${record.sectionSlug}` : "";

  return resolveInAppDocHref(`${path}${hash}`);
}

export function helpRecordSelectionValue(record: HelpDocSearchRecord): string {
  return `${record.docPath}::${record.sectionSlug || "root"}::${record.sectionHeading}`;
}

export function stripMdLinks(text: string): string {
  return text.replace(/\[([^\]]+)\]\(([^)]*)\)/g, "$1");
}

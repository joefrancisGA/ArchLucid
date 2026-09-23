"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { EXTRACT_UPLOAD_SETTINGS_BREADCRUMB_TOPIC_TITLE } from "@/lib/extract-upload-settings-page-copy";
import { extractUploadSettingsBreadcrumbParent } from "@/lib/extract-upload-settings-route";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Administration or Infrastructure trail for the Extract & Upload workspace (INX). */
export function ExtractUploadSettingsBreadcrumb(): React.JSX.Element {
  const pathname = usePathname();
  const { href: parentHref, label: parentLabel } = extractUploadSettingsBreadcrumbParent(pathname);

  return (
    <nav aria-label="Breadcrumb" data-testid="extract-upload-page-breadcrumb">
      <ol className={cn("m-0 flex flex-wrap items-center gap-1 p-0 list-none", OPERATOR_TYPOGRAPHY.helper)}>
        <li>
          <Link href={parentHref} className={cn("text-al-link hover:underline", OPERATOR_LINK.inline)}>
            {parentLabel}
          </Link>
        </li>
        <li aria-hidden className="text-al-text-secondary">/</li>
        <li className="text-al-text-secondary" aria-current="page">
          {EXTRACT_UPLOAD_SETTINGS_BREADCRUMB_TOPIC_TITLE}
        </li>
      </ol>
    </nav>
  );
}

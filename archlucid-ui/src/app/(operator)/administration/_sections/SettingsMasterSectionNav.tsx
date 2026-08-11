"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { settingsMasterSectionDomId } from "./settings-master-catalog";
import type { SettingsMasterVisibleSection } from "./settings-master-page-model";

type SettingsMasterSectionNavProps = {
  readonly sections: readonly SettingsMasterVisibleSection[];
};

export function SettingsMasterSectionNav(props: SettingsMasterSectionNavProps) {
  return (
    <nav
      aria-label="Settings sections"
      className="lg:sticky lg:top-24 lg:self-start"
      data-testid="settings-master-section-nav"
    >
      <p className={cn("m-0 mb-2 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>Sections</p>
      <ul className="m-0 flex list-none flex-row gap-2 overflow-x-auto p-0 lg:flex-col lg:overflow-visible">
        {props.sections.map((section) => (
          <li key={section.id} className="shrink-0">
            <Link
              href={`#${settingsMasterSectionDomId(section.id)}`}
              className={cn(
                OPERATOR_LINK.nav,
                "block w-full rounded-md border border-transparent px-3 py-2 text-left transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800",
                OPERATOR_TYPOGRAPHY.body,
              )}
            >
              {section.navLabel}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

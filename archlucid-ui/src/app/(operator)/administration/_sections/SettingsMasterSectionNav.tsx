"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { settingsMasterSectionDomId } from "./settings-master-catalog";
import type { SettingsMasterVisibleSection } from "./settings-master-page-model";

type SettingsMasterSectionNavProps = {
  readonly sections: readonly SettingsMasterVisibleSection[];
};

function scrollToSection(sectionId: string): void {
  const target = document.getElementById(settingsMasterSectionDomId(sectionId));

  if (target !== null) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

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
            <button
              type="button"
              className={cn(
                "w-full rounded-md border border-transparent px-3 py-2 text-left transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800",
                OPERATOR_TYPOGRAPHY.body,
              )}
              onClick={() => scrollToSection(section.id)}
            >
              {section.navLabel}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

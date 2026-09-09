"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { tenantSettingsQualityAdvancedHrefFromSearch } from "@/lib/administration/tenant-settings-quality-advanced-url";
import { SETTINGS_WORKSPACE_SETTINGS_PATH } from "@/lib/settings-admin-route-paths";
import { scheduleScrollToReviewDetailSection } from "@/lib/review-detail-section-scroll";

export type TenantSettingsSectionNavItem = {
  readonly id: string;
  readonly label: string;
};

const TENANT_SETTINGS_SECTION_NAV_ITEMS: readonly TenantSettingsSectionNavItem[] = [
  { id: "tenant-settings-section-general", label: "General" },
  { id: "tenant-settings-section-business", label: "Business settings" },
  { id: "tenant-settings-section-support", label: "Support & diagnostics" },
  { id: "tenant-settings-section-governance", label: "Governance" },
  { id: "tenant-settings-section-advanced", label: "Advanced" },
];

const TENANT_SETTINGS_ADVANCED_SECTION_ID = "tenant-settings-section-advanced";

type TenantSettingsSectionNavProps = {
  readonly className?: string;
};

function writeTenantSettingsSectionHash(sectionId: string): void {
  if (typeof window === "undefined" || sectionId.trim().length === 0) {
    return;
  }

  const nextHash = `#${sectionId}`;

  if (window.location.hash === nextHash) {
    return;
  }

  window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}${nextHash}`);
}

export function TenantSettingsSectionNav(props: TenantSettingsSectionNavProps): React.JSX.Element {
  const pathname = usePathname() ?? SETTINGS_WORKSPACE_SETTINGS_PATH;
  const searchParams = useSearchParams();
  const [activeId, setActiveId] = useState<string>(TENANT_SETTINGS_SECTION_NAV_ITEMS[0]?.id ?? "");

  const syncActiveSectionToHash = useCallback((sectionId: string) => {
    setActiveId(sectionId);
    writeTenantSettingsSectionHash(sectionId);
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      return;
    }

    const sections = TENANT_SETTINGS_SECTION_NAV_ITEMS
      .map((item) => document.getElementById(item.id))
      .filter((node): node is HTMLElement => node !== null);

    if (sections.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length > 0) {
          const sectionId = visible[0]!.target.id;

          if (sectionId.length > 0) {
            syncActiveSectionToHash(sectionId);
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5, 1] },
    );

    for (const section of sections) {
      observer.observe(section);
    }

    return () => {
      observer.disconnect();
    };
  }, [syncActiveSectionToHash]);

  useEffect(() => {
    const hashSectionId = window.location.hash.replace(/^#/, "").trim();

    if (hashSectionId.length === 0) {
      return;
    }

    const matched = TENANT_SETTINGS_SECTION_NAV_ITEMS.find((item) => item.id === hashSectionId);

    if (matched === undefined) {
      return;
    }

    setActiveId(matched.id);
    scheduleScrollToReviewDetailSection(matched.id);
  }, []);

  return (
    <nav
      aria-label="Workspace settings sections"
      className={cn("space-y-1", props.className)}
      data-testid="tenant-settings-section-nav"
    >
      <p className={cn("m-0 px-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>On this page</p>
      <ul className="m-0 list-none space-y-0.5 p-0">
        {TENANT_SETTINGS_SECTION_NAV_ITEMS.map((item) => {
          const isActive = item.id === activeId;
          const isAdvanced = item.id === TENANT_SETTINGS_ADVANCED_SECTION_ID;
          const href = isAdvanced
            ? tenantSettingsQualityAdvancedHrefFromSearch(searchParams.toString(), true, pathname)
            : `#${item.id}`;

          return (
            <li key={item.id}>
              {isAdvanced ? (
                <Link
                  href={href}
                  className={cn(
                    "block rounded-md px-2 py-1 text-al-link underline-offset-2 hover:underline",
                    isActive ? "font-medium text-al-text-primary no-underline" : undefined,
                    OPERATOR_TYPOGRAPHY.helper,
                  )}
                  aria-current={isActive ? "page" : undefined}
                  data-testid={`tenant-settings-section-nav-${item.id}`}
                  onClick={() => {
                    syncActiveSectionToHash(item.id);
                  }}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  href={href}
                  className={cn(
                    "block rounded-md px-2 py-1 text-al-link underline-offset-2 hover:underline",
                    isActive ? "font-medium text-al-text-primary no-underline" : undefined,
                    OPERATOR_TYPOGRAPHY.helper,
                  )}
                  aria-current={isActive ? "page" : undefined}
                  data-testid={`tenant-settings-section-nav-${item.id}`}
                  onClick={(event) => {
                    event.preventDefault();
                    scheduleScrollToReviewDetailSection(item.id);
                    syncActiveSectionToHash(item.id);
                  }}
                >
                  {item.label}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export { TENANT_SETTINGS_SECTION_NAV_ITEMS };

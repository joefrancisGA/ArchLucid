"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { NAV_GROUPS } from "@/lib/nav-config";
import { isNavLinkActive } from "@/lib/nav-link-active";
import { registryKeyToAriaKeyShortcuts } from "@/lib/shortcut-registry";
import { cn } from "@/lib/utils";

const STORAGE_PREFIX = "archlucid_sidebar_group_";

/** Alerts & governance is collapsed by default until the user explicitly opens it (localStorage "1"). */
function readGroupOpenFromStorage(groupId: string, raw: string | null): boolean {
  if (groupId === "alerts-governance") {
    return raw === "1";
  }

  return raw !== "0";
}

/**
 * Collapsible grouped sidebar navigation (desktop). Group open state persists in localStorage.
 */
export function SidebarNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [openByGroup, setOpenByGroup] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const next: Record<string, boolean> = {};

    for (const group of NAV_GROUPS) {
      try {
        if (typeof window !== "undefined") {
          const raw = window.localStorage.getItem(STORAGE_PREFIX + group.id);
          next[group.id] = readGroupOpenFromStorage(group.id, raw);
        } else {
          next[group.id] = group.id !== "alerts-governance";
        }
      } catch {
        next[group.id] = group.id !== "alerts-governance";
      }
    }

    setOpenByGroup(next);
    setMounted(true);
  }, []);

  function setGroupOpen(groupId: string, value: boolean): void {
    setOpenByGroup((prev) => ({ ...prev, [groupId]: value }));

    try {
      window.localStorage.setItem(STORAGE_PREFIX + groupId, value ? "1" : "0");
    } catch {
      /* private mode */
    }
  }

  return (
    <div className="flex h-full flex-col gap-1 pb-6 pr-1">
      {NAV_GROUPS.map((group) => {
        const isOpen = !mounted || openByGroup[group.id] !== false;

        return (
          <Collapsible
            key={group.id}
            open={isOpen}
            onOpenChange={(next) => {
              setGroupOpen(group.id, next);
            }}
          >
            <CollapsibleTrigger
              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              type="button"
            >
              <span>{group.label}</span>
              <ChevronDown
                className={cn("h-4 w-4 shrink-0 transition-transform", isOpen ? "rotate-0" : "-rotate-90")}
                aria-hidden
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <nav
                className="flex flex-col gap-0.5 border-l border-neutral-200 py-1 pl-2 dark:border-neutral-700"
                aria-label={group.label}
              >
                {group.links.map((link) => {
                  const active = isNavLinkActive(pathname, link.href);
                  const Icon = link.icon;

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "shell-nav-link flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800",
                        active
                          ? "bg-teal-50 font-semibold text-teal-900 dark:bg-teal-900/30 dark:text-teal-200"
                          : "text-neutral-800 dark:text-neutral-200",
                      )}
                      title={link.title}
                      aria-current={active ? "page" : undefined}
                      aria-keyshortcuts={
                        link.keyShortcut ? registryKeyToAriaKeyShortcuts(link.keyShortcut) : undefined
                      }
                    >
                      {Icon ? <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden /> : null}
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
      <p
        className="mt-3 border-t border-neutral-200 pt-3 text-xs text-neutral-600 dark:border-neutral-700 dark:text-neutral-400"
        aria-keyshortcuts="Shift+?"
      >
        Press Shift+? for keyboard shortcuts
      </p>
    </div>
  );
}

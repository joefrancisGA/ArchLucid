"use client";

import { CircleUser } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SELF_SETTINGS_DESTINATIONS } from "@/lib/self-settings-destinations";
import { cn } from "@/lib/utils";

export const ACCOUNT_SETTINGS_MENU_ARIA_LABEL = "Your account settings";

/**
 * Top-bar entry point for user-scoped settings.
 *
 * Deliberately ungated: every destination here writes only the signed-in caller's own record, so no
 * authority rank is consulted and the menu renders in every auth mode. Tenant-scoped settings are
 * published from the Administration settings hub instead.
 */
export function AccountSettingsMenu(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const closeMenu = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen} className="relative">
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="inline-flex h-7 w-7 items-center justify-center p-0"
          data-testid="account-settings-menu-trigger"
          aria-label={ACCOUNT_SETTINGS_MENU_ARIA_LABEL}
        >
          <CircleUser className="size-[18px]" aria-hidden />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="p-2" data-testid="account-settings-menu">
        <ul aria-label={ACCOUNT_SETTINGS_MENU_ARIA_LABEL} className="m-0 list-none space-y-1 p-0">
          {SELF_SETTINGS_DESTINATIONS.map((destination) => {
            const isCurrent = pathname === destination.href;

            return (
              <li key={destination.id} className="m-0">
                <Link
                  href={destination.href}
                  aria-current={isCurrent ? "page" : undefined}
                  data-testid={`account-settings-menu-item-${destination.id}`}
                  onClick={closeMenu}
                  className={cn(
                    "block rounded-md px-2 py-1.5 no-underline hover:bg-neutral-100 dark:hover:bg-neutral-800",
                    isCurrent ? "bg-neutral-100 dark:bg-neutral-800" : undefined,
                  )}
                >
                  <span className={cn("block font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                    {destination.title}
                  </span>
                  <span className={cn("block text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    {destination.description}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

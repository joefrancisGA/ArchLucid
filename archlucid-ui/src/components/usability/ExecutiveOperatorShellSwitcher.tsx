"use client";
import { cn } from "@/lib/utils";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { PERSONA_SHELL_LABELS } from "@/lib/persona-shell-vocabulary";

/** Toggle between operator and executive shell views. */
export function ExecutiveOperatorShellSwitcher() {
  const pathname = usePathname() ?? "/";
  const inExecutive = pathname.startsWith("/executive");

  return (
    <div
      className="inline-flex items-center rounded-md border border-neutral-200 p-0.5 dark:border-neutral-700"
      data-testid="executive-operator-shell-switcher"
      role="group"
      aria-label={PERSONA_SHELL_LABELS.switchGroupAriaLabel}
    >
      <Button
        type="button"
        size="sm"
        variant={inExecutive ? "outline" : "default"}
        className={cn("h-7 px-2.5", !inExecutive && "shadow-none")}
        asChild
      >
        <Link href="/" aria-current={inExecutive ? undefined : "page"}>
          {PERSONA_SHELL_LABELS.architect}
        </Link>
      </Button>
      <Button
        type="button"
        size="sm"
        variant={inExecutive ? "default" : "outline"}
        className={cn("h-7 px-2.5", inExecutive && "shadow-none")}
        asChild
      >
        <Link href="/executive/dashboard" aria-current={inExecutive ? "page" : undefined}>
          {PERSONA_SHELL_LABELS.executive}
        </Link>
      </Button>
    </div>
  );
}

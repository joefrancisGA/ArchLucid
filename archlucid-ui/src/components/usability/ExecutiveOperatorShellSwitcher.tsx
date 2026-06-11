"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Toggle between operator and executive shell views. */
export function ExecutiveOperatorShellSwitcher() {
  const pathname = usePathname() ?? "/";
  const inExecutive = pathname.startsWith("/executive");

  return (
    <div
      className="inline-flex items-center rounded-md border border-neutral-200 p-0.5 dark:border-neutral-700"
      data-testid="executive-operator-shell-switcher"
      role="group"
      aria-label="Switch shell view"
    >
      <Button
        type="button"
        size="sm"
        variant={inExecutive ? "outline" : "default"}
        className={cn("h-7 px-2.5", !inExecutive && "shadow-none")}
        asChild={!inExecutive}
      >
        {inExecutive ? (
          <Link href="/">Operator</Link>
        ) : (
          <span>Operator</span>
        )}
      </Button>
      <Button
        type="button"
        size="sm"
        variant={inExecutive ? "default" : "outline"}
        className={cn("h-7 px-2.5", inExecutive && "shadow-none")}
        asChild={inExecutive}
      >
        {inExecutive ? (
          <span>Executive</span>
        ) : (
          <Link href="/executive/dashboard">Executive</Link>
        )}
      </Button>
    </div>
  );
}

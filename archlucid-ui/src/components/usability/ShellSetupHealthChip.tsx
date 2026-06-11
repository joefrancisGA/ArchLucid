"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { fetchHealthReadySummary } from "@/lib/fetch-health-ready";
import { cn } from "@/lib/utils";

type ShellSetupHealthChipProps = {
  readonly className?: string;
};

/** Compact header chip: API + workspace setup health at a glance. */
export function ShellSetupHealthChip(props: ShellSetupHealthChipProps) {
  const [label, setLabel] = useState<string>("Checking…");
  const [tone, setTone] = useState<"ready" | "attention" | "neutral">("neutral");

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      const body = await fetchHealthReadySummary().catch(() => null);

      if (cancelled) {
        return;
      }

      if (body === null) {
        setLabel("Setup unknown");
        setTone("neutral");

        return;
      }

      const status = (body.status ?? "").toLowerCase();

      if (status.includes("healthy") || status.includes("ok")) {
        setLabel("Setup healthy");
        setTone("ready");

        return;
      }

      if (status.includes("degraded") || status.includes("warn")) {
        setLabel("Setup needs attention");
        setTone("attention");

        return;
      }

      setLabel("Setup blocked");
      setTone("attention");
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const dotClass =
    tone === "ready"
      ? "bg-emerald-500"
      : tone === "attention"
        ? "bg-amber-500"
        : "bg-neutral-400";

  return (
    <Link
      href="/help/troubleshooting"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900",
        props.className,
      )}
      data-testid="shell-setup-health-chip"
      title="Workspace setup health — open troubleshooting"
    >
      <span className={cn("inline-block h-2 w-2 rounded-full", dotClass)} aria-hidden />
      {label}
    </Link>
  );
}

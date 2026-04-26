"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { AUTH_MODE } from "@/lib/auth-config";
import { isJwtAuthMode } from "@/lib/oidc/config";
import { isLikelySignedIn } from "@/lib/oidc/session";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "archlucid_welcome_dismissed";

type TrialStatusPayload = {
  status?: string;
  daysRemaining?: number | null;
};

/**
 * Operator-home welcome: trial-aware copy when `GET /v1/tenant/trial-status` reports an active self-service trial;
 * otherwise the original first-run guidance. Dismissal persists in localStorage.
 */
export function WelcomeBanner() {
  const [dismissed, setDismissed] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [trial, setTrial] = useState<TrialStatusPayload | null>(null);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      setDismissed(raw === "1");
    } catch {
      setDismissed(false);
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || dismissed) {
      return;
    }

    if (AUTH_MODE !== "development-bypass" && isJwtAuthMode() && !isLikelySignedIn()) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch(
          "/api/proxy/v1/tenant/trial-status",
          mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }),
        );

        if (!res.ok || cancelled) {
          return;
        }

        const json = (await res.json()) as TrialStatusPayload;

        if (!cancelled) {
          setTrial(json);
        }
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated, dismissed]);

  if (!hydrated || dismissed) {
    return null;
  }

  const trialActive = trial?.status === "Active";
  const days = trial?.daysRemaining;

  return (
    <div
      role="banner"
      aria-label={trialActive ? "Trial welcome" : "Welcome"}
      className={cn(
        "relative mb-6 rounded-xl border bg-gradient-to-br px-6 py-6 shadow-sm",
        trialActive
          ? "border-amber-200 from-amber-50 to-white dark:border-amber-900 dark:from-amber-950/30 dark:to-neutral-900"
          : "border-teal-200 from-teal-50 to-white dark:border-teal-900 dark:from-teal-950/30 dark:to-neutral-900",
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-3 top-3 h-7 w-7 text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-200"
        aria-label="Dismiss welcome banner"
        onClick={() => {
          try {
            window.localStorage.setItem(STORAGE_KEY, "1");
          } catch {
            /* private mode */
          }

          setDismissed(true);
        }}
      >
        <X className="h-4 w-4" aria-hidden />
      </Button>

      {trialActive && typeof days === "number" ? (
        <span className="mb-2 inline-block rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 dark:border-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
          {days} day{days === 1 ? "" : "s"} left on trial
        </span>
      ) : null}

      <h2 className="pr-10 text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
        {trialActive ? "Start your first pilot run" : "Start your first pilot run"}
      </h2>
      <p className="mt-1.5 max-w-lg text-sm text-neutral-600 dark:text-neutral-400">
        Generate manifests and review artifacts in the guided workflow.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button asChild variant="primary" className="h-10 px-6 text-sm font-semibold shadow-sm">
          <Link href="/runs/new">Create Run</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/runs?projectId=default">Explore demo data</Link>
        </Button>
        {trialActive ? (
          <Button asChild variant="outline" size="sm">
            <Link href="/getting-started?source=registration">Onboarding checklist</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

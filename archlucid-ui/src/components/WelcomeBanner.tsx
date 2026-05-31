"use client";

import { ClipboardCheck, FileCheck2, Package, Target } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import type { CSSProperties } from "react";

import { OptInTourLauncher } from "@/components/tour/OptInTourLauncher";
import { GlossaryTooltip } from "@/components/GlossaryTooltip";
import { Button } from "@/components/ui/button";
import { AUTH_MODE } from "@/lib/auth-config";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { isJwtAuthMode } from "@/lib/oidc/config";
import { isLikelySignedIn } from "@/lib/oidc/session";
import { normalizeRunSummaryForDemoPicker } from "@/lib/demo-run-canonical";
import { loadProjectRunsMergedWithDemoFallback } from "@/lib/operator-run-picker-client";
import { tryStaticDemoRunSummariesPaged, isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";
import { writeHasExistingRunsCache } from "@/lib/operator-run-presence";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { cn } from "@/lib/utils";

const SESSION_DISMISS_KEY = "archlucid_welcome_dismissed_session";

type TrialStatusPayload = {
  status?: string;
  daysRemaining?: number | null;
};

/**
 * Operator-home welcome: trial badge from `GET /v1/tenant/trial-status` (defers until load); first-run vs returning
 * copy from a cached `archlucid_has_existing_runs` (instant) and {@link loadProjectRunsMergedWithDemoFallback}
 * so static demo injections match `/reviews`.
 * sessionStorage so a new browser session can show the banner again.
 */
const DEFAULT_PROJECT_ID = "default";

const dotMaskStyle: CSSProperties = {
  WebkitMaskImage:
    "linear-gradient(to right, transparent 0%, transparent 35%, rgba(0,0,0,0.2) 55%, rgba(0,0,0,0.7) 100%)",
  maskImage: "linear-gradient(to right, transparent 0%, transparent 35%, rgba(0,0,0,0.2) 55%, rgba(0,0,0,0.7) 100%)",
};

export function WelcomeBanner() {
  const patternId = useId().replaceAll(":", "");
  const [dismissed, setDismissed] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [trial, setTrial] = useState<TrialStatusPayload | null>(null);
  const [trialStatusResolved, setTrialStatusResolved] = useState(false);
  const [runsPresenceResolved, setRunsPresenceResolved] = useState(false);
  const [hasExistingRuns, setHasExistingRuns] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.sessionStorage.getItem(SESSION_DISMISS_KEY) === "1") {
        setDismissed(true);
      } else {
        setDismissed(false);
      }
    } catch {
      setDismissed(false);
      setHasExistingRuns(false);
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || dismissed) {
      return;
    }

    if (AUTH_MODE !== "development-bypass" && isJwtAuthMode() && !isLikelySignedIn()) {
      setTrialStatusResolved(true);
      setRunsPresenceResolved(true);

      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch(
          "/api/proxy/v1/tenant/trial-status",
          mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }),
        );

        if (!cancelled && res.ok) {
          const json = (await res.json()) as TrialStatusPayload;
          setTrial(json);
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) {
          setTrialStatusResolved(true);
        }
      }

      try {
        const merged = await loadProjectRunsMergedWithDemoFallback(DEFAULT_PROJECT_ID);
        let items = merged.items;

        if (items.length === 0 && isStaticDemoPayloadFallbackEnabled()) {
          const injected = tryStaticDemoRunSummariesPaged(DEFAULT_PROJECT_ID, { afterEmptyLiveList: true });

          if (injected !== null && injected.items.length > 0) {
            items = injected.items.map(normalizeRunSummaryForDemoPicker);
          }
        }

        const next = items.length > 0;

        if (cancelled) {
          return;
        }

        setHasExistingRuns(next);
        writeHasExistingRunsCache(next);
      } catch {
        if (!cancelled) {
          setHasExistingRuns(false);
          writeHasExistingRunsCache(false);
        }
      } finally {
        if (!cancelled) {
          setRunsPresenceResolved(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated, dismissed]);

  if (!hydrated) {
    return null;
  }

  if (dismissed) {
    return null;
  }

  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  if (buyerPolishedShell && !runsPresenceResolved) {
    return null;
  }

  const trialActive = trial?.status === "Active";
  const days = trial?.daysRemaining;
  const returningUser = hasExistingRuns;

  if (buyerPolishedShell && runsPresenceResolved && !hasExistingRuns && !trialStatusResolved) {
    return null;
  }

  if (buyerPolishedShell && runsPresenceResolved && trialStatusResolved && !hasExistingRuns) {
    return (
      <div role="banner" aria-label="New here tour callout" className="mb-4 space-y-2">
        {trialActive ? (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2 text-sm shadow-sm dark:border-amber-900 dark:bg-amber-950/40">
            {typeof days === "number" ? (
              <span className="inline-block rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:border-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                {days} day{days === 1 ? "" : "s"} left on trial
              </span>
            ) : (
              <span className="inline-block rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:border-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                Trial active
              </span>
            )}
          </div>
        ) : null}
        <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 dark:border-teal-900 dark:bg-teal-950/30">
          <h2 className="mb-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">New here?</h2>
          <p className="mb-3 text-sm text-neutral-700 dark:text-neutral-300">
            Take a quick 6-step tour to see how a review goes from upload to architecture snapshot.
          </p>
          <OptInTourLauncher buttonVariant="outline" />
        </div>
      </div>
    );
  }

  const headingText =
    returningUser
      ? "Your review workspace"
      : buyerPolishedShell
        ? "Explore one governed Claims Intake review package"
        : "Your first architecture review — four steps";

  // Core workspace hero — always expanded; do not add Minimize/X collapse here.
  const subheadingText = returningUser ? (
    <>
      Open in-progress architecture reviews, finish packages that still need attention, and review prioritized{" "}
      <GlossaryTooltip termKey="findings">findings</GlossaryTooltip>.
    </>
  ) : buyerPolishedShell ? (
    <>
      Lead with <strong>executive view</strong> for a board-ready summary of this sample, then the{" "}
      <strong>manifest summary</strong> (finalized signed package), <strong>audit trail</strong>, and prioritized{" "}
      <GlossaryTooltip termKey="findings">findings</GlossaryTooltip>.
    </>
  ) : (
    <>
      <strong>Create a review</strong>, attach evidence, <strong>complete the guided assessment</strong>, then{" "}
      <strong>open your review package</strong> (summary, findings, downloads). The same wizard supports structured
      capture or loose architecture scope notes.
    </>
  );

  return (
    <div
      role="banner"
      aria-label={trialActive ? "Trial welcome" : "Welcome"}
      className={cn(
        "isolate relative mb-4 overflow-hidden rounded-xl border border-l-4 bg-gradient-to-br px-5 py-4 shadow-sm",
        trialActive
          ? "border-amber-200 border-l-amber-500 from-amber-50/80 to-white dark:border-amber-900 dark:border-l-amber-500 dark:from-amber-950/30 dark:to-neutral-900"
          : "border-teal-200 border-l-teal-600 from-teal-50/80 to-white dark:border-teal-900 dark:border-l-teal-500 dark:from-teal-950/30 dark:to-neutral-900",
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-xl opacity-20 mix-blend-multiply dark:opacity-15 dark:mix-blend-screen"
        style={dotMaskStyle}
        aria-hidden
      >
        <svg className="absolute left-0 top-0 h-full w-full" width="100%" height="100%" aria-hidden>
          <defs>
            <pattern id={patternId} x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" className="fill-teal-800 dark:fill-teal-100" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${patternId})`} />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
        <div className="min-w-0 flex-1">
          {trialActive && typeof days === "number" ? (
            <span className="mb-2 inline-block rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 dark:border-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
              {days} day{days === 1 ? "" : "s"} left on trial
            </span>
          ) : null}
          <h2 className="mb-1 text-3xl font-bold leading-tight tracking-tight text-neutral-900 dark:text-neutral-100">
            {headingText}
          </h2>
          <p className="mt-0 max-w-lg text-sm text-neutral-600 dark:text-neutral-400">{subheadingText}</p>

          {buyerPolishedShell ? null : (
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <OptInTourLauncher className="h-10 px-4 text-sm" />
              <Button
                asChild
                variant="outline"
                className="h-10 border-teal-300 px-5 text-sm font-semibold text-teal-800 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-300 dark:hover:bg-teal-900/40"
              >
                <Link href="/showcase/claims-intake-modernization">See completed example</Link>
              </Button>
            </div>
          )}
        </div>

        {!returningUser ? (
          <div
            className="w-full shrink-0 rounded-lg border border-teal-200/90 bg-white/95 px-4 py-3.5 text-sm shadow-md ring-1 ring-teal-100/80 backdrop-blur-sm dark:border-teal-800/70 dark:bg-neutral-900/90 dark:ring-teal-950/40 lg:max-w-[18rem]"
            aria-label={
              returningUser ? "Resume architecture reviews — shortcuts" : "What one completed architecture review delivers"
            }
          >
            <p className="m-0 mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">What you&apos;ll get</p>
            <ul className="m-0 mb-2.5 list-none space-y-2 p-0">
              {(
                [
                  { id: "governed-manifest", label: "Governed decision record" as const, Icon: FileCheck2 },
                  { id: "actionable-findings", label: "Actionable findings" as const, Icon: Target },
                  {
                    id: "artifact-bundle",
                    label: <GlossaryTooltip termKey="artifact_bundle">artifact bundle</GlossaryTooltip>,
                    Icon: Package,
                  },
                  { id: "review-trail", label: "Review trail" as const, Icon: ClipboardCheck },
                ] as const
              ).map(({ id, label, Icon }) => (
                <li key={id} className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">
                  <Icon className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" aria-hidden />
                  {label}
                </li>
              ))}
            </ul>
            <p className="m-0 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
              {buyerPolishedShell
                ? "Executive view for sponsors; manifest summary for the finalized signed record; optional read-only walkthrough when you want a guided tour."
                : "One request produces everything needed for review."}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

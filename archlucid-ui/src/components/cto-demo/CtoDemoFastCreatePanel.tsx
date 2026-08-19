"use client";

import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CtoDemoLiveRunProgressRail } from "@/components/cto-demo/CtoDemoLiveRunProgressRail";
import { CtoDemoLatencyBudgetIndicator } from "@/components/cto-demo/CtoDemoLatencyBudgetIndicator";
import { CONTOSO_RETAIL_SAMPLE_BRIEF } from "@/lib/quick-review-sample-briefs";
import type { CreateArchitectureRunRequestPayload } from "@/lib/api";
import {
  CTO_DEMO_FAST_CREATE_STAGE_LABELS,
  CTO_DEMO_FAST_CREATE_TOTAL_MS,
  ctoDemoFastCreateStageIndex,
  getCtoDemoFastCreateDestinationHref,
} from "@/lib/cto-demo-fast-create";
import { findQuickReviewSampleBrief, QUICK_REVIEW_DEMO_DEFAULT_BRIEF_ID } from "@/lib/quick-review-sample-briefs";
import { SOFT_NAVIGATION_TIMEOUT_MS } from "@/hooks/use-soft-navigation-loading";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

function buildHealthcareLivePayload(): CreateArchitectureRunRequestPayload {
  const sample = findQuickReviewSampleBrief(QUICK_REVIEW_DEMO_DEFAULT_BRIEF_ID);
  const description = sample?.brief ?? CONTOSO_RETAIL_SAMPLE_BRIEF;

  return {
    requestId: crypto.randomUUID().replace(/-/g, ""),
    description: description.trim(),
    systemName: "Claims Intake Modernization",
    environment: "staging",
    cloudProvider: "Azure",
    constraints: [],
    requiredCapabilities: [],
    assumptions: [],
  };
}

/** Deterministic simulated create plus optional live API path for CTO demos. */
export function CtoDemoFastCreatePanel(): ReactElement {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [liveRunActive, setLiveRunActive] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const navTimeoutIdRef = useRef<number | null>(null);
  const livePayload = useMemo(() => buildHealthcareLivePayload(), []);

  const stopAnimation = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopAnimation();

      if (navTimeoutIdRef.current !== null) {
        window.clearTimeout(navTimeoutIdRef.current);
        navTimeoutIdRef.current = null;
      }
    };
  }, [stopAnimation]);

  const startFastCreate = () => {
    if (running || liveRunActive) {
      return;
    }

    setRunning(true);
    setElapsedMs(0);
    startedAtRef.current = performance.now();

    const tick = (now: number) => {
      const startedAt = startedAtRef.current;

      if (startedAt === null) {
        return;
      }

      const nextElapsed = now - startedAt;
      setElapsedMs(nextElapsed);

      if (nextElapsed >= CTO_DEMO_FAST_CREATE_TOTAL_MS) {
        stopAnimation();
        router.push(getCtoDemoFastCreateDestinationHref());

        if (navTimeoutIdRef.current !== null) {
          window.clearTimeout(navTimeoutIdRef.current);
        }

        // Soft-nav stall must not leave the simulator permanently "running".
        navTimeoutIdRef.current = window.setTimeout(() => {
          setRunning(false);
          navTimeoutIdRef.current = null;
        }, SOFT_NAVIGATION_TIMEOUT_MS);

        return;
      }

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
  };

  const startLiveRun = () => {
    if (running || liveRunActive) {
      return;
    }

    setLiveRunActive(true);
  };

  const stageIndex = ctoDemoFastCreateStageIndex(elapsedMs);
  const progressPercent = Math.min(100, Math.round((elapsedMs / CTO_DEMO_FAST_CREATE_TOTAL_MS) * 100));

  return (
    <Card data-testid="cto-demo-fast-create-panel" className="border-teal-200/70 dark:border-teal-900/40">
      <CardHeader className="pb-2">
        <CardTitle className={OPERATOR_TYPOGRAPHY.body}>Live create (demo)</CardTitle>
        <CardDescription>
          Simulator path lands on the showcase in ~15s. Live path uses your Azure OpenAI deployment with the same pipeline.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {liveRunActive ? (
          <>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.badge, "text-neutral-600 dark:text-neutral-400")}>
              Live mode uses Azure OpenAI — the same pipeline as a real review, triggered now.
            </p>
            <CtoDemoLiveRunProgressRail payload={livePayload} />
          </>
        ) : running ? (
          <div className="space-y-2" aria-live="polite">
            <CtoDemoLatencyBudgetIndicator running={running} budgetMs={CTO_DEMO_FAST_CREATE_TOTAL_MS} elapsedMs={elapsedMs} />
            <div className="h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
              <div
                className="h-full rounded-full bg-teal-600 transition-[width] duration-150 dark:bg-teal-500"
                style={{ width: `${progressPercent}%` }}
                data-testid="cto-demo-fast-create-progress"
              />
            </div>
            <p className={cn("m-0 text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>{CTO_DEMO_FAST_CREATE_STAGE_LABELS[stageIndex]}</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={startFastCreate} data-testid="cto-demo-fast-create-start">
              Start simulator create
            </Button>
            <Button type="button" variant="outline" onClick={startLiveRun} data-testid="cto-demo-try-it-live">
              Try it live (not simulated)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

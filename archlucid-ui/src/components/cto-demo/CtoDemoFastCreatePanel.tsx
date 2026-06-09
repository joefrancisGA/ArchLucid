"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CTO_DEMO_FAST_CREATE_STAGE_LABELS,
  CTO_DEMO_FAST_CREATE_TOTAL_MS,
  ctoDemoFastCreateStageIndex,
  getCtoDemoFastCreateDestinationHref,
} from "@/lib/cto-demo-fast-create";
import { CONTOSO_RETAIL_SAMPLE_BRIEF } from "@/app/(operator)/reviews/new/QuickReviewWizard";

/** Deterministic 15-second simulated create for CTO demos (#5). */
export function CtoDemoFastCreatePanel(): ReactElement {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);

  const stopAnimation = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopAnimation();
    };
  }, [stopAnimation]);

  const startFastCreate = () => {
    if (running) {
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

        return;
      }

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
  };

  const stageIndex = ctoDemoFastCreateStageIndex(elapsedMs);
  const progressPercent = Math.min(100, Math.round((elapsedMs / CTO_DEMO_FAST_CREATE_TOTAL_MS) * 100));

  return (
    <Card data-testid="cto-demo-fast-create-panel" className="border-teal-200/70 dark:border-teal-900/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Live create (demo)</CardTitle>
        <CardDescription>
          One click loads the Contoso sample and lands on a finalized review in about fifteen seconds — no API wait.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="m-0 line-clamp-2 text-xs text-neutral-600 dark:text-neutral-400">{CONTOSO_RETAIL_SAMPLE_BRIEF}</p>
        {running ? (
          <div className="space-y-2" aria-live="polite">
            <div className="h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
              <div
                className="h-full rounded-full bg-teal-600 transition-[width] duration-150 dark:bg-teal-500"
                style={{ width: `${progressPercent}%` }}
                data-testid="cto-demo-fast-create-progress"
              />
            </div>
            <p className="m-0 text-sm text-neutral-800 dark:text-neutral-200">
              {CTO_DEMO_FAST_CREATE_STAGE_LABELS[stageIndex]}
            </p>
          </div>
        ) : (
          <Button type="button" onClick={startFastCreate} data-testid="cto-demo-fast-create-start">
            Start live create (Contoso sample)
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { LlmMonthlyBudgetExceededBanner } from "@/components/LlmMonthlyBudgetExceededBanner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createArchitectureRun } from "@/lib/api";
import type { CreateArchitectureRunRequestPayload } from "@/lib/api";
import { useLlmMonthlyBudgetExecutionGate } from "@/hooks/use-llm-monthly-budget-execution-gate";
import { recordFirstTenantFunnelEvent } from "@/lib/first-tenant-funnel-telemetry";
import { getEffectiveBrowserProxyScopeHeaders } from "@/lib/operator-scope-storage";
import { REVIEWS_NEW_BRIEF_PLACEHOLDER, REVIEWS_NEW_PATH_HINTS } from "@/lib/reviews-new-path-copy";
import { showError, showSuccess } from "@/lib/toast";

import { ReviewPathTimeEstimateBanner } from "@/components/ReviewPathTimeEstimateBanner";
import { WizardEvidenceUploadZone } from "@/components/usability/WizardEvidenceUploadZone";
import { WizardPackagePreview } from "@/components/usability/WizardPackagePreview";
import { NewRunWizardClient } from "./NewRunWizardClient";
import { NewReviewIntentCallout } from "./NewReviewIntentCallout";
import { SocraticIntakeWizard } from "./SocraticIntakeWizard";
import { CtoDemoFastCreatePanel } from "@/components/cto-demo/CtoDemoFastCreatePanel";
import {
  CtoDemoReviewModeCallout,
  type CtoDemoReviewExecutionMode,
} from "@/components/cto-demo/CtoDemoReviewModeCallout";
import { readBuyerCtoDemoTourActive } from "@/lib/buyer-cto-demo-tour";
import { isCtoDemoPackEnv } from "@/lib/cto-demo-presenter-pack";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { REVIEWS_NEW_OTHER_PATHS_DISCLOSURE, QUICK_REVIEW_SAMPLE_BRIEF_CAPTION } from "@/lib/buyer-polish-copy";
import {
  CONTOSO_RETAIL_SAMPLE_BRIEF,
  defaultQuickReviewSampleBriefId,
  findQuickReviewSampleBrief,
  QUICK_REVIEW_SAMPLE_BRIEFS,
} from "@/lib/quick-review-sample-briefs";

/** Persisted when the operator switches paths; missing key defaults to Quick review (onboarding-friendly). */
const REVIEWS_NEW_PATH_STORAGE_KEY = "archlucid_reviews_new_path_v2";

type ReviewsNewPathMode = "quick-review" | "guided-intake" | "detailed";

export { CONTOSO_RETAIL_SAMPLE_BRIEF };

const MIN_BRIEF_CHARS = 100;

const QUICK_REVIEW_STEPS = [
  { label: "Paste your architecture brief", description: "Free text — we send it as the architecture review description." },
  { label: "Review scope", description: "Confirm workspace scope and optional title." },
  { label: "Confirm and start architecture review", description: "Create the request and open pipeline progress." },
] as const;

function readStoredPathMode(): ReviewsNewPathMode {
  if (typeof window === "undefined") {
    return "quick-review";
  }

  try {
    const raw = window.localStorage.getItem(REVIEWS_NEW_PATH_STORAGE_KEY);

    if (raw === "detailed" || raw === "quick-review" || raw === "guided-intake") {
      return raw;
    }

    const legacy = window.localStorage.getItem("archlucid_reviews_new_path_v1");

    if (legacy === "detailed" || legacy === "quick-review") {
      return legacy;
    }
  } catch {
    /* ignore */
  }

  return "quick-review";
}

function persistPathMode(mode: ReviewsNewPathMode): void {
  try {
    window.localStorage.setItem(REVIEWS_NEW_PATH_STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}

function buildQuickReviewPayload(brief: string, titleTrimmed: string): CreateArchitectureRunRequestPayload {
  const systemName = titleTrimmed.trim().length >= 2 ? titleTrimmed.trim() : "Architecture review";

  return {
    requestId: crypto.randomUUID().replace(/-/g, ""),
    description: brief.trim(),
    systemName,
    environment: "staging",
    cloudProvider: "Azure",
    constraints: [],
    requiredCapabilities: [],
    assumptions: [],
  };
}

export type QuickReviewWizardProps = {
  /** Test hook: invoked instead of `router.push` after a run id is returned. */
  onRunCreatedNavigate?: (runId: string) => void;
};

/**
 * Three-step “paste your brief” path: brief → scope/title → confirm. Posts the same body shape as the full wizard.
 */
export function QuickReviewWizard(props: QuickReviewWizardProps) {
  const { onRunCreatedNavigate } = props;
  const { status: llmBudgetStatus, blocksLlmExecution } = useLlmMonthlyBudgetExecutionGate();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [briefText, setBriefText] = useState("");
  const [activeSampleBriefId, setActiveSampleBriefId] = useState<string | null>(null);
  const [runTitle, setRunTitle] = useState("");
  const [scope, setScope] = useState<Record<string, string> | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [executionMode, setExecutionMode] = useState<CtoDemoReviewExecutionMode>("simulator");
  const [evidenceAttached, setEvidenceAttached] = useState(false);

  const briefOk = briefText.trim().length >= MIN_BRIEF_CHARS;
  const showDemoModeCallout = isCtoDemoPackEnv() || isBuyerPolishedOperatorShellEnv() || readBuyerCtoDemoTourActive();

  useEffect(() => {
    if (step !== 1) {
      return;
    }

    setScope(getEffectiveBrowserProxyScopeHeaders());
  }, [step]);

  const defaultBriefAppliedRef = useRef(false);

  useEffect(() => {
    if (defaultBriefAppliedRef.current) {
      return;
    }

    defaultBriefAppliedRef.current = true;
    const demoMode = isCtoDemoPackEnv() || isBuyerPolishedOperatorShellEnv();
    const tourActive = readBuyerCtoDemoTourActive();
    const defaultId = defaultQuickReviewSampleBriefId(demoMode, tourActive);
    const sample = findQuickReviewSampleBrief(defaultId);

    if (sample === null) {
      return;
    }

    setBriefText(sample.brief);
    setActiveSampleBriefId(sample.id);
  }, []);

  const scopeTenant = scope?.["x-tenant-id"] ?? "—";
  const scopeWorkspace = scope?.["x-workspace-id"] ?? "—";
  const scopeProject = scope?.["x-project-id"] ?? "—";

  const displaySystemName = useMemo(() => {
    const t = runTitle.trim();

    return t.length >= 2 ? t : "Architecture review";
  }, [runTitle]);

  const showToast = useCallback((kind: "ok" | "err", message: string) => {
    if (kind === "ok") {
      showSuccess(message);
    } else {
      showError("Quick review", message);
    }
  }, []);

  const goBack = () => {
    setStep((s) => Math.max(0, s - 1));
  };

  const goNext = () => {
    if (step === 0 && !briefOk) {
      showToast("err", `Brief must be at least ${MIN_BRIEF_CHARS} characters.`);

      return;
    }

    setStep((s) => Math.min(QUICK_REVIEW_STEPS.length - 1, s + 1));
  };

  const applySampleBrief = (briefId: string) => {
    const sample = findQuickReviewSampleBrief(briefId);

    if (sample === null) {
      return;
    }

    setBriefText(sample.brief);
    setActiveSampleBriefId(sample.id);
  };

  const useSampleBrief = () => {
    applySampleBrief("retail");
  };

  const submitRun = async () => {
    if (!briefOk) {
      showToast("err", `Brief must be at least ${MIN_BRIEF_CHARS} characters.`);

      return;
    }

    if (blocksLlmExecution) {
      showToast("err", "LLM Execution budget exceeded for this month. You may still view previous runs.");

      return;
    }

    setSubmitting(true);

    try {
      const body = buildQuickReviewPayload(briefText, runTitle.trim());
      const res = await createArchitectureRun(body);
      const id = res.run?.runId ?? null;

      if (!id) {
        showToast("err", "API returned no architecture review id.");

        return;
      }

      recordFirstTenantFunnelEvent("first_run_started");
      showToast("ok", `Architecture review ${id} created — opening pipeline.`);

      if (onRunCreatedNavigate !== undefined) {
        onRunCreatedNavigate(id);

        return;
      }

      router.push(`/reviews/${encodeURIComponent(id)}`);
    } catch (error: unknown) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Request failed.";
      showToast("err", message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-4 pb-36 lg:grid-cols-[minmax(0,1fr)_minmax(220px,280px)]">
      <div className="space-y-4">
      {isCtoDemoPackEnv() ? <CtoDemoFastCreatePanel /> : null}
      {llmBudgetStatus !== null ? <LlmMonthlyBudgetExceededBanner status={llmBudgetStatus} /> : null}
      <div className="space-y-1" data-testid="quick-review-progress">
        <p className="m-0 font-medium text-neutral-900 dark:text-neutral-100">
          Quick review — step {step + 1} of {QUICK_REVIEW_STEPS.length}: {QUICK_REVIEW_STEPS[step].label}
        </p>
        <p className="m-0 text-sm text-neutral-500 dark:text-neutral-400">{QUICK_REVIEW_STEPS[step].description}</p>
      </div>

      {step === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Paste your architecture brief</CardTitle>
            <CardDescription>
              Include goals, constraints, and context so the pipeline has enough to work with. Minimum {MIN_BRIEF_CHARS}{" "}
              characters.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="quick-review-brief">Architecture brief</Label>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Sample brief verticals">
                {QUICK_REVIEW_SAMPLE_BRIEFS.map((sample) => (
                  <Button
                    key={sample.id}
                    type="button"
                    variant={activeSampleBriefId === sample.id ? "default" : "outline"}
                    size="sm"
                    data-testid={`quick-review-vertical-${sample.id}`}
                    onClick={() => {
                      applySampleBrief(sample.id);
                    }}
                  >
                    {sample.label}
                  </Button>
                ))}
              </div>
              <Textarea
                id="quick-review-brief"
                value={briefText}
                onChange={(e) => {
                  setBriefText(e.target.value);
                  setActiveSampleBriefId(null);
                }}
                className="min-h-[220px] font-mono text-sm"
                placeholder="Example: Document the target architecture for a customer-facing retail API on Azure — App Service for APIs, Azure SQL for orders, Redis cache, PCI-scoped segregation for payment-adjacent flows, 99.9% availability during peak, EU data residency for profiles, and a phased cutover from the current on-prem monolith…"
                aria-describedby="quick-review-brief-hint"
                autoComplete="off"
              />
              <p id="quick-review-brief-hint" className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
                {briefText.trim().length}/{MIN_BRIEF_CHARS} characters minimum. Paste an executive summary or detailed
                brief — it becomes the review description sent to the API.
                {activeSampleBriefId !== null ? (
                  <span className="mt-1 block text-xs text-neutral-500 dark:text-neutral-400">
                    {QUICK_REVIEW_SAMPLE_BRIEF_CAPTION}
                  </span>
                ) : null}
              </p>
            </div>
            <Button type="button" variant="secondary" onClick={useSampleBrief} data-testid="quick-review-sample-brief">
              Use sample brief (Claims Intake showcase)
            </Button>
            <WizardEvidenceUploadZone
              onFilesSelected={(files) => {
                if (files.length > 0) {
                  setEvidenceAttached(true);
                }
              }}
            />
          </CardContent>
        </Card>
      ) : null}

      {step === 1 ? (
        <Card>
          <CardHeader>
            <CardTitle>Review scope</CardTitle>
            <CardDescription>Requests use your current tenant, workspace, and project headers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="m-0 grid gap-2 text-sm">
              <div>
                <dt className="text-neutral-500 dark:text-neutral-400">Tenant</dt>
                <dd className="m-0 font-mono text-neutral-900 dark:text-neutral-100">{scopeTenant}</dd>
              </div>
              <div>
                <dt className="text-neutral-500 dark:text-neutral-400">Workspace</dt>
                <dd className="m-0 font-mono text-neutral-900 dark:text-neutral-100">{scopeWorkspace}</dd>
              </div>
              <div>
                <dt className="text-neutral-500 dark:text-neutral-400">Project</dt>
                <dd className="m-0 font-mono text-neutral-900 dark:text-neutral-100">{scopeProject}</dd>
              </div>
            </dl>
            <div className="space-y-2">
              <Label htmlFor="quick-review-title">Review title (optional)</Label>
              <Input
                id="quick-review-title"
                value={runTitle}
                onChange={(e) => {
                  setRunTitle(e.target.value);
                }}
                placeholder="Short name for this review (maps to system name)"
                autoComplete="off"
              />
              <p className="m-0 text-xs text-neutral-500 dark:text-neutral-400">
                If empty, the review uses “{displaySystemName}” as the system name.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card>
          <CardHeader>
            <CardTitle>Confirm and start architecture review</CardTitle>
            <CardDescription>This starts a new architecture review with your pasted brief.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {showDemoModeCallout ? (
              <CtoDemoReviewModeCallout mode={executionMode} onModeChange={setExecutionMode} />
            ) : null}
            <p className="m-0">
              <strong>System name:</strong> {displaySystemName}
            </p>
            <p className="m-0">
              <strong>Brief length:</strong> {briefText.trim().length} characters
            </p>
            <p className="m-0 line-clamp-4 text-neutral-600 dark:text-neutral-400">{briefText.trim()}</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        {step > 0 ? (
          <Button type="button" variant="outline" onClick={goBack} disabled={submitting}>
            Back
          </Button>
        ) : null}
        {step < 2 ? (
          <Button type="button" onClick={goNext} disabled={submitting || (step === 0 && !briefOk)}>
            Next
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => {
              if (executionMode === "simulator" && showDemoModeCallout) {
                showToast("err", "Use Start simulator create or Try it live on the demo panel above for simulator/live paths.");

                return;
              }

              void submitRun();
            }}
            disabled={submitting || blocksLlmExecution}
            data-testid="quick-review-start"
          >
            Start Architecture Review
          </Button>
        )}
      </div>
      </div>

      <aside className="hidden lg:block">
        <WizardPackagePreview systemName={displaySystemName} hasEvidence={evidenceAttached} />
      </aside>
    </div>
  );
}

/**
 * Toggle at the top of `/reviews/new`: Quick review (default) vs full detailed wizard (existing client).
 */
export function ReviewsNewPathSwitcher() {
  const searchParams = useSearchParams();
  const baselineFirst = searchParams?.get("baseline") === "1";
  const [pathMode, setPathMode] = useState<ReviewsNewPathMode>("quick-review");
  const [ready, setReady] = useState(false);
  const [tourActive, setTourActive] = useState(false);

  useEffect(() => {
    const activeTour = readBuyerCtoDemoTourActive();
    setTourActive(activeTour);

    if (baselineFirst) {
      setPathMode("detailed");
      persistPathMode("detailed");
    } else if (activeTour) {
      setPathMode("quick-review");
      persistPathMode("quick-review");
    } else {
      setPathMode(readStoredPathMode());
    }

    setReady(true);
  }, [baselineFirst]);

  const selectQuick = () => {
    setPathMode("quick-review");
    persistPathMode("quick-review");
  };

  const selectGuidedIntake = () => {
    setPathMode("guided-intake");
    persistPathMode("guided-intake");
  };

  const selectDetailed = () => {
    setPathMode("detailed");
    persistPathMode("detailed");
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <Suspense fallback={null}>
        <NewReviewIntentCallout />
      </Suspense>
      {ready ? (
        tourActive ? (
          <details className="rounded-lg border border-neutral-200/80 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
            <summary
              className="cursor-pointer select-none text-sm font-medium text-neutral-700 dark:text-neutral-300"
              data-testid="reviews-new-other-paths-disclosure"
            >
              {REVIEWS_NEW_OTHER_PATHS_DISCLOSURE}
            </summary>
            <div
              className="mt-3 flex flex-wrap gap-2"
              role="tablist"
              aria-label="Review creation path"
              data-testid="reviews-new-path-toggle"
            >
              <Button
                type="button"
                role="tab"
                aria-selected={pathMode === "guided-intake"}
                variant={pathMode === "guided-intake" ? "default" : "outline"}
                className="min-w-[10rem]"
                onClick={selectGuidedIntake}
                data-testid="reviews-new-path-guided-intake"
              >
                Guided intake
              </Button>
              <Button
                type="button"
                role="tab"
                aria-selected={pathMode === "detailed"}
                variant={pathMode === "detailed" ? "default" : "outline"}
                className="min-w-[10rem]"
                onClick={selectDetailed}
                data-testid="reviews-new-path-detailed"
              >
                Full guided review
              </Button>
            </div>
          </details>
        ) : (
          <div
            className="flex flex-wrap gap-2 rounded-lg border border-neutral-200/80 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40"
            role="tablist"
            aria-label="Review creation path"
            data-testid="reviews-new-path-toggle"
          >
            <Button
              type="button"
              role="tab"
              aria-selected={pathMode === "quick-review"}
              variant={pathMode === "quick-review" ? "default" : "outline"}
              className="min-w-[10rem]"
              onClick={selectQuick}
              data-testid="reviews-new-path-quick"
            >
              Quick review
            </Button>
            <Button
              type="button"
              role="tab"
              aria-selected={pathMode === "guided-intake"}
              variant={pathMode === "guided-intake" ? "default" : "outline"}
              className="min-w-[10rem]"
              onClick={selectGuidedIntake}
              data-testid="reviews-new-path-guided-intake"
            >
              Guided intake
            </Button>
            <Button
              type="button"
              role="tab"
              aria-selected={pathMode === "detailed"}
              variant={pathMode === "detailed" ? "default" : "outline"}
              className="min-w-[10rem]"
              onClick={selectDetailed}
              data-testid="reviews-new-path-detailed"
            >
              Full guided review
            </Button>
          </div>
        )
      ) : null}
      {ready ? (
        <p className="text-sm text-neutral-600 dark:text-neutral-400" data-testid="reviews-new-path-hint">
          {REVIEWS_NEW_PATH_HINTS[pathMode]}
        </p>
      ) : null}
      {ready ? <ReviewPathTimeEstimateBanner pathId={pathMode} /> : null}
      {ready ? null : (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading…</p>
      )}
      {!ready ? null : tourActive || pathMode === "quick-review" ? (
        <QuickReviewWizard />
      ) : pathMode === "guided-intake" ? (
        <SocraticIntakeWizard />
      ) : (
        <NewRunWizardClient />
      )}
    </div>
  );
}

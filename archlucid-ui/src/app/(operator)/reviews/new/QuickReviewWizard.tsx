"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createArchitectureRun } from "@/lib/api";
import type { CreateArchitectureRunRequestPayload } from "@/lib/api";
import { recordFirstTenantFunnelEvent } from "@/lib/first-tenant-funnel-telemetry";
import { getEffectiveBrowserProxyScopeHeaders } from "@/lib/operator-scope-storage";
import { showError, showSuccess } from "@/lib/toast";

import { NewRunWizardClient } from "./NewRunWizardClient";

/** Persisted when the operator switches paths; missing key defaults to Quick review (onboarding-friendly). */
const REVIEWS_NEW_PATH_STORAGE_KEY = "archlucid_reviews_new_path_v1";

/** Contoso Retail / Order Management sample (same narrative as documentation presets). */
export const CONTOSO_RETAIL_SAMPLE_BRIEF =
  "Assess a lift-and-shift and selective replatform of the Contoso Order Management 3-tier web application from on-premises datacenters to Azure. Current state: IIS / .NET workloads, SQL Server on-prem clustering, Redis-like session/cache tier, file shares for batch drops. Target: Azure App Service (Linux or Windows containers) for web and API tiers, Azure SQL Database (Business Critical or General Purpose with zone redundancy where approved), Azure Cache for Redis for session/cache, private connectivity via Virtual Network integration and Private Link to PaaS. Business requires 99.95% availability for the storefront path during cutover windows, predictable monthly spend under stakeholder-approved limits, GDPR-aligned retention for EU customer subsets, baseline PCI-DSS segmentation for payment-adjacent components, TLS 1.2+ everywhere, encryption at rest for SQL and Redis, centralized secrets in Key Vault, and auditable deployment and change records.";

const MIN_BRIEF_CHARS = 100;

const QUICK_REVIEW_STEPS = [
  { label: "Paste your architecture brief", description: "Free text — we send it as the run description." },
  { label: "Review scope", description: "Confirm workspace scope and optional title." },
  { label: "Confirm and run", description: "Create the request and open pipeline progress." },
] as const;

function readStoredPathMode(): "quick-review" | "detailed" {
  if (typeof window === "undefined") {
    return "quick-review";
  }

  try {
    const raw = window.localStorage.getItem(REVIEWS_NEW_PATH_STORAGE_KEY);

    if (raw === "detailed" || raw === "quick-review") {
      return raw;
    }
  } catch {
    /* ignore */
  }

  return "quick-review";
}

function persistPathMode(mode: "quick-review" | "detailed"): void {
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
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [briefText, setBriefText] = useState("");
  const [runTitle, setRunTitle] = useState("");
  const [scope, setScope] = useState<Record<string, string> | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const briefOk = briefText.trim().length >= MIN_BRIEF_CHARS;

  useEffect(() => {
    if (step !== 1) {
      return;
    }

    setScope(getEffectiveBrowserProxyScopeHeaders());
  }, [step]);

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

  const useSampleBrief = () => {
    setBriefText(CONTOSO_RETAIL_SAMPLE_BRIEF);
  };

  const submitRun = async () => {
    if (!briefOk) {
      showToast("err", `Brief must be at least ${MIN_BRIEF_CHARS} characters.`);

      return;
    }

    setSubmitting(true);

    try {
      const body = buildQuickReviewPayload(briefText, runTitle.trim());
      const res = await createArchitectureRun(body);
      const id = res.run?.runId ?? null;

      if (!id) {
        showToast("err", "API returned no run id.");

        return;
      }

      recordFirstTenantFunnelEvent("first_run_started");
      showToast("ok", `Run ${id} created — opening pipeline.`);

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
    <div className="mx-auto w-full max-w-4xl space-y-4 pb-36">
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
              Include goals, constraints, and context so the run has enough to work with. Minimum {MIN_BRIEF_CHARS}{" "}
              characters.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="quick-review-brief">Architecture brief</Label>
              <Textarea
                id="quick-review-brief"
                value={briefText}
                onChange={(e) => {
                  setBriefText(e.target.value);
                }}
                className="min-h-[220px] font-mono text-sm"
                placeholder="Example: Document the target architecture for a customer-facing retail API on Azure — App Service for APIs, Azure SQL for orders, Redis cache, PCI-scoped segregation for payment-adjacent flows, 99.9% availability during peak, EU data residency for profiles, and a phased cutover from the current on-prem monolith…"
                aria-describedby="quick-review-brief-hint"
                autoComplete="off"
              />
              <p id="quick-review-brief-hint" className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
                {briefText.trim().length}/{MIN_BRIEF_CHARS} characters minimum. Paste an executive summary or detailed
                brief — it becomes the run description sent to the API.
              </p>
            </div>
            <Button type="button" variant="secondary" onClick={useSampleBrief} data-testid="quick-review-sample-brief">
              Use sample brief (Contoso Retail)
            </Button>
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
                If empty, the run uses “{displaySystemName}” as the system name.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card>
          <CardHeader>
            <CardTitle>Confirm and run</CardTitle>
            <CardDescription>This creates a new architecture run with your pasted brief.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
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
              void submitRun();
            }}
            disabled={submitting}
            data-testid="quick-review-start"
          >
            Start review
          </Button>
        )}
      </div>

    </div>
  );
}

/**
 * Toggle at the top of `/reviews/new`: Quick review (default) vs full detailed wizard (existing client).
 */
export function ReviewsNewPathSwitcher() {
  const [pathMode, setPathMode] = useState<"quick-review" | "detailed">("quick-review");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPathMode(readStoredPathMode());
    setReady(true);
  }, []);

  const selectQuick = () => {
    setPathMode("quick-review");
    persistPathMode("quick-review");
  };

  const selectDetailed = () => {
    setPathMode("detailed");
    persistPathMode("detailed");
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      {ready ? (
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
            aria-selected={pathMode === "detailed"}
            variant={pathMode === "detailed" ? "default" : "outline"}
            className="min-w-[10rem]"
            onClick={selectDetailed}
            data-testid="reviews-new-path-detailed"
          >
            Detailed wizard
          </Button>
        </div>
      ) : (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading…</p>
      )}
      {!ready ? null : pathMode === "quick-review" ? <QuickReviewWizard /> : <NewRunWizardClient />}
    </div>
  );
}

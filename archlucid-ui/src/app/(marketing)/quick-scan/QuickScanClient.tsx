"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useState, type ReactElement } from "react";

import { QuickScanEvidenceOrientationStrip } from "@/components/marketing/QuickScanEvidenceOrientationStrip";
import { findingSeverityLabel } from "@/lib/findings/finding-severity-label";
import {
  isQuickScanAiSubmitAllowed,
  resolveQuickScanCapacityMessage,
  shouldOfferQuickScanSample,
} from "@/lib/quick-scan/quick-scan-capacity-state";
import { QUICK_SCAN_RECEIVE_ITEMS } from "@/lib/quick-scan/quick-scan-constants";
import { QUICK_SCAN_EXAMPLE_FORM } from "@/lib/quick-scan/quick-scan-example";
import {
  trackQuickScanConversionClick,
  trackQuickScanSampleViewed,
} from "@/lib/quick-scan/quick-scan-telemetry";
import type { QuickScanResponse, QuickScanStatusResponse } from "@/lib/quick-scan/quick-scan-types";
import {
  buildQuickScanRequestBody,
  quickScanIncompleteReason,
  validateQuickScanForm,
  type QuickScanFormValues,
} from "@/lib/quick-scan/quick-scan-validation";

import { QuickScanForm } from "./QuickScanForm";

const SESSION_STORAGE_KEY = "al_quick_scan_session";
const BROWSER_STORAGE_KEY = "al_quick_scan_browser";

function ensureSessionId(): string {
  if (typeof window === "undefined") {
    return "server";
  }

  const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);

  if (existing && existing.trim().length > 0) {
    return existing;
  }

  const created = crypto.randomUUID();
  window.localStorage.setItem(SESSION_STORAGE_KEY, created);

  return created;
}

function ensureBrowserId(): string {
  if (typeof window === "undefined") {
    return "server";
  }

  const existing = window.localStorage.getItem(BROWSER_STORAGE_KEY);

  if (existing && existing.trim().length > 0) {
    return existing;
  }

  const created = crypto.randomUUID();
  window.localStorage.setItem(BROWSER_STORAGE_KEY, created);

  return created;
}

function tryReadErrorCode(body: string): string | null {
  if (body.trim().length === 0) {
    return null;
  }

  try {
    const parsed = JSON.parse(body) as { errorCode?: unknown; extensions?: { errorCode?: unknown } };
    const direct = typeof parsed.errorCode === "string" ? parsed.errorCode : null;
    const nested =
      parsed.extensions && typeof parsed.extensions.errorCode === "string" ? parsed.extensions.errorCode : null;

    return direct ?? nested;
  } catch {
    return null;
  }
}

function tryReadProblemDetail(body: string): string | null {
  if (body.trim().length === 0) {
    return null;
  }

  try {
    const parsed = JSON.parse(body) as { detail?: unknown };

    return typeof parsed.detail === "string" && parsed.detail.trim().length > 0 ? parsed.detail : null;
  } catch {
    return null;
  }
}

function environmentLabel(value: string): string {
  const labels: Record<string, string> = {
    Azure: "Azure",
    AWS: "AWS",
    GoogleCloud: "Google Cloud",
    Multicloud: "Multicloud",
    HybridCloud: "Hybrid cloud",
    OnPremises: "On-premises",
    ProviderNeutral: "Provider-neutral",
    Other: "Other",
    NotSure: "Not sure",
  };

  return labels[value] ?? value;
}

/**
 * No-sign-in Quick Scan: POST /v1/marketing/quick-scan via same-origin proxy (no privileged bearer).
 */
export function QuickScanClient(): ReactElement {
  const statusRegionId = useId();
  const [formValues, setFormValues] = useState<QuickScanFormValues>({
    systemName: "",
    primaryEnvironment: "",
    primaryEnvironmentOther: "",
    description: "",
    architectureConcerns: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capacityMessage, setCapacityMessage] = useState<string | null>(null);
  const [result, setResult] = useState<QuickScanResponse | null>(null);
  const [status, setStatus] = useState<QuickScanStatusResponse | null>(null);

  const fieldErrors = useMemo(() => validateQuickScanForm(formValues), [formValues]);
  const incompleteReason = useMemo(() => quickScanIncompleteReason(fieldErrors), [fieldErrors]);
  const canSubmit = incompleteReason === null && !submitting && isQuickScanAiSubmitAllowed(status);
  const aiSubmitBlocked = incompleteReason === null && !submitting && !isQuickScanAiSubmitAllowed(status);
  const capacityState = status?.capacityState ?? "unknown";
  const submitBlockedMessage =
    capacityMessage ?? resolveQuickScanCapacityMessage(status) ?? "Quick Scan is not accepting new AI analyses right now.";

  const loadSampleResult = useCallback(async (sourceState: string) => {
    const response = await fetch(
      `/api/proxy/v1/marketing/quick-scan/sample?sourceState=${encodeURIComponent(sourceState)}`,
      {
        credentials: "include",
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error("Quick Scan sample could not be loaded.");
    }

    return (await response.json()) as QuickScanResponse;
  }, []);

  const showSampleResult = useCallback(
    (sourceState: string) => {
      void (async () => {
        try {
          const sample = await loadSampleResult(sourceState);
          setResult(sample);
          setError(null);
          setStatusMessage("Showing a labeled sample Quick Scan result.");
          trackQuickScanSampleViewed(sourceState);
        } catch (sampleError: unknown) {
          const message =
            sampleError instanceof Error && sampleError.message.trim().length > 0
              ? sampleError.message
              : "Quick Scan sample could not be loaded.";

          setError(message);
        }
      })();
    },
    [loadSampleResult],
  );

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/proxy/v1/marketing/quick-scan/status", {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const body = (await response.json()) as QuickScanStatusResponse;
        setStatus(body);

        const message = resolveQuickScanCapacityMessage(body);

        if (message !== null) {
          setCapacityMessage(message);
        }

        if (body.capacityState === "SampleOnly" && body.sampleResultAvailable) {
          showSampleResult("SampleOnly");
        }
      } catch {
        /* ignore — form still works with server-side enforcement */
      }
    })();
  }, [showSampleResult]);

  const loadExample = useCallback(() => {
    setFormValues({ ...QUICK_SCAN_EXAMPLE_FORM });
    setError(null);
    setStatusMessage("Example loaded. Review the fields, then choose Analyze architecture when ready.");
  }, []);

  const onSubmit = useCallback(async () => {
    const errors = validateQuickScanForm(formValues);

    if (quickScanIncompleteReason(errors) !== null) {
      setError(quickScanIncompleteReason(errors));
      return;
    }

    if (!isQuickScanAiSubmitAllowed(status)) {
      setCapacityMessage(resolveQuickScanCapacityMessage(status));
      setError("Quick Scan is not accepting new AI analyses right now.");
      return;
    }

    setError(null);
    setCapacityMessage(null);
    setSubmitting(true);
    setStatusMessage("Analyzing architecture…");

    try {
      const sessionId = ensureSessionId();
      const browserId = ensureBrowserId();
      const response = await fetch("/api/proxy/v1/marketing/quick-scan", {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-Quick-Scan-Session": sessionId,
          "X-Quick-Scan-Browser": browserId,
        },
        cache: "no-store",
        body: JSON.stringify(buildQuickScanRequestBody(formValues)),
      });

      const text = await response.text();
      const problemDetail = tryReadProblemDetail(text);
      const errorCode = tryReadErrorCode(text);

      if (response.status === 503 || response.status === 429) {
        setCapacityMessage(
          problemDetail ?? resolveQuickScanCapacityMessage(status) ?? "Quick Scan is temporarily unavailable.",
        );
        throw new Error(problemDetail ?? "Quick Scan is temporarily unavailable.");
      }

      if (response.status === 403) {
        if (errorCode === "QUICK_SCAN_CAPTCHA_REQUIRED") {
          throw new Error(problemDetail ?? "Complete the security check to continue with Quick Scan.");
        }

        throw new Error(problemDetail ?? "Additional Quick Scan attempts require sign-in.");
      }

      if (!response.ok) {
        throw new Error(text.length > 0 ? "Quick Scan could not be completed." : `Quick Scan failed (HTTP ${String(response.status)})`);
      }

      const data = JSON.parse(text) as QuickScanResponse;
      setResult(data);
      setStatusMessage("Analysis complete.");
    } catch (submitError: unknown) {
      const message =
        submitError instanceof Error && submitError.message.trim().length > 0
          ? submitError.message
          : "Quick Scan could not be completed.";

      setError(message);
      setStatusMessage(null);
    } finally {
      setSubmitting(false);
    }
  }, [formValues, status]);

  const onConversionClick = useCallback(
    (action: "sign-in" | "demo" | "workspace") => {
      trackQuickScanConversionClick(action, capacityState);
    },
    [capacityState],
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-12">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
        <div className="min-w-0 space-y-6">
          <header>
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Quick scan</h1>
            <p className="mt-3 max-w-2xl text-base text-neutral-700 dark:text-neutral-300">
              Describe a system and receive a concise architecture risk and improvement summary. No account required.
            </p>
            <p className="mt-2 max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">
              Quick Scan is a limited demonstration and is not saved as a workspace review.
            </p>
          </header>

          <QuickScanEvidenceOrientationStrip />

          <QuickScanForm
            values={formValues}
            fieldErrors={fieldErrors}
            disabled={submitting}
            onChange={setFormValues}
          />

          <section aria-labelledby="quick-scan-privacy-heading" className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900/40">
            <h2 id="quick-scan-privacy-heading" className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              Privacy and data handling
            </h2>
            <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
              Your description is sent to an AI provider to generate this demonstration and is not stored as a workspace
              review. Temporary security logs (IP address, request metadata, and token usage) may be retained briefly for
              abuse prevention. ArchLucid does not use Quick Scan submissions to train models. Do not submit secrets,
              credentials, personal health information, or other regulated data.
            </p>
            <p className="mt-2 text-sm">
              <Link href="/help/data-handling" className="font-medium text-sky-700 underline dark:text-sky-400">
                Read our data handling guide
              </Link>
              {" · "}
              <Link href="/help/security-trust" className="font-medium text-sky-700 underline dark:text-sky-400">
                Security overview
              </Link>
            </p>
          </section>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => {
                void onSubmit();
              }}
              data-testid="quick-scan-submit"
              className="rounded-md bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-neutral-400 dark:bg-sky-500 dark:hover:bg-sky-600"
            >
              {submitting ? "Analyzing architecture…" : "Analyze architecture"}
            </button>
            <button
              type="button"
              onClick={loadExample}
              disabled={submitting}
              data-testid="quick-scan-use-example"
              className="rounded-md border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-100 disabled:opacity-60 dark:border-neutral-600 dark:text-neutral-100 dark:hover:bg-neutral-900"
            >
              Use an example
            </button>
            {!canSubmit && incompleteReason !== null ? (
              <p className="text-sm text-neutral-600 dark:text-neutral-400" role="status">
                {incompleteReason}
              </p>
            ) : null}
            {aiSubmitBlocked ? (
              <p className="text-sm text-amber-900 dark:text-amber-100" role="status" data-testid="quick-scan-submit-blocked">
                {submitBlockedMessage}
              </p>
            ) : null}
          </div>

          {shouldOfferQuickScanSample(status) ? (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Prefer to explore a prebuilt sample without running an AI analysis?{" "}
              <button
                type="button"
                onClick={() => {
                  showSampleResult(capacityState);
                }}
                className="font-medium text-sky-700 underline dark:text-sky-400"
              >
                View the interactive sample
              </button>
              {" · "}
              <Link
                href="/get-started"
                className="font-medium text-sky-700 underline dark:text-sky-400"
                onClick={() => {
                  onConversionClick("demo");
                }}
              >
                Start a guided demo
              </Link>
            </p>
          ) : null}

          <div id={statusRegionId} role="status" aria-live="polite" className="sr-only">
            {statusMessage}
          </div>

          {capacityMessage !== null ? (
            <div className="rounded-md border border-amber-500/40 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-100">
              <p>{capacityMessage}</p>
              {shouldOfferQuickScanSample(status) ? (
                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      showSampleResult(capacityState);
                    }}
                    className="font-medium underline"
                  >
                    View a sample result
                  </button>
                  <Link
                    href="/auth/signin"
                    className="font-medium underline"
                    onClick={() => {
                      onConversionClick("sign-in");
                    }}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/contact"
                    className="font-medium underline"
                    onClick={() => {
                      onConversionClick("demo");
                    }}
                  >
                    Request a demonstration
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}

          {error !== null ? (
            <p role="alert" className="rounded-md border border-rose-600/40 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-700/50 dark:bg-rose-950/30 dark:text-rose-100">
              {error}
            </p>
          ) : null}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-8 lg:self-start">
          <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-950">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">What you will receive</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-700 dark:text-neutral-300">
              {QUICK_SCAN_RECEIVE_ITEMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
              Results are illustrative and do not replace a complete, evidence-backed ArchLucid review.
            </p>
          </section>

          <section className="rounded-lg border border-dashed border-neutral-300 p-5 dark:border-neutral-600">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Demonstration limits</h2>
            <ul className="mt-3 space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
              <li>Single-pass analysis with a concise output cap</li>
              <li>No workspace persistence or governance workflow</li>
              <li>Daily demonstration capacity may apply</li>
            </ul>
          </section>
        </aside>
      </div>

      {result !== null ? (
        <section className="space-y-6 border-t border-neutral-200 pt-8 dark:border-neutral-800" data-testid="quick-scan-results" aria-label="Quick scan results">
          <header className="space-y-2">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">Analysis result</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {result.systemName} · {environmentLabel(result.primaryEnvironment)}
            </p>
            {result.isSampleResult ? (
              <p className="rounded-md border border-amber-500/40 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-100">
                Illustrative sample only — this is not an analysis of your submission.
              </p>
            ) : null}
            {result.demonstrationDisclaimer ? (
              <p className="rounded-md bg-neutral-100 px-3 py-2 text-sm text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
                {result.demonstrationDisclaimer}
              </p>
            ) : null}
          </header>

          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Overall summary</h3>
            <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">{result.summary}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Highest-priority risks</h3>
            <ul className="mt-3 space-y-3">
              {(result.findings ?? []).map((finding) => (
                <li
                  key={`${finding.title}:${finding.description}`}
                  data-testid="quick-scan-finding-card"
                  className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950"
                >
                  <div className="font-medium text-neutral-900 dark:text-neutral-50">{finding.title}</div>
                  <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    {findingSeverityLabel(finding.severity)}
                  </div>
                  <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">{finding.description}</p>
                </li>
              ))}
            </ul>
          </div>

          {(result.positiveObservations?.length ?? 0) > 0 ? (
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Positive observations</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-700 dark:text-neutral-300">
                {result.positiveObservations?.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {(result.recommendedNextSteps?.length ?? 0) > 0 ? (
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Recommended next steps</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-700 dark:text-neutral-300">
                {result.recommendedNextSteps?.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Link
              href="/architecture/reviews/new"
              className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 dark:bg-sky-500"
              onClick={() => {
                onConversionClick("workspace");
              }}
            >
              Start a full review
            </Link>
            <Link
              href="/get-started"
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-100"
              onClick={() => {
                onConversionClick("workspace");
              }}
            >
              Create a workspace review
            </Link>
            <Link
              href="/contact"
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-100"
              onClick={() => {
                onConversionClick("demo");
              }}
            >
              Request a demo
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}

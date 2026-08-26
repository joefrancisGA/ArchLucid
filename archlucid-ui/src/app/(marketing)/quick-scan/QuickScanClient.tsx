"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent, type ReactElement } from "react";

import {
  QUICK_SCAN_ANALYSIS_TYPICAL_DURATION,
  QUICK_SCAN_FORM_ID,
  QUICK_SCAN_HERO_LEAD,
  QUICK_SCAN_LAST_REVIEWED_LABEL,
  QUICK_SCAN_PAGE_TITLE,
  QUICK_SCAN_PRIMARY_CONTENT_ID,
} from "@/app/(marketing)/quick-scan/quick-scan-page-content";
import { QuickScanForm, type QuickScanFormFieldName } from "@/app/(marketing)/quick-scan/QuickScanForm";
import {
  ensureBrowserId,
  ensureSessionId,
  environmentLabel,
  filterVisibleFieldErrors,
  tryReadErrorCode,
  tryReadProblemDetail,
} from "@/app/(marketing)/quick-scan/quick-scan-session";
import { SeeItDeliverablePreview } from "@/app/(marketing)/see-it/SeeItDeliverablePreview";
import { QuickScanEvidenceOrientationStrip } from "@/components/marketing/QuickScanEvidenceOrientationStrip";
import { QuickScanScopeDisclosure } from "@/components/marketing/quick-scan/QuickScanScopeDisclosure";
import { TrustCenterRevisionHistory } from "@/components/marketing/trust-center/TrustCenterRevisionHistory";
import { Button } from "@/components/ui/button";
import { useQuickScanStatusQuery } from "@/hooks/use-quick-scan-status-query";
import { DESIGN_TOKENS, MARKETING_MOTION, MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { findingSeverityLabel } from "@/lib/findings/finding-severity-label";
import {
  isQuickScanAiSubmitAllowed,
  resolveQuickScanCapacityMessage,
  shouldOfferQuickScanSample,
} from "@/lib/quick-scan/quick-scan-capacity-state";
import { QUICK_SCAN_RECEIVE_ITEMS } from "@/lib/quick-scan/quick-scan-constants";
import { QUICK_SCAN_EXAMPLE_FORM } from "@/lib/quick-scan/quick-scan-example";
import { QUICK_SCAN_REVISION_HISTORY } from "@/lib/quick-scan-marketing-revision-history";
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
import { TRUST_CENTER_PUBLIC_EVIDENCE_VERSION } from "@/lib/trust-center-buyer-content";
import { TRUST_CENTER_PUBLIC_LAYOUT } from "@/lib/trust-center-public-layout";
import { cn } from "@/lib/utils";

/**
 * No-sign-in Quick Scan: POST /v1/marketing/quick-scan via same-origin proxy (no privileged bearer).
 */
export function QuickScanClient(): ReactElement {
  const statusRegionId = useId();
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [formValues, setFormValues] = useState<QuickScanFormValues>({
    systemName: "",
    primaryEnvironment: "",
    primaryEnvironmentOther: "",
    description: "",
    architectureConcerns: [],
  });
  const [touchedFields, setTouchedFields] = useState<ReadonlySet<QuickScanFormFieldName>>(new Set());
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capacityMessage, setCapacityMessage] = useState<string | null>(null);
  const [result, setResult] = useState<QuickScanResponse | null>(null);
  const { data: statusQueryData } = useQuickScanStatusQuery();
  const status = statusQueryData ?? null;

  const fieldErrors = useMemo(() => validateQuickScanForm(formValues), [formValues]);
  const visibleFieldErrors = useMemo(
    () => filterVisibleFieldErrors(fieldErrors, touchedFields, attemptedSubmit),
    [fieldErrors, touchedFields, attemptedSubmit],
  );
  const incompleteReason = useMemo(() => quickScanIncompleteReason(fieldErrors), [fieldErrors]);
  const canSubmit = incompleteReason === null && !submitting && isQuickScanAiSubmitAllowed(status);
  const aiSubmitBlocked = incompleteReason === null && !submitting && !isQuickScanAiSubmitAllowed(status);
  const capacityState = status?.capacityState ?? "unknown";
  const submitBlockedMessage =
    capacityMessage ?? resolveQuickScanCapacityMessage(status) ?? "Quick Scan is not accepting new AI analyses right now.";

  const focusResults = useCallback(() => {
    const heading = resultsHeadingRef.current;

    if (heading === null) {
      return;
    }

    heading.focus({ preventScroll: true });
    heading.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

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
    if (result === null) {
      return;
    }

    focusResults();
  }, [result, focusResults]);

  useEffect(() => {
    if (status === null) {
      return;
    }

    const message = resolveQuickScanCapacityMessage(status);

    if (message !== null) {
      setCapacityMessage(message);
    }

    if (status.capacityState === "SampleOnly" && status.sampleResultAvailable) {
      showSampleResult("SampleOnly");
    }
  }, [showSampleResult, status]);

  const markFieldTouched = useCallback((fieldName: QuickScanFormFieldName) => {
    setTouchedFields((previous) => {
      if (previous.has(fieldName)) {
        return previous;
      }

      const next = new Set(previous);
      next.add(fieldName);

      return next;
    });
  }, []);

  const loadExample = useCallback(() => {
    setFormValues({ ...QUICK_SCAN_EXAMPLE_FORM });
    setError(null);
    setStatusMessage("Example loaded. Review the fields, then choose Analyze architecture when ready.");
    setTouchedFields(new Set(["systemName", "primaryEnvironment", "description"]));
  }, []);

  const cancelSubmit = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setSubmitting(false);
    setStatusMessage("Analysis cancelled.");
  }, []);

  const onSubmit = useCallback(async () => {
    const errors = validateQuickScanForm(formValues);
    setAttemptedSubmit(true);

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
    setStatusMessage(`Analyzing architecture… ${QUICK_SCAN_ANALYSIS_TYPICAL_DURATION}`);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const sessionId = ensureSessionId();
      const browserId = ensureBrowserId();
      const response = await fetch("/api/proxy/v1/marketing/quick-scan", {
        method: "POST",
        credentials: "include",
        signal: abortController.signal,
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
      if (submitError instanceof Error && submitError.name === "AbortError") {
        return;
      }

      const message =
        submitError instanceof Error && submitError.message.trim().length > 0
          ? submitError.message
          : "Quick Scan could not be completed.";

      setError(message);
      setStatusMessage(null);
    } finally {
      abortControllerRef.current = null;
      setSubmitting(false);
    }
  }, [formValues, status]);

  const handleFormSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void onSubmit();
    },
    [onSubmit],
  );

  const onConversionClick = useCallback(
    (action: "sign-in" | "demo" | "workspace") => {
      trackQuickScanConversionClick(action, capacityState);
    },
    [capacityState],
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-12" data-testid="quick-scan-page">
      <a href={`#${QUICK_SCAN_PRIMARY_CONTENT_ID}`} className={TRUST_CENTER_PUBLIC_LAYOUT.skipLink}>
        Skip to quick scan content
      </a>

      <section
        className={cn(
          "grid items-start gap-10 border-b border-neutral-200 pb-8 dark:border-neutral-800 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-12",
          MARKETING_MOTION.revealIn,
        )}
        data-testid="quick-scan-hero"
        aria-labelledby="quick-scan-hero-heading"
      >
        <div>
          <h1 id="quick-scan-hero-heading" className={MARKETING_TYPOGRAPHY.heroTitle}>
            {QUICK_SCAN_PAGE_TITLE}
          </h1>
          <p className={cn("mt-4 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>{QUICK_SCAN_HERO_LEAD}</p>
        </div>

        <SeeItDeliverablePreview />
      </section>

      <QuickScanScopeDisclosure />

      <div
        id={QUICK_SCAN_PRIMARY_CONTENT_ID}
        className="scroll-mt-24 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]"
      >
        <div className="min-w-0 space-y-6">
          <form id={QUICK_SCAN_FORM_ID} className="space-y-6" onSubmit={handleFormSubmit} noValidate>
            <QuickScanForm
              values={formValues}
              fieldErrors={visibleFieldErrors}
              disabled={submitting}
              onChange={setFormValues}
              onFieldBlur={markFieldTouched}
            />

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" variant="primary" disabled={!canSubmit} data-testid="quick-scan-submit">
                {submitting ? "Analyzing architecture…" : "Analyze architecture"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={loadExample}
                disabled={submitting}
                data-testid="quick-scan-use-example"
              >
                Use an example
              </Button>
              {submitting ? (
                <Button type="button" variant="outline" onClick={cancelSubmit} data-testid="quick-scan-cancel">
                  Cancel analysis
                </Button>
              ) : null}
              {!canSubmit && incompleteReason !== null ? (
                <p className={MARKETING_TYPOGRAPHY.meta} role="status">
                  {incompleteReason}
                </p>
              ) : null}
              {aiSubmitBlocked ? (
                <p className={MARKETING_TYPOGRAPHY.meta} role="status" data-testid="quick-scan-submit-blocked">
                  {submitBlockedMessage}
                </p>
              ) : null}
            </div>

            {submitting ? (
              <p className={MARKETING_TYPOGRAPHY.meta} role="status" data-testid="quick-scan-progress">
                {statusMessage}
              </p>
            ) : null}

            {shouldOfferQuickScanSample(status) ? (
              <p className={MARKETING_TYPOGRAPHY.meta}>
                Prefer to explore a prebuilt sample without running an AI analysis?{" "}
                <button
                  type="button"
                  onClick={() => {
                    showSampleResult(capacityState);
                  }}
                  className={MARKETING_SURFACES.inlineLink}
                >
                  View the interactive sample
                </button>
                {" · "}
                <Link
                  href="/get-started"
                  className={MARKETING_SURFACES.inlineLink}
                  onClick={() => {
                    onConversionClick("demo");
                  }}
                >
                  Start a guided demo
                </Link>
              </p>
            ) : null}
          </form>

          <details className={TRUST_CENTER_PUBLIC_LAYOUT.vocabularyDisclosure} data-testid="quick-scan-privacy-disclosure">
            <summary className={TRUST_CENTER_PUBLIC_LAYOUT.vocabularySummary}>Privacy and data handling</summary>
            <div className={TRUST_CENTER_PUBLIC_LAYOUT.vocabularyBody}>
              <p className={cn("m-0 text-al-text-secondary", TRUST_CENTER_PUBLIC_LAYOUT.vocabularyIntro)}>
                Your description is sent to an AI provider to generate this demonstration and is not stored as a workspace
                review. Temporary security logs (IP address, request metadata, and token usage) may be retained briefly for
                abuse prevention. ArchLucid does not use Quick Scan submissions to train models. Do not submit secrets,
                credentials, personal health information, or other regulated data.
              </p>
              <p className={cn("m-0 mt-3", MARKETING_TYPOGRAPHY.body)}>
                <Link href="/help/data-handling" className={MARKETING_SURFACES.inlineLink}>
                  Read our data handling guide
                </Link>
                {" · "}
                <Link href="/help/security-trust" className={MARKETING_SURFACES.inlineLink}>
                  Security overview
                </Link>
              </p>
            </div>
          </details>

          <div id={statusRegionId} role="status" aria-live="polite" className={submitting ? MARKETING_TYPOGRAPHY.meta : "sr-only"}>
            {statusMessage}
          </div>

          {capacityMessage !== null ? (
            <div className={cn(DESIGN_TOKENS.callout.warn, "p-4")}>
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
            <p role="alert" className={DESIGN_TOKENS.callout.blocked}>
              {error}
            </p>
          ) : null}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-8 lg:self-start">
          <section className={MARKETING_SURFACES.cardComfort}>
            <h2 className={MARKETING_TYPOGRAPHY.cardTitle}>What you will receive</h2>
            <ul className={cn("mt-3 list-disc space-y-2 pl-5", MARKETING_TYPOGRAPHY.body)}>
              {QUICK_SCAN_RECEIVE_ITEMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className={cn(MARKETING_SURFACES.mutedPanel, "border border-dashed border-neutral-300 dark:border-neutral-600")}>
            <h2 className={MARKETING_TYPOGRAPHY.cardTitle}>Demonstration limits</h2>
            <ul className={cn("mt-3 space-y-2", MARKETING_TYPOGRAPHY.body)}>
              <li>Single-pass analysis with a concise output cap</li>
              <li>No workspace persistence or approval workflow</li>
              <li>Daily demonstration capacity may apply</li>
            </ul>
          </section>
        </aside>
      </div>

      {result !== null ? (
        <section
          className="space-y-6 border-t border-neutral-200 pt-8 dark:border-neutral-800"
          data-testid="quick-scan-results"
          aria-label="Quick scan results"
        >
          <header className="space-y-2">
            <h2
              ref={resultsHeadingRef}
              tabIndex={-1}
              className={cn(MARKETING_TYPOGRAPHY.sectionTitle, "scroll-mt-24 outline-none")}
            >
              Analysis result
            </h2>
            <p className={MARKETING_TYPOGRAPHY.meta}>
              {result.systemName} · {environmentLabel(result.primaryEnvironment)}
            </p>
            {result.isSampleResult ? (
              <p className={DESIGN_TOKENS.callout.warn}>
                Illustrative sample only — this is not an analysis of your submission.
              </p>
            ) : null}
            {result.demonstrationDisclaimer ? (
              <p className={cn(MARKETING_SURFACES.mutedPanel, MARKETING_TYPOGRAPHY.body)}>
                {result.demonstrationDisclaimer}
              </p>
            ) : null}
          </header>

          <div>
            <h3 className={MARKETING_TYPOGRAPHY.cardTitle}>Overall summary</h3>
            <p className={cn("mt-2", MARKETING_TYPOGRAPHY.body)}>{result.summary}</p>
          </div>

          <div>
            <h3 className={MARKETING_TYPOGRAPHY.cardTitle}>Highest-priority risks</h3>
            <ul className="mt-3 space-y-3">
              {(result.findings ?? []).map((finding) => (
                <li
                  key={`${finding.title}:${finding.description}`}
                  data-testid="quick-scan-finding-card"
                  className={MARKETING_SURFACES.cardComfort}
                >
                  <div className={MARKETING_TYPOGRAPHY.cardTitle}>{finding.title}</div>
                  <div className={MARKETING_TYPOGRAPHY.meta}>{findingSeverityLabel(finding.severity)}</div>
                  <p className={cn("mt-2", MARKETING_TYPOGRAPHY.body)}>{finding.description}</p>
                </li>
              ))}
            </ul>
          </div>

          {(result.positiveObservations?.length ?? 0) > 0 ? (
            <div>
              <h3 className={MARKETING_TYPOGRAPHY.cardTitle}>Positive observations</h3>
              <ul className={cn("mt-2 list-disc space-y-1 pl-5", MARKETING_TYPOGRAPHY.body)}>
                {result.positiveObservations?.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {(result.recommendedNextSteps?.length ?? 0) > 0 ? (
            <div>
              <h3 className={MARKETING_TYPOGRAPHY.cardTitle}>Recommended next steps</h3>
              <ul className={cn("mt-2 list-disc space-y-1 pl-5", MARKETING_TYPOGRAPHY.body)}>
                {result.recommendedNextSteps?.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button asChild variant="primary">
              <Link
                href="/get-started"
                onClick={() => {
                  onConversionClick("workspace");
                }}
              >
                Sign in to start a full review
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link
                href="/get-started"
                onClick={() => {
                  onConversionClick("workspace");
                }}
              >
                Create a workspace review
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link
                href="/contact"
                onClick={() => {
                  onConversionClick("demo");
                }}
              >
                Request a demo
              </Link>
            </Button>
          </div>
        </section>
      ) : null}

      <div className={TRUST_CENTER_PUBLIC_LAYOUT.metaRow} data-testid="quick-scan-page-meta">
        <span className={TRUST_CENTER_PUBLIC_LAYOUT.lastReviewed}>
          Last reviewed{" "}
          <time dateTime={QUICK_SCAN_LAST_REVIEWED_LABEL}>{QUICK_SCAN_LAST_REVIEWED_LABEL}</time>
        </span>
        <span className={TRUST_CENTER_PUBLIC_LAYOUT.metaSecondary}>
          Demonstration pack version {TRUST_CENTER_PUBLIC_EVIDENCE_VERSION}
        </span>
      </div>

      <TrustCenterRevisionHistory entries={QUICK_SCAN_REVISION_HISTORY} />

      <QuickScanEvidenceOrientationStrip />
    </div>
  );
}

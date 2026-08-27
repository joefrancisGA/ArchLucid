"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";

import type { QuickScanFormFieldName } from "@/app/(marketing)/quick-scan/QuickScanForm";
import {
  QUICK_SCAN_ANALYSIS_TYPICAL_DURATION,
} from "@/app/(marketing)/quick-scan/quick-scan-page-content";
import {
  ensureBrowserId,
  ensureSessionId,
  filterVisibleFieldErrors,
  tryReadErrorCode,
  tryReadProblemDetail,
} from "@/app/(marketing)/quick-scan/quick-scan-session";
import { useQuickScanStatusQuery } from "@/hooks/use-quick-scan-status-query";
import {
  isQuickScanAiSubmitAllowed,
  resolveQuickScanCapacityMessage,
} from "@/lib/quick-scan/quick-scan-capacity-state";
import { QUICK_SCAN_EXAMPLE_FORM } from "@/lib/quick-scan/quick-scan-example";
import {
  trackQuickScanConversionClick,
  trackQuickScanSampleViewed,
} from "@/lib/quick-scan/quick-scan-telemetry";
import type { QuickScanResponse } from "@/lib/quick-scan/quick-scan-types";
import {
  buildQuickScanRequestBody,
  quickScanIncompleteReason,
  validateQuickScanForm,
  type QuickScanFormValues,
} from "@/lib/quick-scan/quick-scan-validation";

export function useQuickScanClient() {
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

    if (status.capacityState === "SampleOnly" && status.sampleResultAvailable && result === null) {
      showSampleResult("SampleOnly");
    }
  }, [result, showSampleResult, status]);

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

  return {
    statusRegionId,
    resultsHeadingRef,
    formValues,
    setFormValues,
    visibleFieldErrors,
    submitting,
    statusMessage,
    error,
    capacityMessage,
    result,
    status,
    incompleteReason,
    canSubmit,
    aiSubmitBlocked,
    capacityState,
    submitBlockedMessage,
    markFieldTouched,
    loadExample,
    cancelSubmit,
    handleFormSubmit,
    showSampleResult,
    onConversionClick,
  };
}

export type QuickScanClientState = ReturnType<typeof useQuickScanClient>;

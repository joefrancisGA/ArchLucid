"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import {
  buildAdvisoryScheduleCronExpression,
  createDefaultAdvisoryScheduleFormState,
  describeAdvisoryScheduleFrequency,
  isAdvisoryScheduleFormReadyToCreate,
  resolveAdvisoryScheduleName,
  suggestedAdvisoryScheduleName,
  type AdvisoryScheduleFormState,
} from "@/lib/advisory-schedule-form";
import {
  ADVISORY_SCHEDULE_PREVIEW_DEBOUNCE_MS,
  EMPTY_ADVISORY_SCHEDULE_PREVIEW,
  loadAdvisoryScheduleUpcomingPreview,
  type AdvisorySchedulePreviewState,
} from "@/lib/advisory-schedule-upcoming-preview";
import {
  resolveAdvisoryScheduleCreateChecklistEmphasizedStepId,
  resolveAdvisoryScheduleCreateChecklistSteps,
} from "@/lib/advisory-schedule-create-checklist";
import { whyDisabledEnterpriseMutationControl } from "@/lib/why-disabled-cta";
import {
  advisorySchedulesPanelsHrefFromSearch,
  parseAdvisorySchedulesAdvancedOpenFromSearch,
} from "@/lib/advisory/advisory-schedules-panels-url";
import {
  getIanaTimeZoneSelectOptions,
} from "@/lib/iana-time-zone-select";

import type { AdvisoryScheduleCreateFormProps } from "./advisory-schedule-create-form-props";

const PENDING_PRESET_PREVIEW: AdvisorySchedulePreviewState = {
  ...EMPTY_ADVISORY_SCHEDULE_PREVIEW,
  loading: true,
  isValid: false,
};

export function useAdvisoryScheduleCreateForm(props: AdvisoryScheduleCreateFormProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/governance/advisory-scans";
  const searchParams = useSearchParams();
  const urlAdvancedOpen = parseAdvisorySchedulesAdvancedOpenFromSearch(searchParams.get("advanced"));
  const [form, setForm] = useState<AdvisoryScheduleFormState>(() => createDefaultAdvisoryScheduleFormState());
  const [advancedOpen, setAdvancedOpenState] = useState(urlAdvancedOpen);
  const [customCronValid, setCustomCronValid] = useState(false);
  const ianaOptions = useMemo(() => getIanaTimeZoneSelectOptions(), []);
  const mutationDisabledHintId = "advisory-schedule-create-mutate-disabled-hint";
  const mutationDisabledReason = props.canEdit ? null : whyDisabledEnterpriseMutationControl();

  const syncAdvancedToUrl = useCallback(
    (open: boolean) => {
      router.replace(advisorySchedulesPanelsHrefFromSearch(searchParams.toString(), { advancedOpen: open }, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setAdvancedOpen = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      setAdvancedOpenState((prev) => {
        const resolved = typeof value === "function" ? value(prev) : value;
        syncAdvancedToUrl(resolved);

        return resolved;
      });
    },
    [syncAdvancedToUrl],
  );

  useEffect(() => {
    setAdvancedOpenState(parseAdvisorySchedulesAdvancedOpenFromSearch(searchParams.get("advanced")));
  }, [searchParams]);

  // A new useRouter/useSearchParams wrapper can recreate syncAdvancedToUrl
  // without a new reset request. Rebuilding the form object in that case
  // caused an unbounded render/effect cycle (and potential worker OOM).
  const handledFormResetKeyRef = useRef<number | null>(null);
  useEffect(() => {
    if (handledFormResetKeyRef.current === props.formResetKey) {
      return;
    }

    handledFormResetKeyRef.current = props.formResetKey;
    setForm(createDefaultAdvisoryScheduleFormState());
    setAdvancedOpenState(false);
    syncAdvancedToUrl(false);
  }, [props.formResetKey, syncAdvancedToUrl]);

  const cronExpression = useMemo(() => buildAdvisoryScheduleCronExpression(form), [form]);
  const presetPreviewInput = useMemo(
    () => form.frequency === "custom" ? null : { cronExpression, timeZoneId: form.timeZoneId },
    [cronExpression, form.frequency, form.timeZoneId],
  );
  const [loadedPreview, setLoadedPreview] = useState<{
    input: NonNullable<typeof presetPreviewInput>;
    preview: AdvisorySchedulePreviewState;
  } | null>(null);
  const preview = presetPreviewInput === null
    ? EMPTY_ADVISORY_SCHEDULE_PREVIEW
    : loadedPreview?.input === presetPreviewInput ? loadedPreview.preview : PENDING_PRESET_PREVIEW;
  const suggestedName = useMemo(
    () => suggestedAdvisoryScheduleName(form, props.projectLabel),
    [form, props.projectLabel],
  );
  const frequencySummary = useMemo(() => describeAdvisoryScheduleFrequency(form), [form]);
  const cronPreviewValid = form.frequency === "custom" ? customCronValid : preview.isValid;
  const formReady = isAdvisoryScheduleFormReadyToCreate(form) && cronPreviewValid;

  useEffect(() => {
    if (form.frequency === "custom") {
      setCustomCronValid(false);
    }
  }, [form.frequency]);

  useEffect(() => {
    if (presetPreviewInput === null) {
      return;
    }

    let canceled = false;

    const timer = window.setTimeout(() => {
      void loadAdvisoryScheduleUpcomingPreview(presetPreviewInput.cronExpression, presetPreviewInput.timeZoneId)
        .then((next) => {
          if (!canceled) {
            setLoadedPreview({ input: presetPreviewInput, preview: next });
          }
        });
    }, ADVISORY_SCHEDULE_PREVIEW_DEBOUNCE_MS);

    return () => {
      canceled = true;
      window.clearTimeout(timer);
    };
  }, [presetPreviewInput]);

  const showFormUpcomingPreview = form.frequency !== "custom";
  const advisoryCreateSteps = resolveAdvisoryScheduleCreateChecklistSteps({
    reviewConfigured: props.runProjectSlug.trim().length > 0,
    frequencyConfigured: cronPreviewValid,
    scheduleSaved: props.createSuccess,
  });
  const advisoryCreateEmphasizedStepId = resolveAdvisoryScheduleCreateChecklistEmphasizedStepId({
    reviewConfigured: props.runProjectSlug.trim().length > 0,
    frequencyConfigured: cronPreviewValid,
    scheduleSaved: props.createSuccess,
  });

  function updateForm(patch: Partial<AdvisoryScheduleFormState>): void {
    setForm((current) => {
      const next: AdvisoryScheduleFormState = { ...current, ...patch };

      if (!current.nameTouched && patch.frequency !== undefined) {
        return {
          ...next,
          name: suggestedAdvisoryScheduleName({ ...next, nameTouched: false }, props.projectLabel),
        };
      }

      return next;
    });
  }

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();

    if (!props.canEdit || props.creating || !formReady) {
      return;
    }

    await props.onCreate({
      name: resolveAdvisoryScheduleName(form, props.projectLabel),
      cronExpression,
      runProjectSlug: props.runProjectSlug,
    });
  }

  return {
    form,
    advancedOpen,
    setAdvancedOpen,
    preview,
    customCronValid,
    setCustomCronValid,
    ianaOptions,
    mutationDisabledHintId,
    mutationDisabledReason,
    cronExpression,
    suggestedName,
    frequencySummary,
    formReady,
    showFormUpcomingPreview,
    advisoryCreateSteps,
    advisoryCreateEmphasizedStepId,
    updateForm,
    onSubmit,
    canEdit: props.canEdit,
    creating: props.creating,
    createSuccess: props.createSuccess,
  };
}

export const ADVISORY_SCHEDULE_SELECT_CLASS = cn(
  "flex h-9 w-full rounded-md border border-neutral-200 bg-transparent px-3 py-1 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:focus-visible:ring-neutral-600",
  OPERATOR_TYPOGRAPHY.body,
);

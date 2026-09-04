"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

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

export function useAdvisoryScheduleCreateForm(props: AdvisoryScheduleCreateFormProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/governance/advisory-scans";
  const searchParams = useSearchParams();
  const urlAdvancedOpen = parseAdvisorySchedulesAdvancedOpenFromSearch(searchParams.get("advanced"));
  const [form, setForm] = useState<AdvisoryScheduleFormState>(() => createDefaultAdvisoryScheduleFormState());
  const [advancedOpen, setAdvancedOpenState] = useState(urlAdvancedOpen);
  const [preview, setPreview] = useState<AdvisorySchedulePreviewState>(EMPTY_ADVISORY_SCHEDULE_PREVIEW);
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

  useEffect(() => {
    setForm(createDefaultAdvisoryScheduleFormState());
    setAdvancedOpenState(false);
    syncAdvancedToUrl(false);
  }, [props.formResetKey, syncAdvancedToUrl]);

  const cronExpression = useMemo(() => buildAdvisoryScheduleCronExpression(form), [form]);
  const suggestedName = useMemo(
    () => suggestedAdvisoryScheduleName(form, props.projectLabel),
    [form, props.projectLabel],
  );
  const frequencySummary = useMemo(() => describeAdvisoryScheduleFrequency(form), [form]);
  const cronPreviewValid = form.frequency === "custom" ? customCronValid : preview.isValid;
  const formReady = isAdvisoryScheduleFormReadyToCreate(form) && cronPreviewValid;

  useEffect(() => {
    if (form.frequency === "custom") {
      setPreview(EMPTY_ADVISORY_SCHEDULE_PREVIEW);
      setCustomCronValid(false);
    }
  }, [form.frequency]);

  useEffect(() => {
    if (form.frequency === "custom") {
      return;
    }

    let canceled = false;
    setPreview((current) => ({ ...current, loading: true }));

    const timer = window.setTimeout(() => {
      void loadAdvisoryScheduleUpcomingPreview(cronExpression, form.timeZoneId)
        .then((next) => {
          if (!canceled) {
            setPreview(next);
          }
        })
        .catch(() => {
          if (!canceled) {
            setPreview(EMPTY_ADVISORY_SCHEDULE_PREVIEW);
          }
        });
    }, ADVISORY_SCHEDULE_PREVIEW_DEBOUNCE_MS);

    return () => {
      canceled = true;
      window.clearTimeout(timer);
    };
  }, [cronExpression, form.frequency, form.timeZoneId]);

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

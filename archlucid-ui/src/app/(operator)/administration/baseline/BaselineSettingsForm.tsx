"use client";

import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type Dispatch, type FormEvent, type SetStateAction } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusTag } from "@/components/ui/status-tag";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import {
  BASELINE_REVIEW_NOTE_REQUIRES_HOURS_HELPER,
  BASELINE_REVIEW_NOTE_SAVE_READINESS,
  baselineFieldHasOwnerEstimate,
  baselineFieldProvenanceKind,
  baselineFieldProvenanceLabel,
} from "@/lib/baseline-settings-present";
import {
  baselineSettingsMethodologyDisclosureHrefFromSearch,
  parseBaselineSettingsMethodologyOpenFromSearch,
} from "@/lib/administration/baseline-settings-methodology-disclosure-url";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { WhyDisabledCtaReason } from "@/lib/why-disabled-cta";

type FieldMessageProps = {
  readonly error: string | null;
  readonly warning: string | null;
};

function FieldMessage(props: FieldMessageProps) {
  if (props.error) {
    return (
      <p className={cn("m-0 mt-1 text-red-700 dark:text-red-300", OPERATOR_TYPOGRAPHY.helper)} role="alert">
        {props.error}
      </p>
    );
  }

  if (props.warning) {
    return (
      <p className={cn("m-0 mt-1 text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)} role="status">
        {props.warning}
      </p>
    );
  }

  return null;
}

type BaselineFieldProvenanceProps = {
  readonly hasOwnerEstimate: boolean;
  readonly testId: string;
};

function BaselineFieldProvenance(props: BaselineFieldProvenanceProps) {
  return (
    <StatusTag
      kind={baselineFieldProvenanceKind(props.hasOwnerEstimate)}
      label={baselineFieldProvenanceLabel(props.hasOwnerEstimate)}
      data-testid={props.testId}
    />
  );
}

export type BaselineSettingsFormProps = {
  readonly reviewHours: string;
  readonly setReviewHours: Dispatch<SetStateAction<string>>;
  readonly reviewNote: string;
  readonly setReviewNote: Dispatch<SetStateAction<string>>;
  readonly manualPrep: string;
  readonly setManualPrep: Dispatch<SetStateAction<string>>;
  readonly people: string;
  readonly setPeople: Dispatch<SetStateAction<string>>;
  readonly reviewValidation: { readonly error: string | null; readonly warning: string | null };
  readonly prepValidation: { readonly error: string | null; readonly warning: string | null };
  readonly peopleValidation: { readonly error: string | null; readonly warning: string | null };
  readonly noteRequiresHours: boolean;
  readonly saveBlocked: boolean;
  readonly saveDisabledReason: WhyDisabledCtaReason | null;
  readonly noteWouldBeDroppedOnSave: boolean;
  readonly saving: boolean;
  readonly onSave: (event: FormEvent) => void;
  readonly onResetToLoaded: () => void;
};

export function BaselineSettingsForm(props: BaselineSettingsFormProps): React.JSX.Element {
  const {
    reviewHours,
    setReviewHours,
    reviewNote,
    setReviewNote,
    manualPrep,
    setManualPrep,
    people,
    setPeople,
    reviewValidation,
    prepValidation,
    peopleValidation,
    noteRequiresHours,
    saveBlocked,
    saveDisabledReason,
    noteWouldBeDroppedOnSave,
    saving,
    onSave,
    onResetToLoaded,
  } = props;
  const router = useRouter();
  const pathname = usePathname() ?? "/administration/baseline";
  const searchParams = useSearchParams();
  const baselineSettingsMethodologyOpenParam = searchParams.get("baselineSettingsMethodologyOpen");
  const [methodologyOpen, setMethodologyOpenState] = useState(() =>
    parseBaselineSettingsMethodologyOpenFromSearch(baselineSettingsMethodologyOpenParam),
  );

  const syncMethodologyOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        baselineSettingsMethodologyDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setMethodologyOpen = useCallback(
    (open: boolean) => {
      setMethodologyOpenState(open);
      syncMethodologyOpenToUrl(open);
    },
    [syncMethodologyOpenToUrl],
  );

  useEffect(() => {
    setMethodologyOpenState(parseBaselineSettingsMethodologyOpenFromSearch(baselineSettingsMethodologyOpenParam));
  }, [baselineSettingsMethodologyOpenParam]);

  return (
    <form onSubmit={onSave} className="space-y-4">
      <section
        className="space-y-4 rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
        aria-labelledby="baseline-review-cycle-heading"
        data-testid="baseline-review-cycle-card"
      >
        <h2
          id="baseline-review-cycle-heading"
          className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          Review cycle baseline
        </h2>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Estimate the typical effort required to move from architecture request to reviewable package before
          ArchLucid. These values estimate value in reports only — they do not affect review findings or governance
          decisions.
        </p>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Label htmlFor="baseline-review-cycle-hours">Median review-cycle hours (optional)</Label>
            <BaselineFieldProvenance
              hasOwnerEstimate={baselineFieldHasOwnerEstimate(reviewHours)}
              testId="baseline-review-cycle-provenance"
            />
          </div>
          <Input
            id="baseline-review-cycle-hours"
            type="number"
            min={0}
            step="any"
            className="mt-1 max-w-md"
            placeholder="Example: 12"
            data-testid="baseline-review-cycle-hours"
            value={reviewHours}
            onChange={(x) => setReviewHours(x.target.value)}
          />
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Typical total elapsed effort across the team for one architecture review cycle.
          </p>
          <FieldMessage error={reviewValidation.error} warning={reviewValidation.warning} />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Label htmlFor="baseline-prep">Manual preparation hours per review (optional)</Label>
            <BaselineFieldProvenance
              hasOwnerEstimate={baselineFieldHasOwnerEstimate(manualPrep)}
              testId="baseline-manual-prep-provenance"
            />
          </div>
          <Input
            id="baseline-prep"
            type="number"
            min={0}
            step="any"
            className="mt-1 max-w-md"
            data-testid="baseline-manual-prep"
            value={manualPrep}
            onChange={(x) => setManualPrep(x.target.value)}
          />
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Time spent collecting diagrams, documents, screenshots, IaC exports, and context before review.
          </p>
          <FieldMessage error={prepValidation.error} warning={prepValidation.warning} />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Label htmlFor="baseline-people">People involved per review (optional)</Label>
            <BaselineFieldProvenance
              hasOwnerEstimate={baselineFieldHasOwnerEstimate(people)}
              testId="baseline-people-provenance"
            />
          </div>
          <Input
            id="baseline-people"
            type="number"
            min={0}
            step="1"
            className="mt-1 max-w-md"
            data-testid="baseline-people"
            value={people}
            onChange={(x) => setPeople(x.target.value)}
          />
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Approximate number of architects, reviewers, engineers, or stakeholders involved.
          </p>
          <FieldMessage error={peopleValidation.error} warning={peopleValidation.warning} />
        </div>

        <div>
          <Label htmlFor="baseline-review-cycle-note">How you estimated review-cycle hours (optional)</Label>
          <textarea
            id="baseline-review-cycle-note"
            className={cn(
              "mt-1 min-h-[72px] w-full max-w-2xl rounded-md border border-neutral-300 bg-white px-3 py-2 text-al-text-primary shadow-sm outline-none ring-teal-500/40 placeholder:text-neutral-400 focus-visible:ring-2 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-al-text-secondary dark:border-neutral-700 dark:bg-neutral-950 dark:disabled:bg-neutral-900",
              OPERATOR_TYPOGRAPHY.body,
            )}
            maxLength={500}
            disabled={noteRequiresHours}
            data-testid="baseline-review-cycle-note"
            value={reviewNote}
            onChange={(x) => setReviewNote(x.target.value)}
            placeholder="Example: median from prior reviews, workshop estimate, or team lead estimate."
          />
          {noteRequiresHours ? (
            <p
              className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="baseline-review-note-requires-hours"
            >
              {BASELINE_REVIEW_NOTE_REQUIRES_HOURS_HELPER}
            </p>
          ) : null}
        </div>
      </section>

      <CollapsibleSection
        title="Assumptions and methodology"
        open={methodologyOpen}
        onToggle={setMethodologyOpen}
        sectionTestId="baseline-settings-methodology"
      >
        <ul className={cn("m-0 list-disc space-y-2 pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          <li>ROI estimates are shown as estimates, not guaranteed savings.</li>
          <li>Measured review data takes precedence when available.</li>
        </ul>
      </CollapsibleSection>

      <div
        className="sticky bottom-0 -mx-1 flex flex-wrap items-center gap-2 border-t border-neutral-200 bg-white/95 px-1 py-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95"
        data-testid="baseline-settings-actions"
      >
        <Button
          type="submit"
          disabled={saveBlocked}
          variant="primary"
          data-testid="baseline-save"
          aria-describedby={saveBlocked ? "baseline-save-disabled-hint" : undefined}
        >
          {saving ? "Saving…" : "Save"}
        </Button>
        <WhyDisabledCtaHint
          id="baseline-save-disabled-hint"
          reason={saveBlocked ? saveDisabledReason : null}
          testId="baseline-save-disabled-hint"
        />
        <Button type="button" variant="outline" disabled={saving} onClick={onResetToLoaded}>
          Reset changes
        </Button>
        {noteWouldBeDroppedOnSave && saveDisabledReason === null ? (
          <p
            className={cn("m-0 text-red-700 dark:text-red-300", OPERATOR_TYPOGRAPHY.helper)}
            role="alert"
            data-testid="baseline-review-note-save-readiness"
          >
            {BASELINE_REVIEW_NOTE_SAVE_READINESS}
          </p>
        ) : null}
      </div>
    </form>
  );
}

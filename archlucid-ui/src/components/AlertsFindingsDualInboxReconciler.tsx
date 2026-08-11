"use client";

import type { JSX } from "react";

import {
  AlertsFindingsVocabularyRail,
  type AlertsFindingsVocabularyRailProps,
} from "@/components/AlertsFindingsVocabularyRail";
import type { AlertsFindingsDualInboxReconcilerModel } from "@/lib/alerts-findings-dual-inbox";
import type { AlertsFindingsVocabularyModel } from "@/lib/vocabulary/alerts-findings-vocabulary";

export type AlertsFindingsDualInboxReconcilerProps = {
  /** Surface hosting the strip — marks the current inbox and links to the peer. */
  readonly currentSurfaceId: AlertsFindingsVocabularyRailProps["currentSurfaceId"];
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: AlertsFindingsVocabularyRailProps["variant"];
  readonly className?: string;
  /** Optional override for tests; maps TB-2221 `whyTwoInboxes` onto vocabulary `whyTwo`. */
  readonly model?: AlertsFindingsDualInboxReconcilerModel;
};

/**
 * TB-2221 / TB-2319 — Prefer {@link AlertsFindingsVocabularyRail} on new mounts.
 * Kept so existing imports continue to render the shared VocabularyRail.
 */
export function AlertsFindingsDualInboxReconciler(
  props: AlertsFindingsDualInboxReconcilerProps,
): JSX.Element {
  const vocabularyModel: AlertsFindingsVocabularyModel | undefined =
    props.model === undefined
      ? undefined
      : {
          heading: props.model.heading,
          whyTwo: props.model.whyTwoInboxes,
          compactLine: props.model.compactLine,
          alertsLink: props.model.alertsLink,
          findingsLink: props.model.findingsLink,
        };

  return (
    <AlertsFindingsVocabularyRail
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      model={vocabularyModel}
    />
  );
}

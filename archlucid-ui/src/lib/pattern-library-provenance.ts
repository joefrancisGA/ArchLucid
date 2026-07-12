import {
  isBuyerPolishedOperatorShellEnv,
  isNextPublicDemoMode,
  isOperatorExperienceFullShellEnv,
} from "@/lib/demo-ui-env";

import type { PatternLibraryProvenance } from "@/lib/pattern-library-types";
import {
  PATTERN_LIBRARY_AGGREGATE_PRIVACY_COPY,
  PATTERN_LIBRARY_DEMO_NOTICE,
  PATTERN_LIBRARY_PRIVACY_NOTE,
  PATTERN_LIBRARY_SAMPLE_NOTICE,
} from "@/lib/pattern-library-copy";

export const PATTERN_LIBRARY_MINIMUM_TENANT_THRESHOLD = 5;

export function resolvePatternLibraryProvenance(usingLiveAggregate: boolean): PatternLibraryProvenance {
  if (usingLiveAggregate) {
    return {
      badgeLabel: "Anonymized aggregate",
      notice: PATTERN_LIBRARY_AGGREGATE_PRIVACY_COPY,
      privacyNote: PATTERN_LIBRARY_PRIVACY_NOTE,
    };
  }

  if (isNextPublicDemoMode()) {
    return {
      badgeLabel: "Demo data",
      notice: PATTERN_LIBRARY_DEMO_NOTICE,
      privacyNote: PATTERN_LIBRARY_PRIVACY_NOTE,
    };
  }

  if (isOperatorExperienceFullShellEnv() && !isBuyerPolishedOperatorShellEnv()) {
    return {
      badgeLabel: "Internal test data",
      notice: PATTERN_LIBRARY_SAMPLE_NOTICE,
      privacyNote: PATTERN_LIBRARY_PRIVACY_NOTE,
    };
  }

  return {
    badgeLabel: "Sample data",
    notice: PATTERN_LIBRARY_SAMPLE_NOTICE,
    privacyNote: PATTERN_LIBRARY_PRIVACY_NOTE,
  };
}

export function isPatternLibraryNavVisible(): boolean {
  return (
    isBuyerPolishedOperatorShellEnv()
    || isNextPublicDemoMode()
    || isOperatorExperienceFullShellEnv()
  );
}

export function patternLibraryDetailPath(patternKey: string): string {
  return `/patterns/${encodeURIComponent(patternKey)}`;
}

import {
  RunDetailBelowFoldSections,
  type RunDetailBelowFoldSectionsProps,
} from "./RunDetailBelowFoldSections";

/**
 * Server-only mount for below-fold review sections.
 *
 * Do not wrap this (or {@link RunDetailBelowFoldSections}) in `next/dynamic` from a
 * `"use client"` module. That pulls the RSC timeline loader into the browser, where
 * `react.cache()` does not memoize, so `/timelines-bundle` repeats on every render.
 */
export function RunDetailBelowFoldSectionsDeferred(
  props: RunDetailBelowFoldSectionsProps,
): React.JSX.Element {
  return <RunDetailBelowFoldSections {...props} />;
}

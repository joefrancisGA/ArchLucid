"use client";

import { useMemo } from "react";

import { ArchitectureCreatedHomeViewport } from "@/components/architecture/ArchitectureCreatedHomeViewport";
import {
  buildArchitectureCreatedHomeModel,
  mergeArchitectureCreatedHomeInput,
  type BuildArchitectureCreatedHomeModelInput,
} from "@/lib/architecture-created-home-model";
import { readArchitectureCreationHandoff } from "@/lib/architecture-creation-handoff";

export type RunDetailArchitectureCreatedFirstViewportProps = {
  readonly baseline: BuildArchitectureCreatedHomeModelInput;
};

/** Merges session handoff snapshot with server run detail for the architecture home viewport. */
export function RunDetailArchitectureCreatedFirstViewport(
  props: RunDetailArchitectureCreatedFirstViewportProps,
): React.JSX.Element {
  const model = useMemo(() => {
    const snapshot = readArchitectureCreationHandoff(props.baseline.runId);
    const merged = mergeArchitectureCreatedHomeInput(props.baseline, snapshot);

    return buildArchitectureCreatedHomeModel(merged);
  }, [props.baseline]);

  return <ArchitectureCreatedHomeViewport model={model} />;
}

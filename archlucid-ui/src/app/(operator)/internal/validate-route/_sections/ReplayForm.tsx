"use client";

import { ReplayFormView } from "./ReplayFormView";
import { useReplayForm } from "./use-replay-form";

export function ReplayForm() {
  const model = useReplayForm();

  return <ReplayFormView model={model} />;
}

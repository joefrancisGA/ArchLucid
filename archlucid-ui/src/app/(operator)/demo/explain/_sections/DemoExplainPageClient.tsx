"use client";

import type { DemoExplainPageState } from "./demo-explain-page-types";
import { DemoExplainPageView } from "./DemoExplainPageView";
import type { DemoExplainPageServerLoad } from "./load-demo-explain-page-data";

type DemoExplainPageClientProps = {
  readonly loaded: DemoExplainPageServerLoad;
};

function toViewState(load: DemoExplainPageServerLoad): DemoExplainPageState {
  if (load.kind === "success") {
    return { payload: load.payload, notFound: false, error: null, loading: false };
  }

  if (load.kind === "not-found") {
    return { payload: null, notFound: true, error: null, loading: false };
  }

  return { payload: null, notFound: false, error: load.error, loading: false };
}

export function DemoExplainPageClient(props: DemoExplainPageClientProps) {
  return <DemoExplainPageView state={toViewState(props.loaded)} />;
}

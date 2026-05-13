"use client";

import { DemoExplainPageView } from "./DemoExplainPageView";
import { useDemoExplainPage } from "./use-demo-explain-page";

export function DemoExplainPageMain() {
  const state = useDemoExplainPage();

  return <DemoExplainPageView state={state} />;
}

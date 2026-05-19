"use client";

import { SystemHealthPageView } from "./SystemHealthPageView";
import { useSystemHealthPage } from "./use-system-health-page";

export function SystemHealthPageClient() {
  const model = useSystemHealthPage();

  return <SystemHealthPageView model={model} />;
}

import { getDemoExplain } from "@/lib/api";
import type { DemoExplainResponse } from "@/types/demo-explain";

import { demoExplainToSectionError } from "./demo-explain-page-helpers";
import type { DemoExplainSectionError } from "./demo-explain-page-types";

export type DemoExplainPageServerLoad =
  | { kind: "success"; payload: DemoExplainResponse }
  | { kind: "not-found" }
  | { kind: "error"; error: DemoExplainSectionError };

export async function loadDemoExplainPageData(): Promise<DemoExplainPageServerLoad> {
  try {
    const payload: DemoExplainResponse | null = await getDemoExplain();

    if (payload === null) {
      return { kind: "not-found" };
    }

    return { kind: "success", payload };
  } catch (e: unknown) {
    return {
      kind: "error",
      error: demoExplainToSectionError(e, "Could not load the demo explain payload."),
    };
  }
}

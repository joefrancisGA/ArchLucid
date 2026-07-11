import { getStartCtoDemoTourHref } from "@/lib/buyer-cto-demo-tour";
import { isCtoDemoPackEnv } from "@/lib/cto-demo-presenter-pack";

/** Shareable `/demo` entry — CTO tour step 1 when packaged demo is enabled, otherwise home. */
export function resolveDemoEntryRedirectHref(): string {
  if (!isCtoDemoPackEnv()) {
    return "/";
  }

  return getStartCtoDemoTourHref();
}

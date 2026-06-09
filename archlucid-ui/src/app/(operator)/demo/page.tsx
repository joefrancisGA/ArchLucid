import { redirect } from "next/navigation";

import { getStartCtoDemoTourHref } from "@/lib/buyer-cto-demo-tour";
import { isCtoDemoPackEnv } from "@/lib/cto-demo-presenter-pack";

/** Shareable demo entry — lands on step 1 of the CTO tour (#18). */
export default function DemoEntryPage() {
  if (!isCtoDemoPackEnv()) {
    redirect("/");
  }

  redirect(getStartCtoDemoTourHref());
}

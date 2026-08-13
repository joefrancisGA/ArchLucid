"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { PilotBaselineWizard } from "@/components/PilotBaselineWizard";
import { usePilotRoiBaselineCompleteness } from "@/hooks/use-pilot-roi-baseline-completeness";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { PILOT_BASELINE_WIZARD_OPEN_EVENT } from "@/lib/pilot-baseline-wizard-events";
import { suppressPilotRoiBaselineChrome } from "@/lib/pilot-roi-baseline-chrome";
import { pathnameIsInAppHelpTopic } from "@/lib/usability/page-help-topic-map";

/** ROI baseline wizard host — dialog only; opens from sidebar, Home inline prompts, or explicit CTAs. */

export function PilotBaselineWizardLauncher(): React.ReactElement | null {
  const pathname = usePathname() ?? "/";
  const demoMode = isNextPublicDemoMode();
  const { reload } = usePilotRoiBaselineCompleteness({ enabled: false });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [chromeSuppressed, setChromeSuppressed] = useState(false);

  useEffect(() => {
    setChromeSuppressed(suppressPilotRoiBaselineChrome());
  }, []);

  useEffect(() => {
    function onOpenRequested(): void {
      setDialogOpen(true);
    }

    window.addEventListener(PILOT_BASELINE_WIZARD_OPEN_EVENT, onOpenRequested);

    return () => {
      window.removeEventListener(PILOT_BASELINE_WIZARD_OPEN_EVENT, onOpenRequested);
    };
  }, []);

  useEffect(() => {
    if (!dialogOpen) {
      return;
    }

    void reload();
  }, [dialogOpen, reload]);

  if (demoMode || chromeSuppressed || pathnameIsInAppHelpTopic(pathname)) {
    return null;
  }

  return <PilotBaselineWizard open={dialogOpen} onOpenChange={setDialogOpen} onSaved={() => void reload()} />;
}

"use client";

import { ClipboardList } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { PilotBaselineWizard } from "@/components/PilotBaselineWizard";
import { Button } from "@/components/ui/button";
import { usePilotRoiBaselineCompleteness } from "@/hooks/use-pilot-roi-baseline-completeness";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { PILOT_BASELINE_WIZARD_OPEN_EVENT } from "@/lib/pilot-baseline-wizard-events";
import { suppressPilotRoiBaselineChrome } from "@/lib/pilot-roi-baseline-chrome";

/** ROI baseline wizard — FAB when incomplete; opens only from explicit operator actions. */

export function PilotBaselineWizardLauncher(): React.ReactElement | null {
  const demoMode = isNextPublicDemoMode();
  const { loading, complete, reload } = usePilotRoiBaselineCompleteness();
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

  const openWizard = useCallback(() => {
    setDialogOpen(true);
  }, []);

  if (demoMode || chromeSuppressed) {
    return null;
  }

  const showFab = complete === false && !loading;

  return (
    <>
      <PilotBaselineWizard open={dialogOpen} onOpenChange={setDialogOpen} onSaved={() => void reload()} />

      {showFab ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          data-testid="pilot-baseline-wizard-launcher-fab"
          title="Capture tenant ROI baselines required for sponsor-ready exports"
          className="fixed bottom-5 left-4 z-40 h-11 gap-2 rounded-full px-4 shadow-lg print:!hidden lg:bottom-7"
          aria-haspopup="dialog"
          aria-expanded={dialogOpen}
          onClick={openWizard}
        >
          <ClipboardList className="h-4 w-4 shrink-0" aria-hidden />
          <span>ROI baseline</span>
        </Button>
      ) : null}
    </>
  );
}

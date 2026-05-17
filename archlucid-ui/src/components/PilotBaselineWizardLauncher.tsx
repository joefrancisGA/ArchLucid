"use client";

import { ClipboardList } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type ReactElement } from "react";

import { PilotBaselineWizard } from "@/components/PilotBaselineWizard";
import { Button } from "@/components/ui/button";
import { usePilotRoiBaselineCompleteness } from "@/hooks/use-pilot-roi-baseline-completeness";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { PILOT_BASELINE_WIZARD_OPEN_EVENT } from "@/lib/pilot-baseline-wizard-events";

const SESSION_AUTOSHOW_KEY = "archlucid-pilot-baseline-wizard-autoShown-session";

function suppressPilotBaselineWizardChrome(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  if (process.env.NEXT_PUBLIC_SUPPRESS_CORE_PILOT_WIZARD === "1") {
    return true;
  }

  const navigatorLike = window.navigator as Navigator & { webdriver?: boolean };

  if (navigatorLike.webdriver === true) {
    return true;
  }

  return false;
}

/** First-run style ROI baseline wizard — FAB when incomplete + optional auto-open on operator home. */

export function PilotBaselineWizardLauncher(): React.ReactElement | null {
  const pathname = usePathname();
  const demoMode = isNextPublicDemoMode();
  const { loading, complete, reload } = usePilotRoiBaselineCompleteness();
  const [dialogOpen, setDialogOpen] = useState(false);

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
    if (demoMode || suppressPilotBaselineWizardChrome() || loading || complete !== false || pathname !== "/") {
      return;
    }

    try {
      if (sessionStorage.getItem(SESSION_AUTOSHOW_KEY) === "1") {
        return;
      }

      sessionStorage.setItem(SESSION_AUTOSHOW_KEY, "1");
      setDialogOpen(true);
    } catch {
      /* private mode quota */
    }
  }, [complete, demoMode, loading, pathname]);

  const openWizard = useCallback(() => {
    setDialogOpen(true);
  }, []);

  if (demoMode || suppressPilotBaselineWizardChrome()) {
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

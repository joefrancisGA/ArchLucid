"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { PilotBaselineWizard } from "@/components/PilotBaselineWizard";
import { usePilotRoiBaselineCompleteness } from "@/hooks/use-pilot-roi-baseline-completeness";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import {
  parsePilotRoiWizardOpenFromSearch,
  parsePilotRoiWizardStepFromSearch,
  pilotRoiBaselineWizardHrefFromSearch,
} from "@/lib/operator/pilot-roi-baseline-wizard-url";
import { PILOT_BASELINE_WIZARD_OPEN_EVENT } from "@/lib/pilot-baseline-wizard-events";
import { suppressPilotRoiBaselineChrome } from "@/lib/pilot-roi-baseline-chrome";
import { pathnameIsInAppHelpTopic } from "@/lib/usability/page-help-topic-map";

/** ROI baseline wizard host — dialog only; opens from sidebar, Home inline prompts, or explicit CTAs. */

export function PilotBaselineWizardLauncher(): React.ReactElement | null {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const urlWizardOpen = parsePilotRoiWizardOpenFromSearch(searchParams.get("roiWizard"));
  const urlWizardStep = parsePilotRoiWizardStepFromSearch(searchParams.get("roiStep"));
  const demoMode = isNextPublicDemoMode();
  const { reload } = usePilotRoiBaselineCompleteness({ enabled: false });
  const [dialogOpen, setDialogOpenState] = useState(urlWizardOpen);
  const [chromeSuppressed, setChromeSuppressed] = useState(false);

  const syncWizardOpenToUrl = useCallback(
    (open: boolean, stepIndex: number | null = urlWizardStep) => {
      router.replace(
        pilotRoiBaselineWizardHrefFromSearch(searchParams.toString(), { open, stepIndex }, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams, urlWizardStep],
  );

  const setDialogOpen = useCallback(
    (open: boolean) => {
      setDialogOpenState(open);
      syncWizardOpenToUrl(open, open ? urlWizardStep : null);
    },
    [syncWizardOpenToUrl, urlWizardStep],
  );

  useEffect(() => {
    setChromeSuppressed(suppressPilotRoiBaselineChrome());
  }, []);

  useEffect(() => {
    setDialogOpenState(urlWizardOpen);
  }, [urlWizardOpen]);

  useEffect(() => {
    function onOpenRequested(): void {
      setDialogOpen(true);
    }

    window.addEventListener(PILOT_BASELINE_WIZARD_OPEN_EVENT, onOpenRequested);

    return () => {
      window.removeEventListener(PILOT_BASELINE_WIZARD_OPEN_EVENT, onOpenRequested);
    };
  }, [setDialogOpen]);

  useEffect(() => {
    if (!dialogOpen) {
      return;
    }

    void reload();
  }, [dialogOpen, reload]);

  if (demoMode || chromeSuppressed || pathnameIsInAppHelpTopic(pathname)) {
    return null;
  }

  return (
    <PilotBaselineWizard
      open={dialogOpen}
      onOpenChange={setDialogOpen}
      initialStepIndex={urlWizardStep}
      onStepIndexChange={(stepIndex) => {
        syncWizardOpenToUrl(true, stepIndex);
      }}
      onSaved={() => void reload()}
    />
  );
}

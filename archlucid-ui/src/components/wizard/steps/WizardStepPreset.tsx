"use client";

import Link from "next/link";
import { useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { WizardStepPanel } from "@/components/wizard/WizardStepPanel";
import { applyWizardPreset, wizardPresets } from "@/lib/wizard-presets";
import { verticalBriefWizardPresets } from "@/lib/vertical-wizard-presets";
import { buildDefaultWizardValues, type WizardFormValues } from "@/lib/wizard-schema";

export type WizardStepPresetProps = {
  /** Optional hook for analytics/tests when a named preset is applied (not fired for “Use defaults”). */
  onPresetSelect?: (presetId: string) => void;
  /** Trial onboarding: highlight the seeded demo run created for this tenant. */
  featuredSampleRunId?: string | null;
};

/**
 * Step 1: pick a preset or start from scratch (`reset` with defaults).
 */
export function WizardStepPreset(props: WizardStepPresetProps = {}) {
  const { onPresetSelect, featuredSampleRunId } = props;
  const { reset } = useFormContext<WizardFormValues>();

  const selectPreset = (presetId: string, values: Partial<WizardFormValues>) => {
    onPresetSelect?.(presetId);
    const merged = applyWizardPreset(buildDefaultWizardValues(), values);
    reset(merged);
  };

  const startScratch = () => {
    reset(buildDefaultWizardValues());
  };

  return (
    <WizardStepPanel
      title="Choose a starting point"
      description="Pick a template to pre-fill common fields, or start from scratch with validated defaults."
    >
      {featuredSampleRunId !== null && featuredSampleRunId !== undefined && featuredSampleRunId.length > 0 ? (
        <Card className="mb-4 border-teal-200 bg-teal-50/80 dark:border-teal-900 dark:bg-teal-950/40">
          <CardHeader>
            <CardTitle className="text-base text-teal-950 dark:text-teal-50">Trial sample run (pre-seeded)</CardTitle>
            <CardDescription className="text-teal-900/90 dark:text-teal-100/90">
              Open the governed demo pipeline we created for your workspace, or continue below to author a brand-new
              architecture request.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild type="button" className="w-full sm:w-auto">
              <Link href={`/runs/${featuredSampleRunId}`} data-testid="wizard-open-trial-sample-run">
                Open sample run
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ) : null}

      <div className="mb-6">
        <h3 className="mb-1 text-base font-semibold text-neutral-900 dark:text-neutral-100">
          Start from a vertical template
        </h3>
        <p className="mb-3 max-w-prose text-sm text-neutral-600 dark:text-neutral-400">
          Pre-fill the wizard with regulated-industry starters (see{" "}
          <Link href="https://github.com/joefrancisGA/ArchLucid/blob/main/templates/README.md#vertical-industry-starters-prompt-11">
            templates/README.md
          </Link>
          ). Pair with a matching policy pack from Policy packs → Import a vertical policy pack.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {verticalBriefWizardPresets.map((preset) => (
            <Card key={preset.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-base">{preset.label}</CardTitle>
                <CardDescription>{preset.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1" />
              <CardFooter>
                <Button
                  type="button"
                  className="w-full"
                  variant="secondary"
                  onClick={() => selectPreset(preset.id, preset.values)}
                >
                  Use vertical template
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {wizardPresets.map((preset) => (
          <Card key={preset.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-base">{preset.label}</CardTitle>
              <CardDescription>{preset.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1" />
            <CardFooter>
              <Button
                type="button"
                className="w-full"
                variant="default"
                onClick={() => selectPreset(preset.id, preset.values)}
              >
                Select
              </Button>
            </CardFooter>
          </Card>
        ))}
        <Card className="flex flex-col border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Start from scratch</CardTitle>
            <CardDescription>Reset the form to empty lists and placeholder text only.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1" />
          <CardFooter>
            <Button type="button" className="w-full" variant="outline" onClick={startScratch}>
              Use defaults
            </Button>
          </CardFooter>
        </Card>
      </div>
    </WizardStepPanel>
  );
}

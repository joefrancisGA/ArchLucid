"use client";

import { useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { WizardStepPanel } from "@/components/wizard/WizardStepPanel";
import { applyWizardPreset, wizardPresets } from "@/lib/wizard-presets";
import { buildDefaultWizardValues, type WizardFormValues } from "@/lib/wizard-schema";

export type WizardStepPresetProps = {
  /** Optional hook for analytics/tests when a named preset is applied (not fired for “Use defaults”). */
  onPresetSelect?: (presetId: string) => void;
};

/**
 * Step 1: pick a preset or start from scratch (`reset` with defaults).
 */
export function WizardStepPreset(props: WizardStepPresetProps = {}) {
  const { onPresetSelect } = props;
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

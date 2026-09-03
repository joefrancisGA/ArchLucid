"use client";

import { useCallback, useEffect, useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  EXPERT_INTAKE_POSTURE_LABEL,
  EXPERT_INTAKE_POSTURE_LEAD,
  readExpertIntakePostureEnabled,
  writeExpertIntakePostureEnabled,
} from "@/lib/expert-intake-posture";
import { cn } from "@/lib/utils";

export function ExpertIntakePostureToggle(): React.JSX.Element | null {
  const [enabled, setEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setEnabled(readExpertIntakePostureEnabled());
    setMounted(true);
  }, []);

  const onCheckedChange = useCallback((checked: boolean | "indeterminate") => {
    const next = checked === true;
    writeExpertIntakePostureEnabled(next);
    setEnabled(next);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div
      className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-950/40"
      data-testid="expert-intake-posture-toggle"
    >
      <div className="flex items-start gap-2">
        <Checkbox
          id="expert-intake-posture"
          checked={enabled}
          data-testid="expert-intake-posture-checkbox"
          onCheckedChange={onCheckedChange}
        />
        <div className="min-w-0">
          <Label htmlFor="expert-intake-posture" className={cn("font-semibold", OPERATOR_TYPOGRAPHY.body)}>
            {EXPERT_INTAKE_POSTURE_LABEL}
          </Label>
          <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            {EXPERT_INTAKE_POSTURE_LEAD}
          </p>
        </div>
      </div>
    </div>
  );
}

/** Hook for intake wizards — expert posture hides progressive teaching blocks. */
export function useExpertIntakePostureEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(readExpertIntakePostureEnabled());
  }, []);

  return enabled;
}

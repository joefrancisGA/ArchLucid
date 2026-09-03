"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import {
  WORKSPACE_MODE_GRADUATION_CHANGES,
  WORKSPACE_MODE_GRADUATION_KEEP_GUIDED_CTA,
  WORKSPACE_MODE_GRADUATION_LEAD,
  WORKSPACE_MODE_GRADUATION_REMIND_CTA,
  WORKSPACE_MODE_GRADUATION_SWITCH_CTA,
  WORKSPACE_MODE_GRADUATION_TITLE,
  WORKSPACE_MODE_GRADUATION_UNCHANGED,
} from "@/lib/workspace-mode/workspace-mode-copy";
import { persistWorkspaceModeGraduationOfferToServer } from "@/lib/workspace-mode/workspace-mode-preference";

export type WorkspaceModeGraduationOfferProps = {
  readonly onSwitchToWorking: () => void;
  readonly onDismiss: () => void;
};

/** Shown after the user's first sealed review when Guided mode is active. Never auto-switches. */
export function WorkspaceModeGraduationOffer(props: WorkspaceModeGraduationOfferProps) {
  return (
    <Card data-testid="workspace-mode-graduation-offer" className="border-al-accent/40">
      <CardHeader className="pb-2">
        <CardTitle className={OPERATOR_TYPOGRAPHY.sectionTitle}>{WORKSPACE_MODE_GRADUATION_TITLE}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{WORKSPACE_MODE_GRADUATION_LEAD}</p>
        <ul className={cn("m-0 list-disc space-y-1 pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {WORKSPACE_MODE_GRADUATION_CHANGES.map((change) => (
            <li key={change}>{change}</li>
          ))}
        </ul>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {WORKSPACE_MODE_GRADUATION_UNCHANGED}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            data-testid="workspace-mode-graduation-switch"
            onClick={() => {
              props.onSwitchToWorking();
            }}
          >
            {WORKSPACE_MODE_GRADUATION_SWITCH_CTA}
          </Button>
          <Button
            type="button"
            variant="outline"
            data-testid="workspace-mode-graduation-keep-guided"
            onClick={() => {
              void persistWorkspaceModeGraduationOfferToServer("dismissed");
              props.onDismiss();
            }}
          >
            {WORKSPACE_MODE_GRADUATION_KEEP_GUIDED_CTA}
          </Button>
          <Button
            type="button"
            variant="ghost"
            data-testid="workspace-mode-graduation-remind-next"
            onClick={() => {
              void persistWorkspaceModeGraduationOfferToServer("remind-next");
              props.onDismiss();
            }}
          >
            {WORKSPACE_MODE_GRADUATION_REMIND_CTA}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

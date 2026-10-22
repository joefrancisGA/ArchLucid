"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import {
  WORKSPACE_MODE_GUIDED_TEACHING_OFFER_KEEP_WORKING_CTA,
  WORKSPACE_MODE_GUIDED_TEACHING_OFFER_LEAD,
  WORKSPACE_MODE_GUIDED_TEACHING_OFFER_SWITCH_CTA,
  WORKSPACE_MODE_GUIDED_TEACHING_OFFER_TITLE,
} from "@/lib/workspace-mode/workspace-mode-copy";

export type WorkspaceModeGuidedTeachingOfferProps = {
  readonly onSwitchToGuided: () => void;
  readonly onDismiss: () => void;
};

/** Optional offer to switch from Working to Guided after the first sealed review. */
export function WorkspaceModeGuidedTeachingOffer(props: WorkspaceModeGuidedTeachingOfferProps) {
  return (
    <Card data-testid="workspace-mode-guided-teaching-offer" className="border-al-accent/40">
      <CardHeader className="pb-2">
        <CardTitle className={OPERATOR_TYPOGRAPHY.sectionTitle}>{WORKSPACE_MODE_GUIDED_TEACHING_OFFER_TITLE}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {WORKSPACE_MODE_GUIDED_TEACHING_OFFER_LEAD}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            data-testid="workspace-mode-guided-teaching-switch"
            onClick={() => {
              props.onSwitchToGuided();
            }}
          >
            {WORKSPACE_MODE_GUIDED_TEACHING_OFFER_SWITCH_CTA}
          </Button>
          <Button
            type="button"
            variant="outline"
            data-testid="workspace-mode-guided-teaching-keep-working"
            onClick={() => {
              props.onDismiss();
            }}
          >
            {WORKSPACE_MODE_GUIDED_TEACHING_OFFER_KEEP_WORKING_CTA}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

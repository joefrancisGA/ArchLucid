"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type SettingsMasterRecentChangesCardProps = {
  readonly showAuditLink: boolean;
};

export function SettingsMasterRecentChangesCard(props: SettingsMasterRecentChangesCardProps) {
  if (!props.showAuditLink) {
    return null;
  }

  return (
    <Card data-testid="settings-recent-changes-card">
      <CardHeader>
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Recent settings changes</CardTitle>
      </CardHeader>
      <CardContent className={cn("space-y-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        <p className="m-0">
          Configuration changes are recorded in the workspace audit trail with actor, timestamp, and event type.
        </p>
        <p className={cn("m-0 italic", OPERATOR_TYPOGRAPHY.helper)}>
          No inline history on this overview — open the audit trail for governed change details.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link className={OPERATOR_LINK.nav} href="/governance/audit">
            Open audit trail
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

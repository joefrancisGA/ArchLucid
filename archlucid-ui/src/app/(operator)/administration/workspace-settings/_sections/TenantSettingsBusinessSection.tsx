"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactNode } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { SupportBundleDownloadButton } from "@/components/SupportBundleDownloadButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { DIGESTS_SCHEDULE_TAB_PATH } from "@/lib/settings-admin-route-paths";

import { TenantCostSettingsCard } from "./TenantCostSettingsCard";
import { TenantFindingEngineControlsCard } from "./TenantFindingEngineControlsCard";
import { TenantQualityGatesCard } from "./TenantQualityGatesCard";

type SectionHeadingProps = { readonly children: ReactNode };

function SectionHeading({ children }: SectionHeadingProps) {
  return (
    <h2
      className={cn(
        "m-0 border-b border-neutral-200 pb-1 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.sectionTitle,
      )}
    >
      {children}
    </h2>
  );
}

type Props = {
  readonly canEdit: boolean;
  readonly advancedQualityOpen: boolean;
  readonly onAdvancedQualityToggle: (open: boolean) => void;
};

export function TenantSettingsBusinessSection({
  canEdit,
  advancedQualityOpen,
  onAdvancedQualityToggle,
}: Props) {
  return (
    <>
      <SectionHeading>Business settings</SectionHeading>

      <TenantCostSettingsCard canEdit={canEdit} />

      <Card>
        <CardHeader>
          <CardTitle as="h3" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            Sponsor digest (email)
          </CardTitle>
        </CardHeader>
        <CardContent className={cn("space-y-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          <p className="m-0">
            Recipients, time zone, and send schedule are managed on the Digests hub, alongside delivery readiness and
            subscription health.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href={DIGESTS_SCHEDULE_TAB_PATH}>Open digest schedule</Link>
          </Button>
        </CardContent>
      </Card>

      <SectionHeading>Support &amp; diagnostics</SectionHeading>

      <Card>
        <CardHeader>
          <CardTitle as="h3" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            Support bundle
          </CardTitle>
        </CardHeader>
        <CardContent className={cn("space-y-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          <p className="m-0">
            Download a redacted diagnostics bundle to include with a support ticket.
          </p>
          <SupportBundleDownloadButton showDiagnosticsLink />
        </CardContent>
      </Card>

      <SectionHeading>Advanced — AI quality controls</SectionHeading>

      <CollapsibleSection
        title="Quality control settings"
        defaultOpen={false}
        open={advancedQualityOpen}
        onToggle={onAdvancedQualityToggle}
        sectionTestId="tenant-advanced-section"
      >
        <p className={cn("mb-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Configure how strictly ArchLucid evaluates generated review output before it is accepted. These settings affect
          AI spend and review pipeline behavior — leave at host defaults unless directed by support.
        </p>
        <div className="space-y-4">
          {advancedQualityOpen ? <TenantFindingEngineControlsCard /> : null}
          {advancedQualityOpen ? <TenantQualityGatesCard /> : null}
        </div>
      </CollapsibleSection>
    </>
  );
}

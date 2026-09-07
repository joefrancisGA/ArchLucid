"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { TenantSettingsOrganizationCards } from "./TenantSettingsOrganizationCards";
import type { TenantSettingsPageContentModel } from "./tenant-settings-page-view-model";

type SectionHeadingProps = {
  readonly children: ReactNode;
  readonly id: string;
};

function SectionHeading({ id, children }: SectionHeadingProps) {
  return (
    <h2
      id={id}
      className={cn(
        "m-0 scroll-mt-24 border-b border-neutral-200 pb-1 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.sectionTitle,
      )}
    >
      {children}
    </h2>
  );
}

type Props = {
  readonly tenantDisplayName: string;
  readonly scope: Readonly<Record<string, string>>;
  readonly model: TenantSettingsPageContentModel;
  readonly buyerPolishedShell?: boolean;
};

export function TenantSettingsGeneralSection({ tenantDisplayName, scope, model, buyerPolishedShell = false }: Props) {
  return (
    <>
      <SectionHeading id="tenant-settings-section-general">General</SectionHeading>
      <TenantSettingsOrganizationCards
        tenantDisplayName={tenantDisplayName}
        scope={scope}
        model={model}
        buyerPolishedShell={buyerPolishedShell}
      />
    </>
  );
}

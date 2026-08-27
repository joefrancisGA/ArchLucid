"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { TenantSettingsOrganizationCards } from "./TenantSettingsOrganizationCards";
import type { TenantSettingsPageContentModel } from "./tenant-settings-page-view-model";

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
  readonly tenantDisplayName: string;
  readonly scope: Readonly<Record<string, string>>;
  readonly model: TenantSettingsPageContentModel;
};

export function TenantSettingsGeneralSection({ tenantDisplayName, scope, model }: Props) {
  return (
    <>
      <SectionHeading>General</SectionHeading>
      <TenantSettingsOrganizationCards tenantDisplayName={tenantDisplayName} scope={scope} model={model} />
    </>
  );
}

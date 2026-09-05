"use client";

import { useEffect, memo, type ReactNode } from "react";

import { useTenantBrandingPresentationQuery } from "@/hooks/use-tenant-branding-presentation-query";
import {
  applyTenantBrandCssVars,
  clearTenantBrandCssVars,
} from "@/lib/design-tokens-brand";

/** Applies resolved tenant `--brand-*` tokens on operator surfaces without touching `--al-status-*`. */
export const TenantBrandCssVarsProvider = memo(function TenantBrandCssVarsProvider(props: {
  readonly children: ReactNode;
}): React.JSX.Element {
  const { data: presentation } = useTenantBrandingPresentationQuery({
    context: "ApplicationHeader",
  });

  useEffect(() => {
    if (!presentation || presentation.isProductBrand || !presentation.usesTenantVisualBrand) {
      clearTenantBrandCssVars();

      return;
    }

    applyTenantBrandCssVars(presentation.colors);
  }, [presentation]);

  return <>{props.children}</>;
});

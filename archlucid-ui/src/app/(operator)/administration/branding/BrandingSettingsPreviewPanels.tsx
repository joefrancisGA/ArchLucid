"use client";

import Image from "next/image";
import { useEffect } from "react";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { applyTenantBrandCssVars } from "@/lib/design-tokens-brand";
import { productLineGeneratedByLine, productLinePoweredByLine } from "@/lib/product-line/product-line-display-name";
import { resolveBrandAssetContentUrl } from "@/lib/tenant-branding-admin-client";
import { cn } from "@/lib/utils";

import type { TenantBrandingAdminSettingsState } from "./use-tenant-branding-admin-settings";

type BrandingSettingsPreviewPanelsProps = {
  readonly settings: TenantBrandingAdminSettingsState;
};

function PreviewShell(props: {
  readonly title: string;
  readonly theme: "light" | "dark";
  readonly children: React.ReactNode;
}) {
  const isDark = props.theme === "dark";

  return (
    <div
      className={cn(
        "rounded-md border border-neutral-200 p-4 dark:border-neutral-800",
        isDark ? "bg-neutral-950 text-neutral-50" : "bg-white text-neutral-900",
      )}
      data-testid={`branding-preview-${props.theme}`}
    >
      <p className={cn("mb-3 font-medium", OPERATOR_TYPOGRAPHY.helper)}>{props.title}</p>
      {props.children}
    </div>
  );
}

export function BrandingSettingsPreviewPanels(props: BrandingSettingsPreviewPanelsProps) {
  const { fields } = props.settings;
  const { productLine } = useProductLine();
  const poweredByLine = productLinePoweredByLine(productLine);
  const generatedByLine = productLineGeneratedByLine(productLine);
  const logoUrl = resolveBrandAssetContentUrl(fields.logoPrimaryAssetId);

  useEffect(() => {
    applyTenantBrandCssVars({
      primary: fields.primaryColor,
      secondary: fields.secondaryColor,
      accent: fields.accentColor,
      background: fields.backgroundColor,
      foreground: fields.foregroundColor,
    });
  }, [fields.accentColor, fields.backgroundColor, fields.foregroundColor, fields.primaryColor, fields.secondaryColor]);

  const displayName = fields.companyDisplayName.trim().length > 0
    ? fields.companyDisplayName.trim()
    : "Company name";

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <PreviewShell title="Header preview (light)" theme="light">
        <div
          className="flex items-center gap-2 rounded border border-neutral-200 bg-[var(--brand-background,#fafafa)] px-3 py-2"
          data-testid="branding-preview-masthead-light"
        >
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt=""
              aria-hidden
              width={32}
              height={32}
              unoptimized
              className="h-8 w-auto max-w-[8rem] object-contain"
            />
          ) : null}
          <span className="font-semibold text-[var(--brand-foreground,#171717)]">{displayName}</span>
          {fields.coBrandingEnabled ? (
            <span className="text-xs text-al-text-secondary">{poweredByLine}</span>
          ) : null}
        </div>
      </PreviewShell>

      <PreviewShell title="Header preview (dark)" theme="dark">
        <div
          className="flex items-center gap-2 rounded border border-neutral-700 bg-neutral-900 px-3 py-2"
          data-testid="branding-preview-masthead-dark"
        >
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt=""
              aria-hidden
              width={32}
              height={32}
              unoptimized
              className="h-8 w-auto max-w-[8rem] object-contain"
            />
          ) : null}
          <span className="font-semibold text-[var(--brand-foreground,#fafafa)]">{displayName}</span>
        </div>
      </PreviewShell>

      <PreviewShell title="Report cover preview" theme="light">
        <div
          className="space-y-2 rounded border border-neutral-200 bg-[var(--brand-background,#fafafa)] p-4"
          data-testid="branding-preview-report"
        >
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt=""
              aria-hidden
              width={160}
              height={48}
              unoptimized
              className="h-12 w-auto max-w-[12rem] object-contain"
            />
          ) : null}
          <p className="text-lg font-semibold text-[var(--brand-primary,#0f766e)]">{displayName}</p>
          {fields.tagline.trim().length > 0 ? (
            <p className="text-sm text-al-text-secondary">{fields.tagline}</p>
          ) : null}
          <p className="text-xs text-al-text-secondary">{generatedByLine}</p>
        </div>
      </PreviewShell>

      <PreviewShell title="Diagram export frame" theme="light">
        <div
          className="rounded border-2 border-dashed border-[var(--brand-primary,#0f766e)] p-3"
          data-testid="branding-preview-diagram"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt=""
                aria-hidden
                width={96}
                height={24}
                unoptimized
                className="h-6 w-auto object-contain"
              />
            ) : (
              <span className="text-xs text-al-text-secondary">Logo wrapper</span>
            )}
            <span className="text-xs font-medium text-[var(--brand-primary,#0f766e)]">{displayName}</span>
          </div>
          <div className="flex h-20 items-center justify-center rounded bg-neutral-100 text-xs text-al-text-secondary">
            Mermaid diagram canvas
          </div>
        </div>
      </PreviewShell>
    </div>
  );
}

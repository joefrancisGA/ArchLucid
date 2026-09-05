/** Tenant brand CSS variables — parallel to `--al-*`; do not remap status/severity tokens. */

export const BRAND_CSS_VAR_NAMES = {
  primary: "--brand-primary",
  secondary: "--brand-secondary",
  accent: "--brand-accent",
  background: "--brand-background",
  foreground: "--brand-foreground",
} as const;

export const PRODUCT_BRAND_CSS_DEFAULTS: Record<keyof typeof BRAND_CSS_VAR_NAMES, string> = {
  primary: "#0f766e",
  secondary: "#115e59",
  accent: "#5eead4",
  background: "#fafafa",
  foreground: "#171717",
};

export type TenantBrandColorsPayload = {
  readonly primary?: string | null;
  readonly secondary?: string | null;
  readonly accent?: string | null;
  readonly background?: string | null;
  readonly foreground?: string | null;
};

export function applyTenantBrandCssVars(colors: TenantBrandColorsPayload): void {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;

  setBrandVar(root, BRAND_CSS_VAR_NAMES.primary, colors.primary, PRODUCT_BRAND_CSS_DEFAULTS.primary);
  setBrandVar(root, BRAND_CSS_VAR_NAMES.secondary, colors.secondary, PRODUCT_BRAND_CSS_DEFAULTS.secondary);
  setBrandVar(root, BRAND_CSS_VAR_NAMES.accent, colors.accent, PRODUCT_BRAND_CSS_DEFAULTS.accent);
  setBrandVar(root, BRAND_CSS_VAR_NAMES.background, colors.background, PRODUCT_BRAND_CSS_DEFAULTS.background);
  setBrandVar(root, BRAND_CSS_VAR_NAMES.foreground, colors.foreground, PRODUCT_BRAND_CSS_DEFAULTS.foreground);
}

export function clearTenantBrandCssVars(): void {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;

  for (const cssVar of Object.values(BRAND_CSS_VAR_NAMES)) {
    root.style.removeProperty(cssVar);
  }
}

function setBrandVar(
  root: HTMLElement,
  cssVar: string,
  value: string | null | undefined,
  fallback: string,
): void {
  const trimmed = value?.trim();

  if (trimmed && trimmed.length > 0) {
    root.style.setProperty(cssVar, trimmed);

    return;
  }

  root.style.removeProperty(cssVar);
}

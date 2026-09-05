import { PRODUCT_BRAND_CSS_DEFAULTS } from "@/lib/design-tokens-brand";
import type { TenantBrandingValidationIssue } from "@/types/tenant-branding-admin";

const HEX_COLOR_PATTERN = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export type TenantBrandingAdminFieldValidation = {
  readonly valid: boolean;
  readonly companyDisplayNameError: string | null;
  readonly primaryColorError: string | null;
  readonly backgroundColorError: string | null;
  readonly foregroundColorError: string | null;
  readonly activateReadinessMessage: string | null;
  readonly blockingIssueCodes: readonly string[];
};

function normalizeHexColor(raw: string): string | null {
  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;

  return HEX_COLOR_PATTERN.test(withHash) ? withHash : null;
}

function parseContrastRatio(foreground: string, background: string): number | null {
  const fg = hexToLuminance(foreground);
  const bg = hexToLuminance(background);

  if (fg === null || bg === null) {
    return null;
  }

  const lighter = Math.max(fg, bg);
  const darker = Math.min(fg, bg);

  return (lighter + 0.05) / (darker + 0.05);
}

function hexToLuminance(hex: string): number | null {
  const normalized = normalizeHexColor(hex);

  if (normalized === null) {
    return null;
  }

  const rgb = Number.parseInt(normalized.slice(1, 7), 16);
  const red = channelToLinear(((rgb >> 16) & 0xff) / 255);
  const green = channelToLinear(((rgb >> 8) & 0xff) / 255);
  const blue = channelToLinear((rgb & 0xff) / 255);

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function channelToLinear(channel: number): number {
  return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
}

/** Client-side hard validation for branding admin (TB-2005). */
export function validateTenantBrandingAdminFields(input: {
  readonly companyDisplayName: string;
  readonly primaryColor: string;
  readonly backgroundColor: string;
  readonly foregroundColor: string;
  readonly logoPrimaryAssetId: string | null;
  readonly serverIssues: readonly TenantBrandingValidationIssue[];
}): TenantBrandingAdminFieldValidation {
  const companyDisplayNameError =
    input.companyDisplayName.trim().length === 0 ? "Company display name is required." : null;

  const primary = normalizeHexColor(input.primaryColor);
  const background = normalizeHexColor(input.backgroundColor);
  const foreground = normalizeHexColor(input.foregroundColor);

  const primaryColorError = primary === null ? "Enter a valid primary hex color." : null;
  const backgroundColorError = background === null ? "Enter a valid background hex color." : null;
  const foregroundColorError = foreground === null ? "Enter a valid foreground hex color." : null;

  let contrastError: string | null = null;

  if (primaryColorError === null && backgroundColorError === null && foregroundColorError === null) {
    const ratio = parseContrastRatio(foreground!, background!);

    if (ratio !== null && ratio < 4.5) {
      contrastError = "Foreground and background must meet WCAG AA contrast (4.5:1).";
    }
  }

  const logoError =
    input.logoPrimaryAssetId == null || input.logoPrimaryAssetId.trim().length === 0
      ? "Upload a primary logo before activation."
      : null;

  const serverBlockingCodes = input.serverIssues
    .filter((issue) => issue.severity === "Error")
    .map((issue) => issue.code);

  const blockingIssueCodes = [
    ...(companyDisplayNameError !== null ? ["companyDisplayNameRequired"] : []),
    ...(primaryColorError !== null ? ["primaryColorInvalid"] : []),
    ...(backgroundColorError !== null || foregroundColorError !== null ? ["surfaceColorsInvalid"] : []),
    ...(contrastError !== null ? ["poorContrast"] : []),
    ...(logoError !== null ? ["primaryLogoRequired"] : []),
    ...serverBlockingCodes,
  ];

  const valid =
    companyDisplayNameError === null
    && primaryColorError === null
    && backgroundColorError === null
    && foregroundColorError === null
    && contrastError === null
    && logoError === null
    && serverBlockingCodes.length === 0;

  const activateReadinessMessage = valid
    ? null
    : companyDisplayNameError
      ?? contrastError
      ?? logoError
      ?? primaryColorError
      ?? backgroundColorError
      ?? foregroundColorError
      ?? "Resolve validation issues before activation.";

  return {
    valid,
    companyDisplayNameError,
    primaryColorError,
    backgroundColorError: backgroundColorError ?? contrastError,
    foregroundColorError,
    activateReadinessMessage,
    blockingIssueCodes,
  };
}

export function resolveDraftColorOrDefault(value: string, fallback: string): string {
  const normalized = normalizeHexColor(value);

  return normalized ?? fallback;
}

export function seedBrandingFormColors(): Record<"primary" | "secondary" | "accent" | "background" | "foreground", string> {
  return {
    primary: PRODUCT_BRAND_CSS_DEFAULTS.primary,
    secondary: PRODUCT_BRAND_CSS_DEFAULTS.secondary,
    accent: PRODUCT_BRAND_CSS_DEFAULTS.accent,
    background: PRODUCT_BRAND_CSS_DEFAULTS.background,
    foreground: PRODUCT_BRAND_CSS_DEFAULTS.foreground,
  };
}

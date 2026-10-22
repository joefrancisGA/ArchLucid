export type TenantBrandingValidationIssue = {
  readonly code: string;
  readonly severity: "Error" | "Warning";
  readonly message: string;
};

export type TenantBrandingDraftPayload = {
  readonly brandingProfileId?: string | null;
  readonly companyDisplayName?: string | null;
  readonly companyLegalName?: string | null;
  readonly shortDisplayName?: string | null;
  readonly logoPrimaryAssetId?: string | null;
  readonly logoSecondaryAssetId?: string | null;
  readonly logoSquareAssetId?: string | null;
  readonly logoFaviconAssetId?: string | null;
  readonly logoDarkAssetId?: string | null;
  readonly logoLightAssetId?: string | null;
  readonly logoReportCoverAssetId?: string | null;
  readonly logoMonoAssetId?: string | null;
  readonly primaryColor?: string | null;
  readonly secondaryColor?: string | null;
  readonly accentColor?: string | null;
  readonly backgroundColor?: string | null;
  readonly foregroundColor?: string | null;
  readonly tagline?: string | null;
  readonly websiteUrl?: string | null;
  readonly supportUrl?: string | null;
  readonly coBrandingEnabled?: boolean;
  readonly updatedUtc?: string | null;
};

export type TenantBrandingAdminState = {
  readonly draft: TenantBrandingDraftPayload;
  readonly active: {
    readonly isActive: boolean;
    readonly version?: number | null;
    readonly updatedUtc?: string | null;
  };
  readonly productDefaults: {
    readonly primary?: string | null;
    readonly secondary?: string | null;
    readonly accent?: string | null;
    readonly background?: string | null;
    readonly foreground?: string | null;
  };
  readonly validationIssues: readonly TenantBrandingValidationIssue[];
  readonly canActivate: boolean;
};

export type TenantBrandingDraftPutRequest = {
  readonly companyDisplayName?: string | null;
  readonly companyLegalName?: string | null;
  readonly shortDisplayName?: string | null;
  readonly logoPrimaryAssetId?: string | null;
  readonly logoSecondaryAssetId?: string | null;
  readonly logoSquareAssetId?: string | null;
  readonly logoFaviconAssetId?: string | null;
  readonly logoDarkAssetId?: string | null;
  readonly logoLightAssetId?: string | null;
  readonly logoReportCoverAssetId?: string | null;
  readonly logoMonoAssetId?: string | null;
  readonly primaryColor?: string | null;
  readonly secondaryColor?: string | null;
  readonly accentColor?: string | null;
  readonly backgroundColor?: string | null;
  readonly foregroundColor?: string | null;
  readonly tagline?: string | null;
  readonly websiteUrl?: string | null;
  readonly supportUrl?: string | null;
  readonly coBrandingEnabled?: boolean;
};

export type TenantBrandingActivateResponse = {
  readonly succeeded: boolean;
  readonly state?: TenantBrandingAdminState | null;
  readonly validationIssues: readonly TenantBrandingValidationIssue[];
};

export type BrandAssetType =
  | "LogoPrimary"
  | "LogoSecondary"
  | "LogoSquare"
  | "LogoFavicon"
  | "LogoDark"
  | "LogoLight"
  | "LogoReportCover"
  | "LogoMono"
  | "Other";

export type BrandAssetResponse = {
  readonly assetId: string;
  readonly assetType: string;
  readonly originalFileName: string;
  readonly mimeType: string;
  readonly width?: number | null;
  readonly height?: number | null;
};

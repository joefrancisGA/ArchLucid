import type { CloudPlatformScope } from "@/lib/cloud-platform-scope-storage";
import type { ColorModePreference } from "@/lib/color-mode-preference";
import { DEFAULT_LOADED_HOURLY_USD } from "@/lib/roi-assumptions";
import type { WorkspaceModeId } from "@/lib/workspace-mode/workspace-mode";
import type { WorkspaceModeGraduationOfferState } from "@/lib/workspace-mode/workspace-mode-preference";

export type CloudPlatformScopeDto = {
  readonly "evidence-only": boolean;
  readonly azure: boolean;
  readonly aws: boolean;
  readonly gcp: boolean;
};

export type UserPreferencesResponse = {
  appearancePreference: ColorModePreference;
  appearancePreferenceIsExplicit: boolean;
  cloudPlatformScope: CloudPlatformScopeDto;
  cloudPlatformScopeIsExplicit: boolean;
  whereToGoNextEnabled: boolean;
  whereToGoNextIsExplicit: boolean;
  sampleReviewsOnOverviewEnabled: boolean;
  sampleReviewsOnOverviewIsExplicit: boolean;
  ianaTimeZoneId: string;
  ianaTimeZoneIsExplicit: boolean;
  workspaceMode: WorkspaceModeId;
  workspaceModeIsExplicit: boolean;
  workspaceModeGraduationOffer: WorkspaceModeGraduationOfferState;
  workspaceModeGraduationOfferIsExplicit: boolean;
  professionalWorkbenchEnabled: boolean;
  professionalWorkbenchEnabledIsExplicit: boolean;
  roiLoadedHourlyCostUsd: number;
  roiLoadedHourlyCostUsdIsExplicit: boolean;
  findingsHideGenericEnabled: boolean;
  findingsHideGenericEnabledIsExplicit: boolean;
  findingsShowLowConfidenceEnabled: boolean;
  findingsShowLowConfidenceEnabledIsExplicit: boolean;
  findingsShowAdvisoryEnabled: boolean;
  findingsShowAdvisoryEnabledIsExplicit: boolean;
  deskContinuity: DeskContinuityDto;
  deskContinuityIsExplicit: boolean;
};

export type DeskContinuityDto = {
  readonly lastOpenReviewId?: string | null;
  readonly lastOpenDraftId?: string | null;
  readonly lastVisitWatermarkUtc?: string | null;
};

export type SetAppearancePreferenceRequest = {
  value: ColorModePreference;
};

export type SetCloudPlatformScopeRequest = {
  scope: CloudPlatformScopeDto;
};

export type SetWhereToGoNextVisibilityRequest = {
  enabled: boolean;
};

export type SetSampleReviewsOnOverviewVisibilityRequest = {
  enabled: boolean;
};

export type SetIanaTimeZonePreferenceRequest = {
  ianaTimeZoneId: string;
};

export type SetWorkspaceModeRequest = {
  mode: WorkspaceModeId;
};

export type SetWorkspaceModeGraduationOfferRequest = {
  state: WorkspaceModeGraduationOfferState;
};

export type SetProfessionalWorkbenchEnabledRequest = {
  enabled: boolean;
};

export type SetRoiLoadedHourlyCostUsdRequest = {
  hourlyCostUsd: number;
};

export type SetFindingsVisibilityPreferencesRequest = {
  hideGenericEnabled: boolean;
  showLowConfidenceEnabled: boolean;
  showAdvisoryEnabled: boolean;
};

export type SetDeskContinuityRequest = {
  continuity: DeskContinuityDto;
};

export type FindingsVisibilityPreferences = {
  readonly hideGenericEnabled: boolean;
  readonly showLowConfidenceEnabled: boolean;
  readonly showAdvisoryEnabled: boolean;
};

export const DEFAULT_CLOUD_PLATFORM_SCOPE_DTO: CloudPlatformScopeDto = {
  "evidence-only": true,
  azure: true,
  aws: true,
  gcp: true,
};

export const DEFAULT_IANA_TIME_ZONE_ID = "UTC";

/** Matches prior module-level TTL; TanStack `staleTime` for cross-tree dedupe (TB-2303). */
export const USER_PREFERENCES_STALE_MS = 30_000;

export function defaultUserPreferencesResponse(): UserPreferencesResponse {
  return {
    appearancePreference: "system",
    appearancePreferenceIsExplicit: false,
    cloudPlatformScope: DEFAULT_CLOUD_PLATFORM_SCOPE_DTO,
    cloudPlatformScopeIsExplicit: false,
    whereToGoNextEnabled: true,
    whereToGoNextIsExplicit: false,
    sampleReviewsOnOverviewEnabled: true,
    sampleReviewsOnOverviewIsExplicit: false,
    ianaTimeZoneId: DEFAULT_IANA_TIME_ZONE_ID,
    ianaTimeZoneIsExplicit: false,
    workspaceMode: "guided",
    workspaceModeIsExplicit: false,
    workspaceModeGraduationOffer: "pending",
    workspaceModeGraduationOfferIsExplicit: false,
    professionalWorkbenchEnabled: true,
    professionalWorkbenchEnabledIsExplicit: false,
    roiLoadedHourlyCostUsd: DEFAULT_LOADED_HOURLY_USD,
    roiLoadedHourlyCostUsdIsExplicit: false,
    findingsHideGenericEnabled: false,
    findingsHideGenericEnabledIsExplicit: false,
    findingsShowLowConfidenceEnabled: false,
    findingsShowLowConfidenceEnabledIsExplicit: false,
    findingsShowAdvisoryEnabled: false,
    findingsShowAdvisoryEnabledIsExplicit: false,
    deskContinuity: defaultDeskContinuityDto(),
    deskContinuityIsExplicit: false,
  };
}

export function defaultDeskContinuityDto(): DeskContinuityDto {
  return {
    lastOpenReviewId: null,
    lastOpenDraftId: null,
    lastVisitWatermarkUtc: null,
  };
}

export function toCloudPlatformScopeDto(scope: CloudPlatformScope): CloudPlatformScopeDto {
  return {
    "evidence-only": scope["evidence-only"],
    azure: scope.azure,
    aws: scope.aws,
    gcp: scope.gcp,
  };
}

export function fromCloudPlatformScopeDto(dto: CloudPlatformScopeDto): CloudPlatformScope {
  return {
    "evidence-only": dto["evidence-only"],
    azure: dto.azure,
    aws: dto.aws,
    gcp: dto.gcp,
  };
}
